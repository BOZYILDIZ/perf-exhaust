/**
 * Règle pure de la demande d'avis Google — aucun accès DB/réseau, même
 * principe que workshop-status.ts/reminders.ts. Rattachée à Appointment (pas
 * QuoteRequest) : fonctionne identiquement pour un rendez-vous manuel.
 * Réutilise SiteSettings.googleReviewsUrl (déjà configurable ailleurs, ex.
 * badge du footer) — aucune nouvelle source de vérité pour cette URL.
 */

export interface ReviewRequestCandidate {
  workshopStatus: string | null
  customerEmail: string | null
  /** Date du passage à RESTITUE — voir Appointment.vehicleReturnedAt. */
  vehicleReturnedAt: Date | null
  /** Non-null si une demande a déjà été envoyée pour ce rendez-vous — jamais deux fois. */
  reviewRequestSentAt: Date | null
}

export interface ReviewRequestSettings {
  reviewRequestEnabled: boolean
  reviewRequestDelayHours: number
  googleReviewsUrl: string
}

/**
 * true si une demande d'avis est due MAINTENANT pour ce rendez-vous :
 *  - réglage désactivé, ou aucune URL Google configurée → jamais.
 *  - pas encore RESTITUE, ou déjà envoyée, ou aucun email client → jamais.
 *  - aucun repère temporel fiable (vehicleReturnedAt absent) → jamais.
 *  - sinon, compare le délai écoulé depuis la restitution au délai configuré.
 */
export function isReviewRequestDue(candidate: ReviewRequestCandidate, settings: ReviewRequestSettings, now: Date): boolean {
  if (!settings.reviewRequestEnabled) return false
  if (!settings.googleReviewsUrl) return false
  if (candidate.workshopStatus !== 'RESTITUE') return false
  if (candidate.reviewRequestSentAt) return false
  if (!candidate.customerEmail) return false
  if (!candidate.vehicleReturnedAt) return false

  const dueAt = candidate.vehicleReturnedAt.getTime() + settings.reviewRequestDelayHours * 3_600_000
  return now.getTime() >= dueAt
}
