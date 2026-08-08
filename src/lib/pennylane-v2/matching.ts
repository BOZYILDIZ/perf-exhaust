/**
 * Logique de correspondance client Pennylane — fonctions PURES uniquement
 * (aucun appel réseau, aucune base de données, aucun secret), séparées de
 * sync.ts pour rester testables sans mock lourd (voir sync.test.ts,
 * exécutable directement via `npx tsx`, ce que `sync.ts` ne permet pas —
 * son `import 'server-only'` lève une erreur hors d'un build Next.js).
 *
 * Règle centrale (décision produit du 2026-08-09, suite à une collision
 * réelle observée en audit : deux personnes différentes ayant réutilisé le
 * même faux numéro de téléphone de test se sont vues fusionnées
 * automatiquement) : un numéro de téléphone identique n'est JAMAIS une
 * preuve suffisante à lui seul. Un e-mail exact reste toujours suffisant
 * seul s'il est unique. Un faux AMBIGUOUS est toujours préférable à une
 * mauvaise fusion automatique — jamais de fuzzy matching agressif sur les
 * noms, uniquement une comparaison exacte après normalisation (casse et
 * accents ignorés via normalizedNamesEqual).
 */
import { normalizeEmail, normalizePhoneFR, normalizedNamesEqual } from './normalize'
import { customerDisplayName, type PennylaneCustomer } from './types'

export interface AmbiguousCandidate {
  id: number
  name: string
  email: string | null
  phone: string | null
  type: 'individual' | 'company'
}

export function toCandidateSnapshot(c: PennylaneCustomer): AmbiguousCandidate {
  return {
    id: c.id,
    name: customerDisplayName(c),
    email: c.emails?.[0] ?? null,
    phone: c.phone ?? null,
    // L'ancien système v1 crée exclusivement des "company_customers" — un
    // candidat ambigu peut donc être une entreprise, jamais présumée
    // "individual" (voir bug corrigé : resolvePennylaneCustomerAmbiguity
    // recevait auparavant un type toujours forcé à "individual" côté admin).
    type: 'first_name' in c ? 'individual' : 'company',
  }
}

export function isNameCompatible(localFullName: string, candidateFullName: string): boolean {
  const a = localFullName.trim()
  const b = candidateFullName.trim()
  if (!a || !b) return false
  return normalizedNamesEqual(a, b)
}

export type EmailMatchDecision =
  | { outcome: 'synced'; customer: PennylaneCustomer }
  | { outcome: 'ambiguous'; candidates: PennylaneCustomer[] }
  | { outcome: 'no-match' }

/** Un e-mail exact est une preuve directe, suffisante seule si unique ; plusieurs résultats → toujours AMBIGUOUS. */
export function decideEmailMatch(byEmail: PennylaneCustomer[]): EmailMatchDecision {
  if (byEmail.length === 0) return { outcome: 'no-match' }
  if (byEmail.length === 1) return { outcome: 'synced', customer: byEmail[0] }
  return { outcome: 'ambiguous', candidates: byEmail }
}

export type PhoneMatchDecision =
  | { outcome: 'synced'; customer: PennylaneCustomer }
  | { outcome: 'ambiguous'; candidates: PennylaneCustomer[] }
  | { outcome: 'no-match' }

/**
 * À partir des résultats déjà récupérés d'une recherche par téléphone :
 *  - 0 résultat            → aucune correspondance, la chaîne continue.
 *  - 2+ résultats          → toujours AMBIGUOUS (foyer partageant un numéro,
 *                            standard commun...), quel que soit le nom.
 *  - 1 résultat + nom OK   → correspondance automatique.
 *  - 1 résultat + nom KO   → AMBIGUOUS (jamais fusionné sur le téléphone seul).
 */
export function decidePhoneMatch(byPhone: PennylaneCustomer[], localFullName: string): PhoneMatchDecision {
  if (byPhone.length === 0) return { outcome: 'no-match' }
  if (byPhone.length > 1) return { outcome: 'ambiguous', candidates: byPhone }
  const candidate = byPhone[0]
  if (isNameCompatible(localFullName, customerDisplayName(candidate))) {
    return { outcome: 'synced', customer: candidate }
  }
  return { outcome: 'ambiguous', candidates: [candidate] }
}

export interface LocalSyncCandidate {
  nom: string
  prenom: string
  email: string
  telephone: string
  pennylaneCustomerId: string | null
  pennylaneCustomerType: string | null
}

/** Réduit une liste de candidats à l'ensemble des identifiants Pennylane distincts qu'ils référencent. */
function uniqueCustomerIds(rows: LocalSyncCandidate[]): { id: number; type: string | null }[] {
  const seen = new Map<string, string | null>()
  for (const row of rows) {
    if (row.pennylaneCustomerId) seen.set(row.pennylaneCustomerId, row.pennylaneCustomerType)
  }
  return Array.from(seen.entries())
    .map(([idStr, type]) => ({ id: Number(idStr), type }))
    .filter((x) => Number.isFinite(x.id))
}

/**
 * Recherche un identifiant Pennylane déjà connu localement (autre
 * QuoteRequest déjà SYNCED) — email exact toujours suffisant seul ;
 * téléphone exact SEULEMENT si le nom/prénom local est compatible avec
 * celui du candidat local (même règle que decidePhoneMatch). Si plusieurs
 * candidats locaux pointent vers des identifiants Pennylane DIFFÉRENTS, on
 * ne tranche jamais ici — `null` laisse la recherche Pennylane complète
 * (email → téléphone → nom) trancher normalement.
 */
export function decideLocallyKnownMatch(
  current: { nom: string; prenom: string; email: string; telephone: string },
  candidates: LocalSyncCandidate[]
): { id: number; type: string | null } | null {
  const normalizedEmail = normalizeEmail(current.email)
  const normalizedPhone = normalizePhoneFR(current.telephone)
  const currentFullName = `${current.prenom} ${current.nom}`.trim()

  const emailIds = uniqueCustomerIds(candidates.filter((c) => normalizeEmail(c.email) === normalizedEmail))
  if (emailIds.length === 1) return emailIds[0]

  const phoneIds = uniqueCustomerIds(
    candidates.filter(
      (c) => normalizePhoneFR(c.telephone) === normalizedPhone && isNameCompatible(currentFullName, `${c.prenom} ${c.nom}`.trim())
    )
  )
  if (phoneIds.length === 1) return phoneIds[0]

  return null
}

/** Un identifiant déjà enregistré sur la demande elle-même est toujours prioritaire, jamais écrasé. */
export function resolveAlreadyKnownCustomer(
  quoteRequest: { pennylaneCustomerId: string | null; pennylaneCustomerType: string | null }
): { status: 'SYNCED'; customerId: number; customerType: 'individual' | 'company' } | null {
  if (!quoteRequest.pennylaneCustomerId) return null
  const id = Number(quoteRequest.pennylaneCustomerId)
  if (!Number.isFinite(id)) return null
  return { status: 'SYNCED', customerId: id, customerType: (quoteRequest.pennylaneCustomerType as 'individual' | 'company') ?? 'individual' }
}
