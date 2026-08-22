/**
 * Tests déterministes de la règle pure de demande d'avis Google — aucun
 * accès DB/réseau. Couvre : jamais avant RESTITUE, jamais deux fois, jamais
 * sans email/URL configurée, et le délai depuis vehicleReturnedAt.
 *
 *   npx tsx src/lib/agenda/review-request.test.ts
 */
import { isReviewRequestDue, type ReviewRequestSettings } from './review-request'

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
const SETTINGS: ReviewRequestSettings = { reviewRequestEnabled: true, reviewRequestDelayHours: 24, googleReviewsUrl: 'https://g.page/r/example/review' }
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000)

check(
  'RESTITUE depuis 30h (délai 24h), jamais envoyée, email présent → due',
  isReviewRequestDue({ workshopStatus: 'RESTITUE', customerEmail: 'a@b.fr', vehicleReturnedAt: hoursAgo(30), reviewRequestSentAt: null }, SETTINGS, NOW) === true
)
check(
  'RESTITUE depuis exactement le délai configuré → due',
  isReviewRequestDue({ workshopStatus: 'RESTITUE', customerEmail: 'a@b.fr', vehicleReturnedAt: hoursAgo(24), reviewRequestSentAt: null }, SETTINGS, NOW) === true
)
check(
  'RESTITUE depuis seulement 5h (délai 24h) → pas encore due',
  isReviewRequestDue({ workshopStatus: 'RESTITUE', customerEmail: 'a@b.fr', vehicleReturnedAt: hoursAgo(5), reviewRequestSentAt: null }, SETTINGS, NOW) === false
)
check(
  'pas encore RESTITUE (TERMINE) → jamais due',
  isReviewRequestDue({ workshopStatus: 'TERMINE', customerEmail: 'a@b.fr', vehicleReturnedAt: null, reviewRequestSentAt: null }, SETTINGS, NOW) === false
)
check(
  'déjà envoyée précédemment → jamais une deuxième fois, même si RESTITUE et délai dépassé',
  isReviewRequestDue({ workshopStatus: 'RESTITUE', customerEmail: 'a@b.fr', vehicleReturnedAt: hoursAgo(100), reviewRequestSentAt: hoursAgo(50) }, SETTINGS, NOW) === false
)
check(
  'aucun email client (RDV manuel) → jamais due',
  isReviewRequestDue({ workshopStatus: 'RESTITUE', customerEmail: null, vehicleReturnedAt: hoursAgo(30), reviewRequestSentAt: null }, SETTINGS, NOW) === false
)
check(
  'réglage désactivé → jamais due même si tout le reste est réuni',
  isReviewRequestDue({ workshopStatus: 'RESTITUE', customerEmail: 'a@b.fr', vehicleReturnedAt: hoursAgo(100), reviewRequestSentAt: null }, { ...SETTINGS, reviewRequestEnabled: false }, NOW) === false
)
check(
  'aucune URL Google configurée → jamais due (pas de lien à envoyer)',
  isReviewRequestDue({ workshopStatus: 'RESTITUE', customerEmail: 'a@b.fr', vehicleReturnedAt: hoursAgo(100), reviewRequestSentAt: null }, { ...SETTINGS, googleReviewsUrl: '' }, NOW) === false
)
check(
  'vehicleReturnedAt absent (incohérence défensive, ex. RESTITUE atteint avant ce champ) → jamais due, pas de repère temporel fiable',
  isReviewRequestDue({ workshopStatus: 'RESTITUE', customerEmail: 'a@b.fr', vehicleReturnedAt: null, reviewRequestSentAt: null }, SETTINGS, NOW) === false
)

console.log(`\n=== ${passed}/${passed + failed} tests réussis ===`)
if (failed > 0) process.exit(1)
