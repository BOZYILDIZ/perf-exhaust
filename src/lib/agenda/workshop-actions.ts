import 'server-only'
import { getDb } from '@/lib/db'
import { AppointmentNotFoundError } from './appointments'
import {
  computeForwardMirror,
  computeCorrectionMirror,
  canAttemptVehicleReadyNotification,
  STALE_NOTIFICATION_CLAIM_MS,
  WORKSHOP_STATUS_LABELS,
  type WorkshopStatus,
} from './workshop-status'
import { logActivityEvent, ACTIVITY_EVENT_TYPES, type ActivityEventType } from '@/lib/activity-events'
import { sendVehicleReadyEmail } from '@/lib/email'

/**
 * Orchestration DB des actions atelier — toute la logique de DÉCISION vit
 * dans workshop-status.ts (pur, testable sans base) ; ce fichier ne fait que
 * lire/écrire et appeler ces fonctions pures avec les bonnes valeurs.
 * Fonctionne identiquement pour un rendez-vous manuel (quoteRequestId null,
 * pas de mirroring) et un rendez-vous lié à une demande.
 */

interface AppointmentForWorkshop {
  id: string
  quoteRequestId: string | null
  vehicle: string
  quoteRequest: { status: string } | null
}

async function loadAppointmentOrThrow(appointmentId: string): Promise<AppointmentForWorkshop> {
  const appointment = await getDb().appointment.findUnique({
    where: { id: appointmentId },
    select: { id: true, quoteRequestId: true, vehicle: true, quoteRequest: { select: { status: true } } },
  })
  if (!appointment) throw new AppointmentNotFoundError()
  return appointment
}

/** Applique une progression atelier normale (jamais une correction) — jamais de recul, voir computeForwardMirror. */
async function applyForwardTransition(
  appointmentId: string,
  target: WorkshopStatus,
  eventType: ActivityEventType,
  eventTitle: string,
  extraData?: Record<string, unknown>
): Promise<AppointmentForWorkshop> {
  const db = getDb()
  const appointment = await loadAppointmentOrThrow(appointmentId)

  await db.appointment.update({ where: { id: appointmentId }, data: { workshopStatus: target, ...extraData } })

  if (appointment.quoteRequestId && appointment.quoteRequest) {
    const mirrored = computeForwardMirror(appointment.quoteRequest.status, target)
    if (mirrored) {
      await db.quoteRequest.update({ where: { id: appointment.quoteRequestId }, data: { status: mirrored } })
    }
  }

  await logActivityEvent({
    quoteRequestId: appointment.quoteRequestId,
    appointmentId: appointment.id,
    type: eventType,
    title: eventTitle,
  })

  return appointment
}

export async function markVehicleArrived(appointmentId: string): Promise<void> {
  await applyForwardTransition(appointmentId, 'VEHICULE_ARRIVE', ACTIVITY_EVENT_TYPES.VEHICLE_ARRIVED, "Véhicule arrivé à l'atelier")
}

export async function startIntervention(appointmentId: string): Promise<void> {
  await applyForwardTransition(appointmentId, 'EN_INTERVENTION', ACTIVITY_EVENT_TYPES.WORK_STARTED, 'Intervention démarrée')
}

export interface VehicleReadyNotificationResult {
  /** Email effectivement envoyé lors de CET appel. */
  notified: boolean
  /** Le client avait déjà été notifié avec succès auparavant — pas un échec, un no-op idempotent. */
  alreadyNotified: boolean
  /** Un autre essai (même requête concurrente, ou un essai non expiré) est en cours — aucun envoi tenté ici. */
  inProgress: boolean
  /** Message d'erreur si un essai a réellement été tenté ici mais a échoué côté fournisseur. */
  notifyError: string | null
}

/**
 * Tente d'envoyer l'email "véhicule prêt" — idempotent et sûr contre toute
 * concurrence (double-clic, retry serveur, deux onglets admin). Appelée à la
 * fin de `completeIntervention()` ET par `retryVehicleReadyNotification()`
 * après un échec : les deux partagent exactement cette même garde, il n'y a
 * qu'UN SEUL chemin qui envoie réellement l'email.
 *
 * Design (voir canAttemptVehicleReadyNotification() dans workshop-status.ts
 * pour la règle exacte, testée indépendamment de la base) :
 *  - `vehicleReadyNotifiedAt` ne représente QUE un envoi réellement réussi —
 *    jamais posé avant/pendant la tentative.
 *  - `vehicleReadyNotificationInProgress` est le verrou d'unicité : réservé
 *    par un `updateMany` conditionnel ATOMIQUE (une seule requête peut
 *    gagner la course), toujours libéré en fin d'essai — succès ou échec —
 *    ce qui autorise un nouvel essai immédiat après un échec, sans jamais
 *    permettre à deux essais de s'exécuter en même temps.
 *  - `vehicleReadyNotificationLastError` garde la dernière erreur (message
 *    court, jamais la réponse brute Resend) pour que l'admin comprenne
 *    pourquoi réessayer est nécessaire ; effacé dès qu'un essai réussit.
 */
async function attemptVehicleReadyNotification(appointmentId: string): Promise<VehicleReadyNotificationResult> {
  const db = getDb()
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true, quoteRequestId: true, vehicle: true, customerEmail: true, customerName: true,
      vehicleReadyNotifiedAt: true, vehicleReadyNotificationInProgress: true, vehicleReadyNotificationLastAttemptAt: true,
    },
  })
  if (!appointment) throw new AppointmentNotFoundError()

  const result: VehicleReadyNotificationResult = { notified: false, alreadyNotified: false, inProgress: false, notifyError: null }

  if (!appointment.customerEmail) return result // RDV manuel sans email — no-op silencieux, jamais bloquant.

  const now = new Date()

  // Pré-vérification locale (même règle que la garde atomique ci-dessous,
  // voir canAttemptVehicleReadyNotification) — évite une écriture inutile
  // pour le cas courant (déjà notifié / essai visiblement en cours), sans
  // être la garantie d'unicité elle-même : celle-ci vient uniquement de
  // l'atomicité du `updateMany` qui suit.
  if (!canAttemptVehicleReadyNotification(appointment, now)) {
    if (appointment.vehicleReadyNotifiedAt) result.alreadyNotified = true
    else result.inProgress = true
    return result
  }

  const staleThreshold = new Date(now.getTime() - STALE_NOTIFICATION_CLAIM_MS)
  const claim = await db.appointment.updateMany({
    where: {
      id: appointmentId,
      vehicleReadyNotifiedAt: null,
      OR: [
        { vehicleReadyNotificationInProgress: false },
        { vehicleReadyNotificationLastAttemptAt: null },
        { vehicleReadyNotificationLastAttemptAt: { lt: staleThreshold } },
      ],
    },
    data: { vehicleReadyNotificationInProgress: true, vehicleReadyNotificationLastAttemptAt: now },
  })

  if (claim.count !== 1) {
    // Course perdue : soit un autre appel vient de réussir, soit un essai est
    // actuellement en cours (dans la fenêtre non expirée) — jamais de second envoi.
    const fresh = await db.appointment.findUnique({ where: { id: appointmentId }, select: { vehicleReadyNotifiedAt: true } })
    if (fresh?.vehicleReadyNotifiedAt) result.alreadyNotified = true
    else result.inProgress = true
    return result
  }

  try {
    await sendVehicleReadyEmail({
      customerEmail: appointment.customerEmail,
      customerFirstName: appointment.customerName.split(' ')[0] || appointment.customerName,
      vehicle: appointment.vehicle,
    })
    await db.appointment.update({
      where: { id: appointmentId },
      data: { vehicleReadyNotifiedAt: now, vehicleReadyNotificationInProgress: false, vehicleReadyNotificationLastError: null },
    })
    result.notified = true
    await logActivityEvent({
      quoteRequestId: appointment.quoteRequestId,
      appointmentId: appointment.id,
      type: ACTIVITY_EVENT_TYPES.VEHICLE_READY_NOTIFICATION_SENT,
      title: 'Client notifié — véhicule prêt',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    await db.appointment.update({
      where: { id: appointmentId },
      data: { vehicleReadyNotificationInProgress: false, vehicleReadyNotificationLastError: message },
    })
    result.notifyError = message
    // Pas de `metadata` ici : le titre suffit à signaler l'échec dans la
    // timeline, jamais de détail d'erreur/réponse Resend — le détail exact
    // reste dans vehicleReadyNotificationLastError (admin uniquement).
    await logActivityEvent({
      quoteRequestId: appointment.quoteRequestId,
      appointmentId: appointment.id,
      type: ACTIVITY_EVENT_TYPES.VEHICLE_READY_NOTIFICATION_FAILED,
      title: 'Échec de la notification client — véhicule prêt',
    })
  }

  return result
}

/** Réessai explicite après un échec — même garde d'unicité que l'essai initial, voir attemptVehicleReadyNotification(). */
export async function retryVehicleReadyNotification(appointmentId: string): Promise<VehicleReadyNotificationResult> {
  return attemptVehicleReadyNotification(appointmentId)
}

export type CompleteInterventionResult = VehicleReadyNotificationResult

/**
 * Termine l'intervention — TOUJOURS effective, indépendamment du succès de
 * la notification client (un RDV manuel sans email continue normalement,
 * `notifyClient` sans email disponible est simplement ignoré, jamais bloquant).
 */
export async function completeIntervention(appointmentId: string, notifyClient: boolean): Promise<CompleteInterventionResult> {
  const db = getDb()
  const appointment = await loadAppointmentOrThrow(appointmentId)

  await db.appointment.update({ where: { id: appointmentId }, data: { workshopStatus: 'TERMINE' } })

  if (appointment.quoteRequestId && appointment.quoteRequest) {
    const mirrored = computeForwardMirror(appointment.quoteRequest.status, 'TERMINE')
    if (mirrored) {
      await db.quoteRequest.update({ where: { id: appointment.quoteRequestId }, data: { status: mirrored } })
    }
  }

  await logActivityEvent({
    quoteRequestId: appointment.quoteRequestId,
    appointmentId: appointment.id,
    type: ACTIVITY_EVENT_TYPES.WORK_COMPLETED,
    title: 'Intervention terminée — véhicule prêt',
  })

  if (!notifyClient) return { notified: false, alreadyNotified: false, inProgress: false, notifyError: null }
  return attemptVehicleReadyNotification(appointmentId)
}

/** vehicleReturnedAt posé ici — base de calcul du délai avant demande d'avis, voir src/lib/agenda/review-request.ts. */
export async function markVehicleReturned(appointmentId: string): Promise<void> {
  await applyForwardTransition(appointmentId, 'RESTITUE', ACTIVITY_EVENT_TYPES.VEHICLE_RETURNED, 'Véhicule restitué au client', {
    vehicleReturnedAt: new Date(),
  })
}

/**
 * Correction manuelle d'une erreur de statut atelier — seule action qui peut
 * faire reculer le statut (voir computeCorrectionMirror), toujours
 * journalisée avec actor "admin" pour rester traçable dans la timeline.
 */
export async function correctWorkshopStatus(appointmentId: string, newStatus: WorkshopStatus | null): Promise<void> {
  const db = getDb()
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: { id: true, quoteRequestId: true, workshopStatus: true, quoteRequest: { select: { status: true } } },
  })
  if (!appointment) throw new AppointmentNotFoundError()

  const previousLabel = appointment.workshopStatus ? WORKSHOP_STATUS_LABELS[appointment.workshopStatus as WorkshopStatus] : 'Planifié'
  const nextLabel = newStatus ? WORKSHOP_STATUS_LABELS[newStatus] : 'Planifié'

  // vehicleReturnedAt suit la même règle explicite que le statut lui-même :
  // posé si la correction ATTEINT RESTITUE, effacé si elle en repart (le
  // véhicule n'est alors plus considéré comme restitué) — jamais dérivé
  // implicitement d'updatedAt. Voir src/lib/agenda/review-request.ts.
  await db.appointment.update({
    where: { id: appointmentId },
    data: { workshopStatus: newStatus, vehicleReturnedAt: newStatus === 'RESTITUE' ? new Date() : null },
  })

  if (appointment.quoteRequestId && appointment.quoteRequest) {
    const mirrored = computeCorrectionMirror(appointment.quoteRequest.status, newStatus)
    if (mirrored) {
      await db.quoteRequest.update({ where: { id: appointment.quoteRequestId }, data: { status: mirrored } })
    }
  }

  await logActivityEvent({
    quoteRequestId: appointment.quoteRequestId,
    appointmentId: appointment.id,
    type: ACTIVITY_EVENT_TYPES.WORKSHOP_STATUS_CORRECTED,
    title: `Statut atelier corrigé : ${previousLabel} → ${nextLabel}`,
    metadata: { from: appointment.workshopStatus, to: newStatus },
    actor: 'admin',
  })
}
