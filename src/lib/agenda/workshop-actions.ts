import 'server-only'
import { getDb } from '@/lib/db'
import { AppointmentNotFoundError } from './appointments'
import { computeForwardMirror, computeCorrectionMirror, WORKSHOP_STATUS_LABELS, type WorkshopStatus } from './workshop-status'
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
  eventTitle: string
): Promise<AppointmentForWorkshop> {
  const db = getDb()
  const appointment = await loadAppointmentOrThrow(appointmentId)

  await db.appointment.update({ where: { id: appointmentId }, data: { workshopStatus: target } })

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

export interface CompleteInterventionResult {
  /** Email effectivement envoyé lors de CET appel. */
  notified: boolean
  /** Le client avait déjà été notifié auparavant — pas un échec, juste un no-op idempotent. */
  alreadyNotified: boolean
  /** Message d'erreur si l'envoi a été tenté (réservation posée) mais a échoué côté fournisseur. */
  notifyError: string | null
}

/**
 * Termine l'intervention — TOUJOURS effective, indépendamment du succès de
 * la notification client (un RDV manuel sans email continue normalement,
 * `notifyClient` sans email disponible est simplement ignoré, jamais bloquant).
 *
 * Anti-double-envoi robuste : `vehicleReadyNotifiedAt` est réservé par une
 * UPDATE conditionnelle atomique (`WHERE vehicleReadyNotifiedAt IS NULL`)
 * AVANT la tentative d'envoi — un double-clic ou un retry serveur concurrent
 * ne peut jamais faire gagner la course à deux appels simultanément (un seul
 * `updateMany` peut affecter la ligne ; l'autre voit `count === 0` et sait
 * qu'il a perdu la course, sans jamais envoyer). Contrepartie assumée : si
 * l'envoi échoue APRÈS la réservation, aucun renvoi automatique n'est
 * possible dans cette phase — l'admin doit contacter le client autrement (un
 * bouton "renvoyer" qui lèverait explicitement la réservation n'est pas
 * construit ici, hors périmètre).
 */
export async function completeIntervention(appointmentId: string, notifyClient: boolean): Promise<CompleteInterventionResult> {
  const db = getDb()
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true, quoteRequestId: true, vehicle: true, customerEmail: true, customerName: true,
      quoteRequest: { select: { status: true } },
    },
  })
  if (!appointment) throw new AppointmentNotFoundError()

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

  const result: CompleteInterventionResult = { notified: false, alreadyNotified: false, notifyError: null }

  if (notifyClient && appointment.customerEmail) {
    const claimed = await db.appointment.updateMany({
      where: { id: appointmentId, vehicleReadyNotifiedAt: null },
      data: { vehicleReadyNotifiedAt: new Date() },
    })

    if (claimed.count === 1) {
      try {
        await sendVehicleReadyEmail({
          customerEmail: appointment.customerEmail,
          customerFirstName: appointment.customerName.split(' ')[0] || appointment.customerName,
          vehicle: appointment.vehicle,
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
        result.notifyError = message
        await logActivityEvent({
          quoteRequestId: appointment.quoteRequestId,
          appointmentId: appointment.id,
          type: ACTIVITY_EVENT_TYPES.VEHICLE_READY_NOTIFICATION_FAILED,
          title: 'Échec de la notification client — véhicule prêt',
          metadata: { error: message },
        })
      }
    } else {
      result.alreadyNotified = true
    }
  }

  return result
}

export async function markVehicleReturned(appointmentId: string): Promise<void> {
  await applyForwardTransition(appointmentId, 'RESTITUE', ACTIVITY_EVENT_TYPES.VEHICLE_RETURNED, 'Véhicule restitué au client')
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

  await db.appointment.update({ where: { id: appointmentId }, data: { workshopStatus: newStatus } })

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
