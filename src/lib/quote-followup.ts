import { isFollowupEligible } from './quote-pipeline'

/**
 * Règles pures des relances commerciales — aucun accès DB/réseau ici, même
 * principe que src/lib/agenda/workshop-status.ts. La résolution du statut
 * Pennylane (correspondance par numéro de devis, voir automation-runner.ts)
 * est faite par l'appelant ; ce module ne fait que décider à partir de
 * valeurs déjà résolues.
 *
 * Lien devis Pennylane ↔ demande (décision explicite, 2026-08-10) : le cache
 * v2 (getCustomerFinancials) agrège TOUS les devis Pennylane d'un même
 * CLIENT, sans lien direct vers une demande précise. On ne bloque donc une
 * relance par Pennylane QUE si `pennylaneQuoteNumber` a été renseigné à la
 * main pour CETTE demande (ancien flux manuel) ET qu'un devis correspondant
 * est retrouvé dans le cache — sinon (numéro absent, ou introuvable), le
 * statut Pennylane est "unknown" et ne bloque jamais : la relance suit
 * uniquement les réglages internes (délais/activation). Prudence délibérée :
 * mieux vaut ne pas bloquer par erreur qu'inventer un statut.
 */

export type PennylaneGateStatus = 'pending' | 'accepted' | 'denied' | 'expired' | 'invoiced' | 'unknown'

/** true si CE statut Pennylane doit bloquer toute relance, quels que soient les réglages internes. */
export function isFollowupBlockedByPennylane(status: PennylaneGateStatus): boolean {
  return status === 'accepted' || status === 'invoiced' || status === 'denied'
}

export interface FollowupCandidate {
  status: string
  /** Date du (dernier) passage à DEVIS_ENVOYE — null si jamais renseigné (jamais de relance à l'aveugle dans ce cas). */
  quoteSentAt: Date | null
  /** 0 = aucune relance envoyée, 1 = une relance envoyée, 2 = deux (jamais plus). */
  followupStage: number
  lastFollowupSentAt: Date | null
}

export interface FollowupSettings {
  followupDelay1Days: number
  followupDelay2Days: number
  followupAutomationEnabled: boolean
}

export type FollowupDecision = { stage: 1 | 2 } | null

/**
 * Décide si une relance est due MAINTENANT, et laquelle (1 ou 2) — ou `null`
 * sinon. Règles, dans l'ordre :
 *  1. Automation désactivée globalement → jamais.
 *  2. Statut commercial pas éligible (voir isFollowupEligible) → jamais.
 *  3. Statut Pennylane bloquant (accepted/invoiced/denied) → jamais, quels
 *     que soient les réglages — ne fait jamais régresser silencieusement le
 *     pipeline en relançant un client déjà accepté/facturé/refusé.
 *  4. Déjà 2 relances envoyées → jamais de 3e.
 *  5. Aucun repère temporel fiable (quoteSentAt absent) → jamais.
 *  6. Sinon, compare le délai écoulé depuis le bon repère (quoteSentAt pour
 *     la 1re relance, lastFollowupSentAt pour la 2e) au délai configuré.
 */
export function computeFollowupDecision(
  candidate: FollowupCandidate,
  settings: FollowupSettings,
  pennylaneGateStatus: PennylaneGateStatus,
  now: Date
): FollowupDecision {
  if (!settings.followupAutomationEnabled) return null
  if (!isFollowupEligible(candidate.status)) return null
  if (isFollowupBlockedByPennylane(pennylaneGateStatus)) return null
  if (candidate.followupStage >= 2) return null
  if (!candidate.quoteSentAt) return null

  if (candidate.followupStage === 0) {
    const dueAt = candidate.quoteSentAt.getTime() + settings.followupDelay1Days * 86_400_000
    return now.getTime() >= dueAt ? { stage: 1 } : null
  }

  const base = candidate.lastFollowupSentAt ?? candidate.quoteSentAt
  const dueAt = base.getTime() + settings.followupDelay2Days * 86_400_000
  return now.getTime() >= dueAt ? { stage: 2 } : null
}
