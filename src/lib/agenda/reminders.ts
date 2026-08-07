/**
 * Calcul des rappels dus — fonction pure, aucun accès réseau/DB/envoi
 * d'email. Prépare l'architecture des rappels 24h/1h avant le rendez-vous
 * (champs `reminder24hSentAt`/`reminder1hSentAt` sur Appointment, voir la
 * migration 20260807003612) SANS activer de déclencheur automatique (aucun
 * cron branché) — décision produit explicite : "pas forcément l'activer,
 * mais prévoir 24h avant / 1h avant".
 *
 * Utilisation future (phase 3, hors périmètre ici) : un job planifié
 * (Vercel Cron ou équivalent) appellerait `dueReminders()` avec la liste des
 * rendez-vous CONFIRMED à venir, enverrait l'email correspondant via
 * src/lib/email.ts (sendAppointmentConfirmationEmail sert de modèle), puis
 * marquerait reminder24hSentAt/reminder1hSentAt.
 */

export type ReminderKind = '24h' | '1h'

export interface ReminderCandidate {
  id: string
  startAt: Date
  status: string
  reminder24hSentAt: Date | null
  reminder1hSentAt: Date | null
}

const WINDOW_24H_MS = 24 * 3600 * 1000
const WINDOW_1H_MS = 1 * 3600 * 1000
/** Tolérance autour de l'échéance exacte — un job qui tourne toutes les 15 min ne tombera jamais pile sur -24h00m00s. */
const TOLERANCE_MS = 15 * 60 * 1000

function isDue(now: Date, startAt: Date, windowMs: number, alreadySent: Date | null): boolean {
  if (alreadySent) return false
  const msUntilStart = startAt.getTime() - now.getTime()
  return msUntilStart <= windowMs + TOLERANCE_MS && msUntilStart > windowMs - TOLERANCE_MS
}

/** Rendez-vous CONFIRMED pour lesquels un rappel 24h et/ou 1h est dû maintenant (jamais déjà envoyé). */
export function dueReminders(appointments: ReminderCandidate[], now: Date = new Date()): { id: string; kind: ReminderKind }[] {
  const due: { id: string; kind: ReminderKind }[] = []
  for (const appt of appointments) {
    if (appt.status !== 'CONFIRMED') continue
    if (isDue(now, appt.startAt, WINDOW_24H_MS, appt.reminder24hSentAt)) due.push({ id: appt.id, kind: '24h' })
    if (isDue(now, appt.startAt, WINDOW_1H_MS, appt.reminder1hSentAt)) due.push({ id: appt.id, kind: '1h' })
  }
  return due
}
