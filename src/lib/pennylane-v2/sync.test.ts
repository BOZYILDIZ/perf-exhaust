/**
 * Tests déterministes de la logique de correspondance client Pennylane —
 * aucun appel réseau, aucune base de données : uniquement les fonctions
 * pures exportées par matching.ts (decideEmailMatch, decidePhoneMatch,
 * decideLocallyKnownMatch, resolveAlreadyKnownCustomer, isNameCompatible).
 * sync.ts (l'orchestrateur réel, avec DB/réseau) n'est pas testable
 * directement par tsx hors d'un build Next.js — son `import 'server-only'`
 * lève une erreur volontaire hors de ce contexte.
 *
 * Règle centrale vérifiée partout : un numéro de téléphone identique n'est
 * JAMAIS une preuve suffisante seul — il faut en plus un nom compatible ;
 * un email exact reste toujours suffisant seul si unique ; plusieurs
 * correspondances (email ou téléphone) sont toujours AMBIGUOUS.
 *
 *   npx tsx src/lib/pennylane-v2/sync.test.ts
 */
import {
  decideEmailMatch,
  decidePhoneMatch,
  decideLocallyKnownMatch,
  resolveAlreadyKnownCustomer,
  isNameCompatible,
  type LocalSyncCandidate,
} from './matching'
import type { PennylaneIndividualCustomer } from './types'

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

function individual(id: number, firstName: string, lastName: string, phone: string, email: string): PennylaneIndividualCustomer {
  return { id, first_name: firstName, last_name: lastName, phone, emails: [email], customer_type: 'individual' }
}

// 1. Même email → même client
{
  const jean = individual(1, 'Jean', 'Dupont', '+33601020304', 'jean@example.com')
  const decision = decideEmailMatch([jean])
  check('même email exact et unique → SYNCED sur ce client', decision.outcome === 'synced' && decision.customer.id === 1)
}

// 2. Même téléphone + même nom → même client
{
  const jean = individual(2, 'Jean', 'Dupont', '+33601020304', 'jean@example.com')
  const decision = decidePhoneMatch([jean], 'Jean Dupont')
  check('même téléphone + nom compatible → SYNCED', decision.outcome === 'synced' && decision.customer.id === 2)
}
// ... et insensible à la casse/aux accents (pas de fuzzy matching agressif pour autant : comparaison exacte normalisée)
{
  const eleonore = individual(3, 'Éléonore', 'Müller', '+33601020304', 'e@example.com')
  const decision = decidePhoneMatch([eleonore], '  ÉLÉONORE   müller ')
  check('nom compatible insensible à la casse/aux accents/aux espaces', decision.outcome === 'synced' && decision.customer.id === 3)
}

// 3. Même téléphone + nom différent → AMBIGUOUS
{
  const jean = individual(4, 'Jean', 'Dupont', '+33601020304', 'jean@example.com')
  const decision = decidePhoneMatch([jean], 'Marc Leroy')
  check('même téléphone + nom différent → AMBIGUOUS (jamais fusionné)', decision.outcome === 'ambiguous' && decision.candidates.length === 1)
}

// 4. Même téléphone + nom absent → AMBIGUOUS
{
  const jean = individual(5, 'Jean', 'Dupont', '+33601020304', 'jean@example.com')
  const decision = decidePhoneMatch([jean], '')
  check('même téléphone + nom absent (chaîne vide) → AMBIGUOUS', decision.outcome === 'ambiguous')
}

// 5. Même téléphone partagé dans un foyer (2 correspondances) → AMBIGUOUS, même si l'une a un nom compatible
{
  const jean = individual(6, 'Jean', 'Dupont', '+33601020304', 'jean@example.com')
  const marie = individual(7, 'Marie', 'Dupont', '+33601020304', 'marie@example.com')
  const decision = decidePhoneMatch([jean, marie], 'Jean Dupont')
  check('téléphone partagé (foyer, 2 résultats) → AMBIGUOUS malgré un nom compatible', decision.outcome === 'ambiguous' && decision.candidates.length === 2)
}

// 6. Plusieurs clients même email → AMBIGUOUS
{
  const a = individual(8, 'Jean', 'Dupont', '+33601020304', 'jean@example.com')
  const b = individual(9, 'Jean', 'Dupond', '+33609080706', 'jean@example.com')
  const decision = decideEmailMatch([a, b])
  check('plusieurs clients pour le même email → AMBIGUOUS', decision.outcome === 'ambiguous' && decision.candidates.length === 2)
}

// 7. pennylaneCustomerId déjà connu (sur la demande elle-même) → toujours prioritaire, jamais écrasé
{
  const already = resolveAlreadyKnownCustomer({ pennylaneCustomerId: '123456', pennylaneCustomerType: 'individual' })
  check('pennylaneCustomerId déjà enregistré → réutilisé tel quel', already?.status === 'SYNCED' && already.customerId === 123456 && already.customerType === 'individual')
  const none = resolveAlreadyKnownCustomer({ pennylaneCustomerId: null, pennylaneCustomerType: null })
  check('aucun pennylaneCustomerId enregistré → aucune décision (poursuit la recherche)', none === null)
}

// 7bis. Identifiant connu localement (autre demande déjà SYNCED) — email suffit seul, téléphone exige un nom compatible
{
  const local: LocalSyncCandidate[] = [
    { nom: 'Dupont', prenom: 'Jean', email: 'jean@example.com', telephone: '0601020304', pennylaneCustomerId: '111', pennylaneCustomerType: 'individual' },
  ]
  const byEmail = decideLocallyKnownMatch({ nom: 'Dupont', prenom: 'Jean', email: 'jean@example.com', telephone: '0699999999' }, local)
  check('correspondance locale par email seul → réutilisé', byEmail?.id === 111)

  const byPhoneCompatible = decideLocallyKnownMatch({ nom: 'Dupont', prenom: 'Jean', email: 'autre@example.com', telephone: '0601020304' }, local)
  check('correspondance locale par téléphone + nom compatible → réutilisé', byPhoneCompatible?.id === 111)

  const byPhoneIncompatible = decideLocallyKnownMatch({ nom: 'Leroy', prenom: 'Marc', email: 'autre@example.com', telephone: '0601020304' }, local)
  check('correspondance locale par téléphone SEUL (nom différent) → aucune décision, jamais fusionné', byPhoneIncompatible === null)
}

// 8. Aucune correspondance (email/téléphone/nom) → doit laisser la place à la création (vérifié structurellement :
// aucune des fonctions de décision ci-dessus ne renvoie jamais 'synced'/'ambiguous' sans correspondance réelle).
{
  const emailNone = decideEmailMatch([])
  const phoneNone = decidePhoneMatch([], 'Jean Dupont')
  const localNone = decideLocallyKnownMatch({ nom: 'Inconnu', prenom: 'Personne', email: 'x@example.com', telephone: '0600000000' }, [])
  check('aucune correspondance email/téléphone/locale → aucune décision (créera un nouveau client)', emailNone.outcome === 'no-match' && phoneNone.outcome === 'no-match' && localNone === null)
}

// 9. Ambiguïté → jamais de création (garantie structurelle : ce test documente l'invariant, la garantie réelle
// vient de l'ordre du code dans syncCustomerForQuoteRequest — la création n'est atteignable qu'après TOUTES les
// vérifications ci-dessus, jamais depuis une branche 'ambiguous'). Couvert en conditions réelles par le test
// Pennylane §4 (cas ambigu, résolution manuelle) de l'audit — voir rapport.
check('isNameCompatible rejette deux chaînes vides (ne doit jamais "matcher" par défaut)', isNameCompatible('', '') === false)
check('isNameCompatible rejette un nom local vide face à un candidat non vide', isNameCompatible('', 'Jean Dupont') === false)

console.log(`\n=== ${passed}/${passed + failed} tests réussis ===`)
if (failed > 0) process.exit(1)
