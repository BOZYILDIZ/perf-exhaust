import 'server-only'
import { Prisma } from '@prisma/client'
import { getDb } from '@/lib/db'
import { searchCustomersByEmail, searchCustomersByPhone, createIndividualCustomer } from './customers'
import { fetchAllPennylanePages } from './http-client'
import { buildFilter } from './filter'
import { buildBillingAddress } from './billing-address'
import { pennylaneErrorToAdminMessage, PennylanePreconditionError } from './errors'
import type { PennylaneCustomer } from './types'
import {
  type AmbiguousCandidate,
  toCandidateSnapshot,
  decideEmailMatch,
  decidePhoneMatch,
  decideLocallyKnownMatch,
  resolveAlreadyKnownCustomer,
  type LocalSyncCandidate,
} from './matching'

export type { AmbiguousCandidate } from './matching'
export {
  isNameCompatible,
  decideEmailMatch,
  decidePhoneMatch,
  decideLocallyKnownMatch,
  resolveAlreadyKnownCustomer,
  type EmailMatchDecision,
  type PhoneMatchDecision,
  type LocalSyncCandidate,
} from './matching'

export type CustomerSyncStatus = 'PENDING' | 'SYNCED' | 'FAILED' | 'AMBIGUOUS'

interface QuoteRequestForSync {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string
  billingAddress: string | null
  billingPostalCode: string | null
  billingCity: string | null
  pennylaneCustomerId: string | null
  pennylaneCustomerType: string | null
}

/**
 * Charge les demandes déjà synchronisées pour appliquer decideLocallyKnownMatch
 * (voir matching.ts) — évite de rappeler l'API Pennylane si la personne a
 * déjà été retrouvée pour une demande précédente (décision produit du
 * 2026-07-25, affinée le 2026-08-09 pour exiger un nom compatible sur un
 * match téléphone).
 */
async function findLocallyKnownCustomerId(current: QuoteRequestForSync): Promise<{ id: number; type: string | null } | null> {
  const db = getDb()
  const candidates: LocalSyncCandidate[] = await db.quoteRequest.findMany({
    where: {
      id: { not: current.id },
      pennylaneCustomerSyncStatus: 'SYNCED',
      pennylaneCustomerId: { not: null },
    },
    select: { nom: true, prenom: true, email: true, telephone: true, pennylaneCustomerId: true, pennylaneCustomerType: true },
    orderBy: { pennylaneCustomerSyncedAt: 'desc' },
    take: 200,
  })
  return decideLocallyKnownMatch(current, candidates)
}

/**
 * Dernier indice avant création : une correspondance par nom, même unique,
 * ne doit JAMAIS être choisie automatiquement (règle explicite de la
 * mission) — elle déclenche systématiquement un statut AMBIGUOUS pour
 * validation humaine, plutôt que d'être silencieusement ignorée ou utilisée
 * pour sélectionner un client.
 */
async function searchCustomersByName(fullName: string): Promise<PennylaneCustomer[]> {
  const filter = buildFilter([{ field: 'name', operator: 'eq', value: fullName }])
  const { items } = await fetchAllPennylanePages<PennylaneCustomer>('/customers', { filter, limit: 20 }, 1)
  return items
}

export type CustomerSyncOutcome =
  | { status: 'SYNCED'; customerId: number; customerType: 'individual' | 'company' }
  | { status: 'AMBIGUOUS'; candidates: AmbiguousCandidate[] }
  | { status: 'FAILED'; error: string }

/**
 * Synchronise le client Pennylane pour une demande de devis. Ordre strict :
 *
 *  A. pennylaneCustomerId déjà enregistré sur CETTE demande → toujours
 *     prioritaire, retourné tel quel, JAMAIS écrasé (pas de nouvelle
 *     recherche, pas de risque de remplacer un lien déjà établi).
 *  B. Identifiant connu localement (autre demande déjà SYNCED, voir
 *     matching.ts § decideLocallyKnownMatch) → email exact toujours
 *     suffisant seul, téléphone exact seulement avec un nom compatible.
 *  C. Recherche Pennylane par e-mail exact → SYNCED si unique, AMBIGUOUS si
 *     plusieurs.
 *  D. Recherche Pennylane par téléphone exact (voir matching.ts §
 *     decidePhoneMatch) → jamais suffisant seul, exige un nom compatible ;
 *     plusieurs résultats → toujours AMBIGUOUS quel que soit le nom.
 *  E. Recherche par nom — dernier indice, jamais choisi automatiquement.
 *  F. Aucune correspondance → création d'un nouveau client.
 *
 * Ne crée jamais un second client en cas d'ambiguïté. Toujours appelée
 * après l'enregistrement local de la demande (jamais avant) — un échec ici
 * n'affecte jamais la demande déjà enregistrée.
 */
export async function syncCustomerForQuoteRequest(quoteRequestId: string): Promise<CustomerSyncOutcome> {
  const db = getDb()
  let quoteRequest: QuoteRequestForSync | null
  try {
    quoteRequest = await db.quoteRequest.findUnique({
      where: { id: quoteRequestId },
      select: {
        id: true, nom: true, prenom: true, email: true, telephone: true,
        billingAddress: true, billingPostalCode: true, billingCity: true,
        pennylaneCustomerId: true, pennylaneCustomerType: true,
      },
    })
  } catch (err) {
    // Ne doit jamais remonter jusqu'à l'appelant (POST /api/rendez-vous) —
    // la demande est déjà enregistrée à ce stade, un souci de lecture ici
    // ne doit jamais transformer une demande réussie en erreur serveur.
    console.error(`[pennylane-v2] Lecture de la demande ${quoteRequestId} impossible avant synchronisation :`, err)
    return { status: 'FAILED', error: 'Base de données temporairement indisponible.' }
  }
  if (!quoteRequest) {
    return { status: 'FAILED', error: 'Demande introuvable en base.' }
  }

  // A. Déjà enregistré localement — jamais écrasé, aucune recherche relancée.
  const alreadyKnown = resolveAlreadyKnownCustomer(quoteRequest)
  if (alreadyKnown) return alreadyKnown

  const now = new Date()
  const localFullName = `${quoteRequest.prenom} ${quoteRequest.nom}`.trim()
  try {
    // B. Identifiant Pennylane déjà connu localement pour cette personne.
    const known = await findLocallyKnownCustomerId(quoteRequest)
    if (known) {
      await db.quoteRequest.update({
        where: { id: quoteRequestId },
        data: {
          pennylaneCustomerId: String(known.id),
          pennylaneCustomerType: known.type,
          pennylaneCustomerSyncStatus: 'SYNCED',
          pennylaneCustomerSyncError: null,
          pennylaneCustomerSyncedAt: now,
          pennylaneCustomerLastSyncAt: now,
          pennylaneAmbiguousCandidates: Prisma.DbNull,
        },
      })
      return { status: 'SYNCED', customerId: known.id, customerType: (known.type as 'individual' | 'company') ?? 'individual' }
    }

    // C. Recherche par e-mail normalisé.
    const byEmail = await searchCustomersByEmail(quoteRequest.email)
    const emailDecision = decideEmailMatch(byEmail)
    if (emailDecision.outcome === 'synced') return await finalizeSynced(quoteRequestId, emailDecision.customer, now)
    if (emailDecision.outcome === 'ambiguous') return await finalizeAmbiguous(quoteRequestId, emailDecision.candidates, now)

    // D. Recherche par téléphone normalisé (parcours borné, voir customers.ts)
    // — jamais suffisant seul, voir matching.ts § decidePhoneMatch.
    const { matches: byPhone, truncated: phoneScanTruncated } = await searchCustomersByPhone(quoteRequest.telephone)
    const phoneDecision = decidePhoneMatch(byPhone, localFullName)
    if (phoneDecision.outcome === 'synced') return await finalizeSynced(quoteRequestId, phoneDecision.customer, now)
    if (phoneDecision.outcome === 'ambiguous') return await finalizeAmbiguous(quoteRequestId, phoneDecision.candidates, now)
    if (phoneScanTruncated) {
      console.warn(`[pennylane-v2] Recherche par téléphone tronquée pour la demande ${quoteRequestId} — vérification manuelle recommandée.`)
    }

    // E. Nom — dernier indice, jamais choisi automatiquement même si unique.
    const byName = await searchCustomersByName(localFullName)
    if (byName.length > 0) return await finalizeAmbiguous(quoteRequestId, byName, now)

    // F. Aucune correspondance — création d'un nouveau client individuel
    // (le formulaire ne collecte aujourd'hui aucune information société).
    // Pennylane exige une adresse postale complète (confirmé en conditions
    // réelles le 2026-07-25 — voir billing-address.ts) : le formulaire
    // public la collecte désormais (billingAddress/_PostalCode/_City,
    // depuis le 2026-08-07) — c'est la véritable adresse du client, jamais
    // une adresse de repli. Les demandes créées avant cette date n'ont
    // aucune adresse enregistrée : on échoue explicitement ICI, avec un
    // message précis, plutôt que de laisser Pennylane renvoyer un 400
    // générique après un appel réseau inutile.
    const billingAddress = buildBillingAddress({
      address: quoteRequest.billingAddress,
      postalCode: quoteRequest.billingPostalCode,
      city: quoteRequest.billingCity,
    })
    if (!billingAddress) {
      throw new PennylanePreconditionError(
        "Impossible de créer le client Pennylane : adresse postale manquante (rue, code postal, ville). " +
        "Cette demande a été créée avant que le formulaire ne collecte l'adresse — renseignez-la manuellement " +
        "dans Pennylane, puis relancez la synchronisation depuis ce panel."
      )
    }
    const created = await createIndividualCustomer({
      first_name: quoteRequest.prenom,
      last_name: quoteRequest.nom,
      phone: quoteRequest.telephone,
      billing_address: billingAddress,
      emails: [quoteRequest.email],
    })
    return await finalizeSynced(quoteRequestId, created, now, 'individual')
  } catch (err) {
    const message = pennylaneErrorToAdminMessage(err)
    await db.quoteRequest.update({
      where: { id: quoteRequestId },
      data: {
        pennylaneCustomerSyncStatus: 'FAILED',
        pennylaneCustomerSyncError: message,
        pennylaneCustomerLastSyncAt: now,
      },
    })
    console.error(`[pennylane-v2] Échec de synchronisation client pour la demande ${quoteRequestId} :`, err)
    return { status: 'FAILED', error: message }
  }

  async function finalizeSynced(
    id: string,
    customer: PennylaneCustomer,
    at: Date,
    typeOverride?: 'individual' | 'company'
  ): Promise<CustomerSyncOutcome> {
    const type = typeOverride ?? ('first_name' in customer ? 'individual' : 'company')
    await db.quoteRequest.update({
      where: { id },
      data: {
        pennylaneCustomerId: String(customer.id),
        pennylaneCustomerType: type,
        pennylaneCustomerSyncStatus: 'SYNCED',
        pennylaneCustomerSyncError: null,
        pennylaneCustomerSyncedAt: at,
        pennylaneCustomerLastSyncAt: at,
        pennylaneAmbiguousCandidates: Prisma.DbNull,
      },
    })
    return { status: 'SYNCED', customerId: customer.id, customerType: type }
  }

  async function finalizeAmbiguous(id: string, matches: PennylaneCustomer[], at: Date): Promise<CustomerSyncOutcome> {
    const candidates = matches.map(toCandidateSnapshot)
    await db.quoteRequest.update({
      where: { id },
      data: {
        pennylaneCustomerSyncStatus: 'AMBIGUOUS',
        pennylaneCustomerSyncError: null,
        pennylaneCustomerLastSyncAt: at,
        pennylaneAmbiguousCandidates: candidates as unknown as Prisma.InputJsonValue,
      },
    })
    return { status: 'AMBIGUOUS', candidates }
  }
}

/**
 * Résolution manuelle d'une ambiguïté par l'admin — associe explicitement
 * l'identifiant Pennylane choisi, sans jamais passer par une sélection
 * automatique.
 */
export async function resolvePennylaneCustomerAmbiguity(quoteRequestId: string, chosenCustomerId: number, customerType: 'individual' | 'company'): Promise<void> {
  const db = getDb()
  await db.quoteRequest.update({
    where: { id: quoteRequestId },
    data: {
      pennylaneCustomerId: String(chosenCustomerId),
      pennylaneCustomerType: customerType,
      pennylaneCustomerSyncStatus: 'SYNCED',
      pennylaneCustomerSyncError: null,
      pennylaneCustomerSyncedAt: new Date(),
      pennylaneCustomerLastSyncAt: new Date(),
      pennylaneAmbiguousCandidates: Prisma.DbNull,
    },
  })
}
