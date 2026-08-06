/**
 * Types partagés de l'agenda atelier — aucune dépendance externe, aucun
 * accès réseau/DB. Voir docs/MAINTENANCE.md § "Agenda atelier" pour le détail
 * de l'architecture.
 */

export type WeekdayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export const WEEKDAY_KEYS: WeekdayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

/**
 * Horaires d'un jour — deux créneaux ("morning"/"afternoon") dont l'écart
 * (morningEnd → afternoonStart) EST la pause déjeuner. Heures au format
 * "HH:MM", toujours interprétées en Europe/Paris (voir timezone.ts).
 * `afternoonStart`/`afternoonEnd` vides ("") = pas de créneau après-midi
 * (journée continue ou matin seul).
 */
export interface DayHours {
  enabled: boolean
  morningStart: string
  morningEnd: string
  afternoonStart: string
  afternoonEnd: string
}

export type WeeklyHours = Record<WeekdayKey, DayHours>

export interface TimeSlot {
  startAt: Date
  endAt: Date
}

/** Rendez-vous existant à prendre en compte pour le calcul — seuls les statuts bloquants sont passés par l'appelant (voir appointments.ts). */
export interface ExistingAppointmentWindow {
  startAt: Date
  endAt: Date
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

/** Statuts qui bloquent réellement un créneau — CANCELLED/NO_SHOW libèrent le créneau, COMPLETED est un rendez-vous passé (ne peut plus entrer en conflit avec un futur créneau mais reste inclus par prudence si jamais appelé avec des dates passées). */
export const BLOCKING_APPOINTMENT_STATUSES: AppointmentStatus[] = ['PENDING', 'CONFIRMED', 'COMPLETED']

export type CancelledBy = 'CUSTOMER' | 'WORKSHOP'
