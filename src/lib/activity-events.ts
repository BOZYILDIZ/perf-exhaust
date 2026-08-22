import { getDb } from '@/lib/db'

/**
 * Types d'événements de la timeline métier — String libre côté Prisma (voir
 * ActivityEvent dans prisma/schema.prisma), cette liste documente juste les
 * valeurs réellement émises par le code. Ajouter un type n'exige aucune
 * migration : il suffit de l'ajouter ici et de l'utiliser.
 */
export const ACTIVITY_EVENT_TYPES = {
  QUOTE_REQUEST_CREATED: 'QUOTE_REQUEST_CREATED',
  PENNYLANE_CUSTOMER_SYNCED: 'PENNYLANE_CUSTOMER_SYNCED',
  QUOTE_STATUS_CHANGED: 'QUOTE_STATUS_CHANGED',
  PENNYLANE_QUOTE_DETECTED: 'PENNYLANE_QUOTE_DETECTED',
  APPOINTMENT_CREATED: 'APPOINTMENT_CREATED',
  APPOINTMENT_RESCHEDULED: 'APPOINTMENT_RESCHEDULED',
  APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',
  VEHICLE_ARRIVED: 'VEHICLE_ARRIVED',
  WORK_STARTED: 'WORK_STARTED',
  WORK_COMPLETED: 'WORK_COMPLETED',
  VEHICLE_RETURNED: 'VEHICLE_RETURNED',
  VEHICLE_READY_NOTIFICATION_SENT: 'VEHICLE_READY_NOTIFICATION_SENT',
  VEHICLE_READY_NOTIFICATION_FAILED: 'VEHICLE_READY_NOTIFICATION_FAILED',
  WORKSHOP_STATUS_CORRECTED: 'WORKSHOP_STATUS_CORRECTED',
  FOLLOWUP_SENT: 'FOLLOWUP_SENT',
  REVIEW_REQUEST_SENT: 'REVIEW_REQUEST_SENT',
  REMINDER_SENT: 'REMINDER_SENT',
} as const

export type ActivityEventType = (typeof ACTIVITY_EVENT_TYPES)[keyof typeof ACTIVITY_EVENT_TYPES]

interface LogActivityEventInput {
  quoteRequestId?: string | null
  appointmentId?: string | null
  type: ActivityEventType
  title: string
  /** Uniquement des données d'affichage (ex. ancien/nouveau statut) — jamais un secret. */
  metadata?: Record<string, unknown> | null
  actor?: 'admin' | 'system' | 'customer'
}

/**
 * Journalise un événement de la timeline métier. Best-effort volontaire : la
 * timeline est un outil de visibilité, jamais un chemin critique — une panne
 * d'écriture ici ne doit jamais faire échouer l'action métier qui l'a
 * déclenchée (changement de statut, création de RDV...). Toujours appelé
 * après l'action principale, jamais avant, jamais dans la même transaction.
 */
export async function logActivityEvent(input: LogActivityEventInput): Promise<void> {
  try {
    const db = getDb()
    await db.activityEvent.create({
      data: {
        quoteRequestId: input.quoteRequestId ?? null,
        appointmentId: input.appointmentId ?? null,
        type: input.type,
        title: input.title,
        metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
        actor: input.actor ?? 'admin',
      },
    })
  } catch (err) {
    console.error('[activity-events] Échec de journalisation (non bloquant) :', err)
  }
}
