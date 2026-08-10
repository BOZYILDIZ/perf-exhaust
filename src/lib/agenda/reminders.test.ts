/**
 * Tests déterministes du calcul des rappels dus — aucun accès DB/réseau.
 * Cette fonction préexistait sans jamais être appelée ; branchée en Phase D
 * (voir src/lib/automation-runner.ts), elle mérite maintenant une couverture
 * réelle, en particulier : jamais pour un RDV annulé/passé, jamais deux fois
 * pour la même échéance, la tolérance de ±15 min autour de chaque fenêtre.
 *
 *   npx tsx src/lib/agenda/reminders.test.ts
 */
import { dueReminders, type ReminderCandidate } from './reminders'

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
const HOUR_MS = 3_600_000
const base = (over: Partial<ReminderCandidate>): ReminderCandidate => ({
  id: 'a1', startAt: new Date(NOW.getTime() + 24 * HOUR_MS), status: 'CONFIRMED',
  reminder24hSentAt: null, reminder1hSentAt: null, ...over,
})

check(
  'rendez-vous dans exactement 24h, jamais rappelé → rappel 24h dû',
  dueReminders([base({})], NOW).some((d) => d.id === 'a1' && d.kind === '24h')
)
check(
  'rendez-vous dans exactement 1h, jamais rappelé → rappel 1h dû',
  dueReminders([base({ startAt: new Date(NOW.getTime() + 1 * HOUR_MS) })], NOW).some((d) => d.id === 'a1' && d.kind === '1h')
)
check(
  'rendez-vous dans 24h mais rappel 24h déjà envoyé → jamais un second envoi',
  dueReminders([base({ reminder24hSentAt: new Date(NOW.getTime() - HOUR_MS) })], NOW).length === 0
)
check(
  'rendez-vous dans 5 jours (hors fenêtre 24h) → aucun rappel dû',
  dueReminders([base({ startAt: new Date(NOW.getTime() + 5 * 24 * HOUR_MS) })], NOW).length === 0
)
check(
  'rendez-vous ANNULÉ dans 24h, jamais rappelé → jamais de rappel',
  dueReminders([base({ status: 'CANCELLED' })], NOW).length === 0
)
check(
  'rendez-vous déjà PASSÉ (dans le passé), jamais rappelé → jamais de rappel (hors fenêtre)',
  dueReminders([base({ startAt: new Date(NOW.getTime() - 2 * HOUR_MS) })], NOW).length === 0
)
check(
  'rendez-vous NO_SHOW dans 1h → jamais de rappel (statut non CONFIRMED)',
  dueReminders([base({ status: 'NO_SHOW', startAt: new Date(NOW.getTime() + HOUR_MS) })], NOW).length === 0
)
check(
  'tolérance : dans 23h50 (10 min avant la fenêtre 24h exacte) → rappel 24h considéré dû',
  dueReminders([base({ startAt: new Date(NOW.getTime() + 23 * HOUR_MS + 50 * 60_000) })], NOW).some((d) => d.kind === '24h')
)
check(
  'hors tolérance : dans 22h (40 min hors fenêtre) → rappel 24h pas encore dû',
  dueReminders([base({ startAt: new Date(NOW.getTime() + 22 * HOUR_MS) })], NOW).length === 0
)
check(
  'les deux rappels peuvent être dus indépendamment pour deux RDV différents dans la même exécution',
  (() => {
    const r = dueReminders(
      [base({ id: 'x', startAt: new Date(NOW.getTime() + 24 * HOUR_MS) }), base({ id: 'y', startAt: new Date(NOW.getTime() + HOUR_MS) })],
      NOW
    )
    return r.some((d) => d.id === 'x' && d.kind === '24h') && r.some((d) => d.id === 'y' && d.kind === '1h')
  })()
)

console.log(`\n=== ${passed}/${passed + failed} tests réussis ===`)
if (failed > 0) process.exit(1)
