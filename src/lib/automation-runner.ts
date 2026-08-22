import 'server-only'
import { getDb } from '@/lib/db'
import { getSiteSettings } from '@/lib/settings-repo'
import { getCustomerFinancials } from '@/lib/pennylane-v2/financials'
import { dueReminders } from '@/lib/agenda/reminders'
import { isReviewRequestDue } from '@/lib/agenda/review-request'
import { computeFollowupDecision, type PennylaneGateStatus } from '@/lib/quote-followup'
import { logActivityEvent, ACTIVITY_EVENT_TYPES } from '@/lib/activity-events'
import { sendAppointmentReminderEmail, sendFollowupEmail, sendReviewRequestEmail } from '@/lib/email'

/**
 * Point d'entrée unique des automatisations commerciales (rappels, relances,
 * demandes d'avis) — voir docs/MAINTENANCE.md pour le détail. Volontairement
 * PAS branché sur un cron Vercel pour l'instant (aucun secret/cron créé) :
 * appelable manuellement (route protégée admin) en attendant.
 *
 * Isolation stricte : chaque catégorie, et chaque ÉLÉMENT à l'intérieur
 * d'une catégorie, est traité dans son propre try/catch — l'échec d'un
 * rappel/d'une relance/d'une demande d'avis n'empêche jamais le traitement
 * des autres (voir chaque boucle ci-dessous). Idempotent par construction :
 * relance toujours possible sans double-envoi, chaque action pure (voir
 * dueReminders/computeFollowupDecision/isReviewRequestDue) décide APRÈS
 * lecture fraîche de l'état persistant, jamais sur un état en mémoire
 * partagé entre deux exécutions.
 */

export interface AutomationCategoryResult {
  checked: number
  sent: number
  failed: number
  errors: string[]
}

export interface AutomationRunResult {
  reminders: AutomationCategoryResult
  followups: AutomationCategoryResult
  reviewRequests: AutomationCategoryResult
}

function emptyResult(): AutomationCategoryResult {
  return { checked: 0, sent: 0, failed: 0, errors: [] }
}

async function runReminders(now: Date): Promise<AutomationCategoryResult> {
  const result = emptyResult()
  const db = getDb()

  // Fenêtre large (26h) pour couvrir le rappel 24h + sa tolérance — dueReminders()
  // fait le tri précis, cette requête ne fait que borner raisonnablement le volume.
  const windowEnd = new Date(now.getTime() + 26 * 3600 * 1000)
  const candidates = await db.appointment.findMany({
    where: {
      status: 'CONFIRMED',
      startAt: { gte: now, lte: windowEnd },
      OR: [{ reminder24hSentAt: null }, { reminder1hSentAt: null }],
    },
    select: {
      id: true, quoteRequestId: true, customerName: true, customerEmail: true, vehicle: true,
      startAt: true, endAt: true, durationMinutes: true, status: true, reminder24hSentAt: true, reminder1hSentAt: true,
    },
  })
  result.checked = candidates.length

  const due = dueReminders(candidates, now)
  const byId = new Map(candidates.map((c) => [c.id, c]))

  for (const { id, kind } of due) {
    const appt = byId.get(id)
    if (!appt) continue
    try {
      if (appt.customerEmail) {
        await sendAppointmentReminderEmail(kind, {
          customerEmail: appt.customerEmail,
          customerFirstName: appt.customerName.split(' ')[0] || appt.customerName,
          vehicle: appt.vehicle,
          startAt: appt.startAt,
          endAt: appt.endAt,
          durationMinutes: appt.durationMinutes,
          appointmentId: appt.id,
        })
      }
      // Marqué "envoyé" même sans email (RDV manuel) — pas de renvoi indéfini
      // tenté à chaque exécution pour un rendez-vous qui n'a pas d'email.
      await db.appointment.update({
        where: { id },
        data: kind === '24h' ? { reminder24hSentAt: now } : { reminder1hSentAt: now },
      })
      if (appt.customerEmail) {
        await logActivityEvent({
          quoteRequestId: appt.quoteRequestId,
          appointmentId: appt.id,
          type: ACTIVITY_EVENT_TYPES.REMINDER_SENT,
          title: `Rappel ${kind} envoyé — ${appt.vehicle}`,
          actor: 'system',
        })
      }
      result.sent++
    } catch (err) {
      result.failed++
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      result.errors.push(`rappel ${kind} (${id}): ${message}`)
      console.error(`[automation-runner] Échec du rappel ${kind} pour le rendez-vous ${id} :`, err)
    }
  }

  return result
}

async function resolvePennylaneGateStatus(quoteRequestId: string, pennylaneQuoteNumber: string | null): Promise<PennylaneGateStatus> {
  if (!pennylaneQuoteNumber) return 'unknown'
  const financials = await getCustomerFinancials(quoteRequestId)
  const match = financials.quotes.find((q) => q.number === pennylaneQuoteNumber)
  return match ? match.status : 'unknown'
}

async function runFollowups(now: Date): Promise<AutomationCategoryResult> {
  const result = emptyResult()
  const db = getDb()
  const settings = await getSiteSettings()

  if (!settings.followupAutomationEnabled) return result

  const candidates = await db.quoteRequest.findMany({
    where: { status: 'DEVIS_ENVOYE', followupStage: { lt: 2 } },
    select: {
      id: true, nom: true, prenom: true, email: true, marque: true, modele: true, status: true,
      quoteSentAt: true, followupStage: true, lastFollowupSentAt: true, pennylaneQuoteNumber: true,
    },
  })
  result.checked = candidates.length

  for (const q of candidates) {
    try {
      const pennylaneGateStatus = await resolvePennylaneGateStatus(q.id, q.pennylaneQuoteNumber)
      const decision = computeFollowupDecision(
        { status: q.status, quoteSentAt: q.quoteSentAt, followupStage: q.followupStage, lastFollowupSentAt: q.lastFollowupSentAt },
        settings,
        pennylaneGateStatus,
        now
      )
      if (!decision) continue

      await sendFollowupEmail({ customerEmail: q.email, customerFirstName: q.prenom, vehicle: `${q.marque} ${q.modele}` })
      await db.quoteRequest.update({ where: { id: q.id }, data: { followupStage: decision.stage, lastFollowupSentAt: now } })
      await logActivityEvent({
        quoteRequestId: q.id,
        type: ACTIVITY_EVENT_TYPES.FOLLOWUP_SENT,
        title: `Relance commerciale n°${decision.stage} envoyée`,
        actor: 'system',
      })
      result.sent++
    } catch (err) {
      result.failed++
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      result.errors.push(`relance (${q.id}): ${message}`)
      console.error(`[automation-runner] Échec de la relance pour la demande ${q.id} :`, err)
    }
  }

  return result
}

async function runReviewRequests(now: Date): Promise<AutomationCategoryResult> {
  const result = emptyResult()
  const db = getDb()
  const settings = await getSiteSettings()

  if (!settings.reviewRequestEnabled || !settings.googleReviewsUrl) return result

  const candidates = await db.appointment.findMany({
    where: { workshopStatus: 'RESTITUE', reviewRequestSentAt: null, customerEmail: { not: null } },
    select: {
      id: true, quoteRequestId: true, customerName: true, customerEmail: true, vehicle: true,
      workshopStatus: true, vehicleReturnedAt: true, reviewRequestSentAt: true,
    },
  })
  result.checked = candidates.length

  for (const appt of candidates) {
    try {
      const due = isReviewRequestDue(
        {
          workshopStatus: appt.workshopStatus,
          customerEmail: appt.customerEmail,
          vehicleReturnedAt: appt.vehicleReturnedAt,
          reviewRequestSentAt: appt.reviewRequestSentAt,
        },
        settings,
        now
      )
      if (!due || !appt.customerEmail) continue

      await sendReviewRequestEmail({
        customerEmail: appt.customerEmail,
        customerFirstName: appt.customerName.split(' ')[0] || appt.customerName,
        vehicle: appt.vehicle,
        googleReviewsUrl: settings.googleReviewsUrl,
      })
      await db.appointment.update({ where: { id: appt.id }, data: { reviewRequestSentAt: now } })
      await logActivityEvent({
        quoteRequestId: appt.quoteRequestId,
        appointmentId: appt.id,
        type: ACTIVITY_EVENT_TYPES.REVIEW_REQUEST_SENT,
        title: 'Demande d\'avis Google envoyée',
        actor: 'system',
      })
      result.sent++
    } catch (err) {
      result.failed++
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      result.errors.push(`avis (${appt.id}): ${message}`)
      console.error(`[automation-runner] Échec de la demande d'avis pour le rendez-vous ${appt.id} :`, err)
    }
  }

  return result
}

/**
 * Exécute les trois catégories d'automatisation. Chaque catégorie est
 * indépendante (l'échec total d'une catégorie — ex. panne Resend — ne
 * bloque pas les deux autres) ; à l'intérieur d'une catégorie, chaque
 * élément est également isolé (voir les boucles ci-dessus).
 */
export async function runAutomations(now: Date = new Date()): Promise<AutomationRunResult> {
  const [reminders, followups, reviewRequests] = await Promise.allSettled([
    runReminders(now),
    runFollowups(now),
    runReviewRequests(now),
  ]).then((results) =>
    results.map((r) => {
      if (r.status === 'fulfilled') return r.value
      console.error('[automation-runner] Échec total d\'une catégorie (non bloquant pour les autres) :', r.reason)
      const errored = emptyResult()
      errored.errors.push(r.reason instanceof Error ? r.reason.message : 'Erreur inconnue')
      return errored
    })
  )

  return { reminders, followups, reviewRequests }
}
