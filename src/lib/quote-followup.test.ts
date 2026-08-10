/**
 * Tests déterministes des règles pures de relance commerciale — aucun accès
 * DB/réseau. Couvre en particulier le gate Pennylane (accepted/invoiced/denied
 * bloquent toujours, pending/expired/unknown jamais) et les deux délais
 * (relance 1 depuis quoteSentAt, relance 2 depuis lastFollowupSentAt).
 *
 *   npx tsx src/lib/quote-followup.test.ts
 */
import { computeFollowupDecision, isFollowupBlockedByPennylane, type FollowupSettings } from './quote-followup'

let passed = 0
let failed = 0
function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++
    console.log(`PASS — ${name}`)
  } else {
    failed++
    console.log(`FAIL — ${name}${detail ? ' :: ' + detail : ''}`)
  }
}

const NOW = new Date('2026-08-10T12:00:00.000Z')
const SETTINGS: FollowupSettings = { followupDelay1Days: 3, followupDelay2Days: 7, followupAutomationEnabled: true }
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000)

// ===== isFollowupBlockedByPennylane =====

check('accepted → bloque', isFollowupBlockedByPennylane('accepted') === true)
check('invoiced → bloque', isFollowupBlockedByPennylane('invoiced') === true)
check('denied → bloque', isFollowupBlockedByPennylane('denied') === true)
check('pending → ne bloque pas', isFollowupBlockedByPennylane('pending') === false)
check('expired → ne bloque pas', isFollowupBlockedByPennylane('expired') === false)
check('unknown (pas de devis Pennylane connu pour cette demande) → ne bloque pas', isFollowupBlockedByPennylane('unknown') === false)

// ===== computeFollowupDecision — automation désactivée =====

check(
  'automation désactivée globalement → jamais de relance même si tout le reste est éligible',
  computeFollowupDecision(
    { status: 'DEVIS_ENVOYE', quoteSentAt: daysAgo(10), followupStage: 0, lastFollowupSentAt: null },
    { ...SETTINGS, followupAutomationEnabled: false },
    'pending',
    NOW
  ) === null
)

// ===== computeFollowupDecision — statut commercial non éligible =====

check(
  'statut ACCEPTE (pas DEVIS_ENVOYE) → jamais de relance',
  computeFollowupDecision(
    { status: 'ACCEPTE', quoteSentAt: daysAgo(10), followupStage: 0, lastFollowupSentAt: null },
    SETTINGS,
    'pending',
    NOW
  ) === null
)

// ===== computeFollowupDecision — gate Pennylane =====

check(
  'devis Pennylane accepted → jamais de relance, même délai dépassé et automation activée',
  computeFollowupDecision(
    { status: 'DEVIS_ENVOYE', quoteSentAt: daysAgo(10), followupStage: 0, lastFollowupSentAt: null },
    SETTINGS,
    'accepted',
    NOW
  ) === null
)
check(
  'devis Pennylane denied → jamais de relance',
  computeFollowupDecision(
    { status: 'DEVIS_ENVOYE', quoteSentAt: daysAgo(10), followupStage: 0, lastFollowupSentAt: null },
    SETTINGS,
    'denied',
    NOW
  ) === null
)
check(
  'devis Pennylane pending → relance autorisée (si délai dépassé)',
  computeFollowupDecision(
    { status: 'DEVIS_ENVOYE', quoteSentAt: daysAgo(10), followupStage: 0, lastFollowupSentAt: null },
    SETTINGS,
    'pending',
    NOW
  )?.stage === 1
)
check(
  'devis Pennylane expired → relance autorisée (si délai dépassé)',
  computeFollowupDecision(
    { status: 'DEVIS_ENVOYE', quoteSentAt: daysAgo(10), followupStage: 0, lastFollowupSentAt: null },
    SETTINGS,
    'expired',
    NOW
  )?.stage === 1
)

// ===== computeFollowupDecision — relance 1 (délai depuis quoteSentAt) =====

check(
  'devis envoyé il y a 2 jours (délai 3j) → pas encore due',
  computeFollowupDecision(
    { status: 'DEVIS_ENVOYE', quoteSentAt: daysAgo(2), followupStage: 0, lastFollowupSentAt: null },
    SETTINGS,
    'unknown',
    NOW
  ) === null
)
check(
  'devis envoyé il y a exactement 3 jours (délai 3j) → due',
  computeFollowupDecision(
    { status: 'DEVIS_ENVOYE', quoteSentAt: daysAgo(3), followupStage: 0, lastFollowupSentAt: null },
    SETTINGS,
    'unknown',
    NOW
  )?.stage === 1
)
check(
  'devis envoyé il y a 10 jours, jamais relancé → relance 1 due',
  computeFollowupDecision(
    { status: 'DEVIS_ENVOYE', quoteSentAt: daysAgo(10), followupStage: 0, lastFollowupSentAt: null },
    SETTINGS,
    'unknown',
    NOW
  )?.stage === 1
)
check(
  'quoteSentAt absent (jamais renseigné) → jamais de relance, même très ancien créé',
  computeFollowupDecision(
    { status: 'DEVIS_ENVOYE', quoteSentAt: null, followupStage: 0, lastFollowupSentAt: null },
    SETTINGS,
    'unknown',
    NOW
  ) === null
)

// ===== computeFollowupDecision — relance 2 (délai depuis lastFollowupSentAt) =====

check(
  'relance 1 déjà envoyée il y a 5 jours (délai 2 = 7j) → pas encore due',
  computeFollowupDecision(
    { status: 'DEVIS_ENVOYE', quoteSentAt: daysAgo(20), followupStage: 1, lastFollowupSentAt: daysAgo(5) },
    SETTINGS,
    'unknown',
    NOW
  ) === null
)
check(
  'relance 1 déjà envoyée il y a 8 jours (délai 2 = 7j) → relance 2 due',
  computeFollowupDecision(
    { status: 'DEVIS_ENVOYE', quoteSentAt: daysAgo(20), followupStage: 1, lastFollowupSentAt: daysAgo(8) },
    SETTINGS,
    'unknown',
    NOW
  )?.stage === 2
)
check(
  'followupStage déjà à 2 → jamais de 3e relance, même délai largement dépassé',
  computeFollowupDecision(
    { status: 'DEVIS_ENVOYE', quoteSentAt: daysAgo(100), followupStage: 2, lastFollowupSentAt: daysAgo(90) },
    SETTINGS,
    'unknown',
    NOW
  ) === null
)
check(
  'followupStage 1 mais lastFollowupSentAt jamais renseigné (incohérence défensive) → repli sur quoteSentAt',
  computeFollowupDecision(
    { status: 'DEVIS_ENVOYE', quoteSentAt: daysAgo(10), followupStage: 1, lastFollowupSentAt: null },
    SETTINGS,
    'unknown',
    NOW
  )?.stage === 2
)

console.log(`\n=== ${passed}/${passed + failed} tests réussis ===`)
if (failed > 0) process.exit(1)
