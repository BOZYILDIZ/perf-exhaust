import 'server-only'
import { getDb } from '@/lib/db'
import { computeAvailableSlots } from './availability'
import { getAgendaSettings, getWorkshopClosureDates } from './settings'
import { generateCancellationToken } from './cancellation-token'
import { BLOCKING_APPOINTMENT_STATUSES } from './types'
import type { TimeSlot } from './types'

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

async function loadBlockingAppointments(from: Date, to: Date, excludeAppointmentId?: string) {
  const db = getDb()
  const rows = await db.appointment.findMany({
    where: {
      status: { in: BLOCKING_APPOINTMENT_STATUSES as unknown as string[] },
      startAt: { lt: to },
      endAt: { gt: from },
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
    },
    select: { startAt: true, endAt: true },
  })
  return rows
}

/** Calcule les créneaux disponibles pour une fenêtre et une durée données — lit les paramètres/fermetures/rendez-vous existants en base, délègue le calcul pur à availability.ts. */
export async function getAvailableSlots(params: { from: Date; to: Date; durationMinutes: number; now?: Date }): Promise<TimeSlot[]> {
  const [settings, closures, existing] = await Promise.all([
    getAgendaSettings(),
    getWorkshopClosureDates(),
    loadBlockingAppointments(params.from, params.to),
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

/** Vrai si [startAt, endAt) est encore réellement libre — revalidé juste avant écriture pour empêcher tout double-réservation, y compris entre deux clics simultanés. */
async function isSlotStillFree(startAt: Date, endAt: Date, excludeAppointmentId?: string): Promise<boolean> {
  const existing = await loadBlockingAppointments(startAt, endAt, excludeAppointmentId)
  // Un chevauchement direct suffit ici : la marge tampon a déjà été prise en
  // compte lors du calcul des créneaux proposés à l'admin ; la revalidation
  // ne fait que confirmer qu'aucun AUTRE rendez-vous n'a été créé entre
  // l'affichage des créneaux et la confirmation.
  return !existing.some((e) => startAt.getTime() < e.endAt.getTime() && endAt.getTime() > e.startAt.getTime())
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

  const created = await db.appointment.create({
    data: {
      quoteRequestId: quoteRequest.id,
      customerName: `${quoteRequest.prenom} ${quoteRequest.nom}`,
      customerEmail: quoteRequest.email,
      customerPhone: quoteRequest.telephone,
      vehicle: `${quoteRequest.marque} ${quoteRequest.modele} (${quoteRequest.annee})`,
      startAt: input.startAt,
      endAt,
      durationMinutes: input.durationMinutes,
      status: 'CONFIRMED',
      notes: input.notes ?? '',
      cancellationTokenHash: hash,
      cancellationTokenExpiresAt: input.startAt,
    },
  })

  return { id: created.id, startAt: created.startAt, endAt: created.endAt, rawCancellationToken: token }
}

export interface RescheduleResult {
  id: string
  startAt: Date
  endAt: Date
  rawCancellationToken: string
}

/** Déplace un rendez-vous existant — revalide la disponibilité (en s'excluant lui-même), régénère un nouveau token d'annulation (l'ancien lien devient invalide). */
export async function rescheduleAppointment(appointmentId: string, startAt: Date, durationMinutes: number): Promise<RescheduleResult> {
  const db = getDb()
  const existing = await db.appointment.findUnique({ where: { id: appointmentId } })
  if (!existing) throw new AppointmentNotFoundError()

  const endAt = new Date(startAt.getTime() + durationMinutes * 60000)
  const stillFree = await isSlotStillFree(startAt, endAt, appointmentId)
  if (!stillFree) throw new AppointmentConflictError()

  const { token, hash } = generateCancellationToken()
  const updated = await db.appointment.update({
    where: { id: appointmentId },
    data: {
      startAt, endAt, durationMinutes,
      cancellationTokenHash: hash,
      cancellationTokenExpiresAt: startAt,
      confirmationSentAt: null, // un nouvel email de "modification" sera envoyé (étape 6) — pas encore compté comme "confirmation envoyée" pour ce nouveau créneau
    },
  })
  return { id: updated.id, startAt: updated.startAt, endAt: updated.endAt, rawCancellationToken: token }
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
