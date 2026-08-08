import 'server-only'
import { getDb } from '@/lib/db'
import { hashCancellationToken } from './cancellation-token'
import { sendAppointmentCancelledByCustomerEmail, sendAppointmentCancelledNotificationToShop } from '@/lib/email'

const CANCELLATION_WINDOW_MS = 48 * 3600 * 1000

export type CancellationCheckStatus = 'valid' | 'invalid' | 'already_cancelled' | 'already_completed' | 'too_late'

export interface CancellationAppointmentView {
  startAt: Date
  endAt: Date
  vehicle: string
  durationMinutes: number
}

export interface CancellationLookupResult {
  status: CancellationCheckStatus
  appointment: CancellationAppointmentView | null
}

interface FullAppointmentRow {
  id: string
  status: string
  startAt: Date
  endAt: Date
  vehicle: string
  durationMinutes: number
  customerName: string
  customerEmail: string | null
  cancellationTokenExpiresAt: Date | null
}

/** Résout un token en ligne complète — usage interne uniquement, jamais renvoyé tel quel à l'appelant public (voir lookupAppointmentByCancellationToken pour la vue sûre). */
async function findByToken(token: string): Promise<FullAppointmentRow | null> {
  const hash = hashCancellationToken(token)
  return getDb().appointment.findUnique({
    where: { cancellationTokenHash: hash },
    select: {
      id: true, status: true, startAt: true, endAt: true, vehicle: true, durationMinutes: true,
      customerName: true, customerEmail: true, cancellationTokenExpiresAt: true,
    },
  })
}

/**
 * Audit timezone/DST (mission de correctifs, confirmé en conditions
 * réelles) : cette comparaison est volontairement faite en millisecondes
 * epoch (`Date.getTime()`), jamais via une différence d'heure murale
 * Paris — un écart de 48h réel qui traverse un changement d'heure (ex.
 * passage à l'heure d'hiver, dernier dimanche d'octobre) afficherait un
 * écart de 49h en heure murale Paris tout en restant exactement 48h de
 * temps réel écoulé ; seule l'arithmétique sur les instants UTC bruts est
 * juste dans les deux cas. Revérifié avec 8 scénarios réels (J+72h,
 * J+48h+1min, exactement J+48h, J+47h59, J+24h, déjà annulé, token
 * réutilisé, message d'erreur) : la règle stricte `startAt - now > 48h`
 * est déjà appliquée correctement ici. À ne pas confondre avec
 * `cancelAppointmentByWorkshop` (annulation atelier, sans limite de
 * délai par conception) — si une annulation semble possible à moins de
 * 48h, vérifier qu'elle ne passe pas par cette route atelier plutôt que
 * par le lien client public.
 */
function classify(appt: FullAppointmentRow | null, now: Date): CancellationCheckStatus {
  if (!appt) return 'invalid'
  if (appt.cancellationTokenExpiresAt && now.getTime() > appt.cancellationTokenExpiresAt.getTime()) return 'invalid'
  if (appt.status === 'CANCELLED') return 'already_cancelled'
  if (appt.status === 'COMPLETED') return 'already_completed'
  const msUntilStart = appt.startAt.getTime() - now.getTime()
  if (msUntilStart <= CANCELLATION_WINDOW_MS) return 'too_late'
  return 'valid'
}

/**
 * Résout un token d'annulation pour affichage public — vérifie TOUTES les
 * règles métier côté serveur (jamais côté client) : token existant et non
 * expiré, rendez-vous ni annulé ni terminé, et strictement plus de 48h avant
 * `startAt`. Ne révèle jamais l'identifiant interne du rendez-vous.
 */
export async function lookupAppointmentByCancellationToken(token: string, now: Date = new Date()): Promise<CancellationLookupResult> {
  const appt = await findByToken(token)
  const status = classify(appt, now)
  if (!appt || status === 'invalid') return { status: 'invalid', appointment: null }
  return {
    status,
    appointment: { startAt: appt.startAt, endAt: appt.endAt, vehicle: appt.vehicle, durationMinutes: appt.durationMinutes },
  }
}

export type CancelByCustomerResult =
  | { success: true }
  | { success: false; status: Exclude<CancellationCheckStatus, 'valid'> }

/**
 * Exécute l'annulation demandée par le client — revérifie TOUT côté serveur
 * juste avant d'écrire (protège contre un lien resté ouvert longtemps ou une
 * double soumission). La mise à jour conditionnée sur le statut encore
 * PENDING/CONFIRMED garantit l'idempotence : un second appel concurrent ou
 * postérieur ne trouve plus la ligne attendue et renvoie proprement
 * `already_cancelled`, sans jamais renvoyer d'email en double.
 */
export async function cancelAppointmentByCustomer(token: string, reason: string | null, now: Date = new Date()): Promise<CancelByCustomerResult> {
  const appt = await findByToken(token)
  const status = classify(appt, now)
  if (!appt || status !== 'valid') {
    return { success: false, status: status as Exclude<CancellationCheckStatus, 'valid'> }
  }

  const db = getDb()
  const updated = await db.appointment.updateMany({
    where: { id: appt.id, status: { in: ['PENDING', 'CONFIRMED'] } },
    data: {
      status: 'CANCELLED',
      cancelledAt: now,
      cancelledBy: 'CUSTOMER',
      cancellationReason: reason ? reason.slice(0, 500) : null,
      cancellationRequestedAt: now,
      cancellationTokenHash: null,
      cancellationTokenExpiresAt: null,
    },
  })
  if (updated.count === 0) return { success: false, status: 'already_cancelled' }

  const emailInput = {
    customerEmail: appt.customerEmail,
    customerFirstName: appt.customerName.split(' ')[0] || appt.customerName,
    vehicle: appt.vehicle,
    startAt: appt.startAt,
    endAt: appt.endAt,
    durationMinutes: appt.durationMinutes,
    appointmentId: appt.id,
  }
  if (appt.customerEmail) {
    try {
      await sendAppointmentCancelledByCustomerEmail({ ...emailInput, customerEmail: appt.customerEmail })
    } catch (err) {
      console.error(`[agenda] Échec de l'email client (annulation par le client) pour le rendez-vous ${appt.id} :`, err)
    }
  }
  try {
    await sendAppointmentCancelledNotificationToShop({ ...emailInput, customerFullName: appt.customerName, reason: reason ? reason.slice(0, 500) : null })
  } catch (err) {
    console.error(`[agenda] Échec de la notification atelier (annulation par le client) pour le rendez-vous ${appt.id} :`, err)
  }

  return { success: true }
}
