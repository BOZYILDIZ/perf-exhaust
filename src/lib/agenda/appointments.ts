import 'server-only'
import { getDb } from '@/lib/db'
import { computeAvailableSlots, isWithinOpenHours, overlapsExisting } from './availability'
import { getAgendaSettings, getWorkshopClosureDates } from './settings'
import { parisWallTimeToUtc } from './timezone'
import { addDays } from './calendar-range'
import { generateCancellationToken } from './cancellation-token'
import { BLOCKING_APPOINTMENT_STATUSES } from './types'
import type { TimeSlot } from './types'
import {
  sendAppointmentConfirmationEmail,
  sendAppointmentModifiedEmail,
  sendAppointmentCancelledByWorkshopEmail,
} from '@/lib/email'
import { isPennylaneV2Configured } from '@/lib/pennylane-v2/config'
import { searchCustomersByEmail, searchCustomersByPhone } from '@/lib/pennylane-v2/customers'

function cancellationUrlFor(token: string): string {
  return `https://perfexhaust.fr/rendez-vous/annuler/${token}`
}

/** Statuts considérés "actifs" — bloquent la suppression de la QuoteRequest et occupent un créneau. */
export const ACTIVE_APPOINTMENT_STATUSES = ['PENDING', 'CONFIRMED'] as const

export class AppointmentConflictError extends Error {
  constructor() {
    super("Ce créneau vient d'être réservé — choisissez-en un autre.")
    this.name = 'AppointmentConflictError'
  }
}

export class AppointmentNotFoundError extends Error {
  constructor() {
    super('Rendez-vous introuvable.')
    this.name = 'AppointmentNotFoundError'
  }
}

/**
 * Fenêtres occupées à éviter — rendez-vous bloquants ET blocs atelier
 * (pause/réunion/congé...), fusionnés en une seule liste d'intervalles
 * [startAt, endAt). Le moteur pur (availability.ts) ne fait aucune
 * distinction entre les deux origines, volontairement — un bloc atelier
 * bloque un créneau exactement comme un rendez-vous.
 */
async function loadBlockingAppointments(from: Date, to: Date, excludeAppointmentId?: string) {
  const db = getDb()
  const [appts, blocks] = await Promise.all([
    db.appointment.findMany({
      where: {
        status: { in: BLOCKING_APPOINTMENT_STATUSES as unknown as string[] },
        startAt: { lt: to },
        endAt: { gt: from },
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      },
      select: { startAt: true, endAt: true },
    }),
    db.agendaBlock.findMany({
      where: { startAt: { lt: to }, endAt: { gt: from } },
      select: { startAt: true, endAt: true },
    }),
  ])
  return [...appts, ...blocks]
}

/**
 * Calcule les créneaux disponibles pour une fenêtre et une durée données —
 * lit les paramètres/fermetures/rendez-vous existants en base, délègue le
 * calcul pur à availability.ts. `excludeAppointmentId` permet d'exclure le
 * rendez-vous en cours de modification de ses propres conflits (sinon son
 * créneau actuel n'apparaîtrait jamais comme disponible lors d'une
 * modification de date/heure).
 */
export async function getAvailableSlots(params: { from: Date; to: Date; durationMinutes: number; now?: Date; excludeAppointmentId?: string }): Promise<TimeSlot[]> {
  const [settings, closures, existing] = await Promise.all([
    getAgendaSettings(),
    getWorkshopClosureDates(),
    loadBlockingAppointments(params.from, params.to, params.excludeAppointmentId),
  ])
  return computeAvailableSlots({
    from: params.from,
    to: params.to,
    durationMinutes: params.durationMinutes,
    weeklyHours: settings.weeklyHours,
    bufferMinutes: settings.bufferMinutes,
    closures,
    existingAppointments: existing,
    now: params.now ?? new Date(),
  })
}

/**
 * Vrai si [startAt, endAt) est encore réellement libre — revalidé juste
 * avant écriture pour empêcher tout double-réservation, y compris entre
 * deux clics simultanés. Vérifie explicitement les horaires d'ouverture, le
 * temps tampon ET les fermetures exceptionnelles (pas seulement le
 * chevauchement direct) : à la différence d'une création depuis un créneau
 * proposé par `computeAvailableSlots` (déjà borné par construction), un
 * déplacement/redimensionnement (drag & drop, resize) peut déposer un
 * rendez-vous n'importe où sur la grille — la revalidation doit donc
 * refaire ces vérifications elle-même. Bugs corrigés lors de la mission de
 * consolidation Phase 3 (confirmés en conditions réelles) : (1) un
 * glisser-déposer/redimensionnement pouvait dépasser l'heure de fermeture
 * sans être rejeté ; (2) le temps tampon était systématiquement ignoré, car
 * `loadBlockingAppointments` ne chargeait que les rendez-vous en
 * chevauchement DIRECT avec la fenêtre exacte visée — un rendez-vous voisin
 * mais non chevauchant n'était même pas récupéré en base, donc jamais
 * soumis à la marge tampon d'`overlapsExisting`. Fixé en élargissant la
 * fenêtre de la requête de la marge tampon de chaque côté.
 */
async function isSlotStillFree(startAt: Date, endAt: Date, excludeAppointmentId?: string): Promise<boolean> {
  const settings = await getAgendaSettings()
  const bufferMs = settings.bufferMinutes * 60000
  const [closures, existing] = await Promise.all([
    getWorkshopClosureDates(),
    loadBlockingAppointments(new Date(startAt.getTime() - bufferMs), new Date(endAt.getTime() + bufferMs), excludeAppointmentId),
  ])
  if (!isWithinOpenHours(startAt, endAt, settings.weeklyHours, closures)) return false
  return !overlapsExisting(startAt, endAt, existing, settings.bufferMinutes)
}

export interface CreateAppointmentInput {
  quoteRequestId: string
  startAt: Date
  durationMinutes: number
  notes?: string
}

export interface CreatedAppointment {
  id: string
  startAt: Date
  endAt: Date
  /** Jamais persisté ailleurs qu'en hash — à usage unique par l'appelant (email de confirmation, étape 6). */
  rawCancellationToken: string
}

/**
 * Crée un rendez-vous CONFIRMED pour une demande de devis. Revalide la
 * disponibilité juste avant l'écriture (protège contre une réservation
 * concurrente). Ne gère pas l'envoi d'email — voir étape 6
 * (sendAppointmentConfirmation, appelé par l'appelant de cette fonction).
 */
export async function createAppointment(input: CreateAppointmentInput): Promise<CreatedAppointment> {
  const db = getDb()
  const quoteRequest = await db.quoteRequest.findUnique({
    where: { id: input.quoteRequestId },
    select: { id: true, nom: true, prenom: true, email: true, telephone: true, marque: true, modele: true, annee: true, appointment: { select: { id: true } } },
  })
  if (!quoteRequest) throw new AppointmentNotFoundError()
  if (quoteRequest.appointment) throw new Error('Cette demande a déjà un rendez-vous — annulez-le avant d\'en planifier un nouveau.')

  const endAt = new Date(input.startAt.getTime() + input.durationMinutes * 60000)

  const stillFree = await isSlotStillFree(input.startAt, endAt)
  if (!stillFree) throw new AppointmentConflictError()

  const { token, hash } = generateCancellationToken()

  const vehicle = `${quoteRequest.marque} ${quoteRequest.modele} (${quoteRequest.annee})`
  const created = await db.appointment.create({
    data: {
      quoteRequestId: quoteRequest.id,
      customerName: `${quoteRequest.prenom} ${quoteRequest.nom}`,
      customerEmail: quoteRequest.email,
      customerPhone: quoteRequest.telephone,
      vehicle,
      startAt: input.startAt,
      endAt,
      durationMinutes: input.durationMinutes,
      status: 'CONFIRMED',
      notes: input.notes ?? '',
      cancellationTokenHash: hash,
      cancellationTokenExpiresAt: input.startAt,
    },
  })

  // Best-effort : un échec d'email ne doit jamais faire échouer la création
  // du rendez-vous déjà enregistrée (même principe que /api/rendez-vous).
  try {
    await sendAppointmentConfirmationEmail({
      customerEmail: quoteRequest.email,
      customerFirstName: quoteRequest.prenom,
      vehicle,
      startAt: created.startAt,
      endAt: created.endAt,
      durationMinutes: created.durationMinutes,
      appointmentId: created.id,
      cancellationUrl: cancellationUrlFor(token),
    })
    await db.appointment.update({ where: { id: created.id }, data: { confirmationSentAt: new Date() } })
  } catch (err) {
    console.error(`[agenda] Échec de l'email de confirmation pour le rendez-vous ${created.id} (rendez-vous non affecté) :`, err)
  }

  return { id: created.id, startAt: created.startAt, endAt: created.endAt, rawCancellationToken: token }
}

/**
 * Recherche best-effort d'un client Pennylane existant par email puis
 * téléphone (jamais de création, jamais bloquant) — pour lier un rendez-vous
 * manuel à sa fiche Pennylane si elle existe déjà. Réutilise les mêmes
 * fonctions de recherche que la synchronisation automatique
 * (src/lib/pennylane-v2/sync.ts) plutôt que de dupliquer la logique. Ignore
 * volontairement les correspondances ambiguës (plusieurs résultats) : un
 * RDV manuel n'a pas d'interface pour résoudre une ambiguïté comme le fait
 * /admin/devis/[id], donc on ne lie jamais automatiquement dans ce cas.
 */
async function findExistingPennylaneCustomerForManualAppointment(
  email: string | null,
  telephone: string
): Promise<{ id: number; type: 'individual' | 'company' } | null> {
  try {
    if (email) {
      const byEmail = await searchCustomersByEmail(email)
      if (byEmail.length === 1) return { id: byEmail[0].id, type: 'first_name' in byEmail[0] ? 'individual' : 'company' }
    }
    const { matches: byPhone } = await searchCustomersByPhone(telephone)
    if (byPhone.length === 1) return { id: byPhone[0].id, type: 'first_name' in byPhone[0] ? 'individual' : 'company' }
  } catch (err) {
    console.error('[agenda] Recherche Pennylane best-effort échouée pour un rendez-vous manuel (rendez-vous non affecté) :', err)
  }
  return null
}

export interface CreateManualAppointmentInput {
  prenom: string
  nom: string
  telephone: string
  email?: string | null
  address?: string | null
  marque: string
  modele: string
  annee: string
  motorisation?: string | null
  rearDiffuser?: string | null
  vehicleNotes?: string
  startAt: Date
  durationMinutes: number
  notes?: string
}

export interface CreatedManualAppointment {
  id: string
  startAt: Date
  endAt: Date
  rawCancellationToken: string
  /** Faux si aucun email n'était renseigné — l'appelant doit alors afficher "Confirmation email non envoyée...", jamais une erreur. */
  emailSent: boolean
  pennylaneCustomerId: number | null
}

/**
 * Crée un rendez-vous CONFIRMED sans demande de devis associée — client
 * passé au comptoir ou par téléphone (voir schema.prisma § Appointment,
 * champs snapshot dédiés). Réutilise exactement le même moteur de
 * disponibilité que createAppointment() (isSlotStillFree, lui-même appuyé
 * sur availability.ts) : aucune duplication de la logique horaires/
 * buffer/blocs/fermetures.
 */
export async function createManualAppointment(input: CreateManualAppointmentInput): Promise<CreatedManualAppointment> {
  const db = getDb()
  const endAt = new Date(input.startAt.getTime() + input.durationMinutes * 60000)

  const stillFree = await isSlotStillFree(input.startAt, endAt)
  if (!stillFree) throw new AppointmentConflictError()

  const { token, hash } = generateCancellationToken()
  const vehicle = `${input.marque} ${input.modele} (${input.annee})`
  const email = input.email?.trim() || null

  let pennylane: { id: number; type: 'individual' | 'company' } | null = null
  if (isPennylaneV2Configured()) {
    pennylane = await findExistingPennylaneCustomerForManualAppointment(email, input.telephone)
  }

  const created = await db.appointment.create({
    data: {
      quoteRequestId: null,
      customerName: `${input.prenom} ${input.nom}`,
      customerEmail: email,
      customerPhone: input.telephone,
      customerAddress: input.address?.trim() || null,
      vehicle,
      motorisation: input.motorisation?.trim() || null,
      rearDiffuser: input.rearDiffuser ?? null,
      vehicleNotes: input.vehicleNotes ?? '',
      startAt: input.startAt,
      endAt,
      durationMinutes: input.durationMinutes,
      status: 'CONFIRMED',
      notes: input.notes ?? '',
      cancellationTokenHash: hash,
      cancellationTokenExpiresAt: input.startAt,
      pennylaneCustomerId: pennylane ? String(pennylane.id) : null,
      pennylaneCustomerType: pennylane?.type ?? null,
    },
  })

  let emailSent = false
  if (email) {
    try {
      await sendAppointmentConfirmationEmail({
        customerEmail: email,
        customerFirstName: input.prenom,
        vehicle,
        startAt: created.startAt,
        endAt: created.endAt,
        durationMinutes: created.durationMinutes,
        appointmentId: created.id,
        cancellationUrl: cancellationUrlFor(token),
      })
      await db.appointment.update({ where: { id: created.id }, data: { confirmationSentAt: new Date() } })
      emailSent = true
    } catch (err) {
      console.error(`[agenda] Échec de l'email de confirmation (rendez-vous manuel) pour ${created.id} (rendez-vous non affecté) :`, err)
    }
  }

  return {
    id: created.id,
    startAt: created.startAt,
    endAt: created.endAt,
    rawCancellationToken: token,
    emailSent,
    pennylaneCustomerId: pennylane?.id ?? null,
  }
}

export interface RescheduleResult {
  id: string
  startAt: Date
  endAt: Date
  /** Faux si la date/heure/durée demandées sont strictement identiques à l'existant — voir garde-fou ci-dessous. */
  changed: boolean
  /** Absent quand `changed` est faux : aucun nouveau token n'est généré, l'ancien reste valide. */
  rawCancellationToken?: string
}

/**
 * Déplace un rendez-vous existant — revalide la disponibilité (en
 * s'excluant lui-même), régénère un nouveau token d'annulation (l'ancien
 * lien devient invalide).
 *
 * Garde-fou (Phase 4, bug réel observé en production) : si la nouvelle
 * date/heure/durée sont strictement identiques à l'existant, ne rien
 * modifier en base et ne jamais envoyer d'email de modification — même si
 * l'appelant (UI ou script) invoque cette route par erreur. Avant ce
 * garde-fou, un glisser-déposer qui « revenait visuellement » à sa position
 * d'origine appelait quand même cette route avec les mêmes valeurs,
 * déclenchant un email « rendez-vous déplacé » trompeur pour le client.
 */
export async function rescheduleAppointment(appointmentId: string, startAt: Date, durationMinutes: number): Promise<RescheduleResult> {
  const db = getDb()
  const existing = await db.appointment.findUnique({ where: { id: appointmentId } })
  if (!existing) throw new AppointmentNotFoundError()

  const endAt = new Date(startAt.getTime() + durationMinutes * 60000)

  if (existing.startAt.getTime() === startAt.getTime() && existing.endAt.getTime() === endAt.getTime()) {
    return { id: existing.id, startAt: existing.startAt, endAt: existing.endAt, changed: false }
  }

  const stillFree = await isSlotStillFree(startAt, endAt, appointmentId)
  if (!stillFree) throw new AppointmentConflictError()

  const { token, hash } = generateCancellationToken()
  const updated = await db.appointment.update({
    where: { id: appointmentId },
    data: {
      startAt, endAt, durationMinutes,
      cancellationTokenHash: hash,
      cancellationTokenExpiresAt: startAt,
      confirmationSentAt: null, // un nouvel email de "modification" sera envoyé ci-dessous — pas encore compté comme "confirmation envoyée" pour ce nouveau créneau
    },
  })

  if (updated.customerEmail) {
    try {
      await sendAppointmentModifiedEmail({
        customerEmail: updated.customerEmail,
        customerFirstName: updated.customerName.split(' ')[0] || updated.customerName,
        vehicle: updated.vehicle,
        startAt: updated.startAt,
        endAt: updated.endAt,
        durationMinutes: updated.durationMinutes,
        appointmentId: updated.id,
        cancellationUrl: cancellationUrlFor(token),
      })
      await db.appointment.update({ where: { id: updated.id }, data: { confirmationSentAt: new Date() } })
    } catch (err) {
      console.error(`[agenda] Échec de l'email de modification pour le rendez-vous ${updated.id} (rendez-vous non affecté) :`, err)
    }
  }

  return { id: updated.id, startAt: updated.startAt, endAt: updated.endAt, changed: true, rawCancellationToken: token }
}

/** Annulation côté atelier (admin) — distincte de l'annulation client sécurisée (étape 7), mais partage le même effet : libère le créneau, invalide le token. */
export async function cancelAppointmentByWorkshop(appointmentId: string): Promise<void> {
  const db = getDb()
  const existing = await db.appointment.findUnique({ where: { id: appointmentId } })
  if (!existing) throw new AppointmentNotFoundError()
  await db.appointment.update({
    where: { id: appointmentId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelledBy: 'WORKSHOP',
      cancellationTokenHash: null,
      cancellationTokenExpiresAt: null,
    },
  })

  if (existing.customerEmail) {
    try {
      await sendAppointmentCancelledByWorkshopEmail({
        customerEmail: existing.customerEmail,
        customerFirstName: existing.customerName.split(' ')[0] || existing.customerName,
        vehicle: existing.vehicle,
        startAt: existing.startAt,
        endAt: existing.endAt,
        durationMinutes: existing.durationMinutes,
        appointmentId: existing.id,
      })
    } catch (err) {
      console.error(`[agenda] Échec de l'email d'annulation (atelier) pour le rendez-vous ${appointmentId} (annulation non affectée) :`, err)
    }
  }
}

export async function markAppointmentCompleted(appointmentId: string): Promise<void> {
  const db = getDb()
  const existing = await db.appointment.findUnique({ where: { id: appointmentId } })
  if (!existing) throw new AppointmentNotFoundError()
  await db.appointment.update({ where: { id: appointmentId }, data: { status: 'COMPLETED' } })
}

export async function markAppointmentNoShow(appointmentId: string): Promise<void> {
  const db = getDb()
  const existing = await db.appointment.findUnique({ where: { id: appointmentId } })
  if (!existing) throw new AppointmentNotFoundError()
  await db.appointment.update({ where: { id: appointmentId }, data: { status: 'NO_SHOW' } })
}

export async function updateAppointmentNotes(appointmentId: string, notes: string): Promise<void> {
  const db = getDb()
  const existing = await db.appointment.findUnique({ where: { id: appointmentId } })
  if (!existing) throw new AppointmentNotFoundError()
  await db.appointment.update({ where: { id: appointmentId }, data: { notes } })
}

/** Liste des rendez-vous dans une fenêtre — pour l'agenda admin (étape 5). */
export async function listAppointmentsInRange(from: Date, to: Date) {
  const db = getDb()
  return db.appointment.findMany({
    where: { startAt: { lt: to }, endAt: { gt: from } },
    orderBy: { startAt: 'asc' },
  })
}

/**
 * Rendez-vous actifs (PENDING/CONFIRMED) dont le créneau tombe dans une
 * plage de dates ("AAAA-MM-JJ", calendrier Paris, inclusive) — utilisé pour
 * avertir l'admin avant de créer/modifier une fermeture atelier : "N
 * rendez-vous existant(s) se trouve(nt) dans cette période de fermeture."
 * Ne supprime ni ne déplace jamais rien automatiquement — l'admin décide.
 */
export async function listActiveAppointmentsInDateRange(startDate: string, endDate: string) {
  const db = getDb()
  const from = parisWallTimeToUtc(startDate, '00:00')
  const to = parisWallTimeToUtc(addDays(endDate, 1), '00:00') // exclusif : lendemain minuit Paris de endDate
  return db.appointment.findMany({
    where: { status: { in: ACTIVE_APPOINTMENT_STATUSES as unknown as string[] }, startAt: { gte: from, lt: to } },
    select: { id: true, customerName: true, vehicle: true, startAt: true, endAt: true, status: true },
    orderBy: { startAt: 'asc' },
  })
}
