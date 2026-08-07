import 'server-only'
import { Prisma } from '@prisma/client'
import { getDb } from '@/lib/db'
import { searchCustomersByEmail, searchCustomersByPhone, createIndividualCustomer } from './customers'
import { fetchAllPennylanePages } from './http-client'
import { buildFilter } from './filter'
import { buildBillingAddress } from './billing-address'
import { normalizeEmail, normalizePhoneFR } from './normalize'
import { pennylaneErrorToAdminMessage, PennylanePreconditionError } from './errors'
import { customerDisplayName, type PennylaneCustomer } from './types'

export type CustomerSyncStatus = 'PENDING' | 'SYNCED' | 'FAILED' | 'AMBIGUOUS'

export interface AmbiguousCandidate {
  id: number
  name: string
  email: string | null
  phone: string | null
  type: 'individual' | 'company'
}

function toCandidateSnapshot(c: PennylaneCustomer): AmbiguousCandidate {
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

interface QuoteRequestForSync {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string
  billingAddress: string | null
  billingPostalCode: string | null
  billingCity: string | null
}

/**
 * Vérifie si une autre demande déjà synchronisée (même email ou téléphone
 * normalisé) a déjà un identifiant Pennylane connu — évite de rappeler
 * l'API si la personne a déjà été retrouvée/créée pour une demande
 * précédente. Interprétation du critère « identifiant Pennylane déjà
 * enregistré localement » de la mission en l'absence d'une table Client
 * dédiée (décision produit du 2026-07-25) — voir docs/MAINTENANCE.md.
 */
async function findLocallyKnownCustomerId(current: QuoteRequestForSync): Promise<{ id: number; type: string | null } | null> {
  const db = getDb()
  const normalizedEmail = normalizeEmail(current.email)
  const normalizedPhone = normalizePhoneFR(current.telephone)

  const candidates = await db.quoteRequest.findMany({
    where: {
      id: { not: current.id },
      pennylaneCustomerSyncStatus: 'SYNCED',
      pennylaneCustomerId: { not: null },
    },
    select: { email: true, telephone: true, pennylaneCustomerId: true, pennylaneCustomerType: true },
    orderBy: { pennylaneCustomerSyncedAt: 'desc' },
    take: 200,
  })

  const match = candidates.find(
    (c) => normalizeEmail(c.email) === normalizedEmail || normalizePhoneFR(c.telephone) === normalizedPhone
  )
  if (!match?.pennylaneCustomerId) return null
  const id = Number(match.pennylaneCustomerId)
  return Number.isFinite(id) ? { id, type: match.pennylaneCustomerType } : null
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
 * Synchronise le client Pennylane pour une demande de devis : recherche
 * (id local connu → email → téléphone → nom en dernier recours, jamais
 * automatique), puis création si aucune correspondance. Ne crée jamais un
 * second client en cas d'ambiguïté. Toujours appelée après l'enregistrement
 * local de la demande (jamais avant) — un échec ici n'affecte jamais la
 * demande déjà enregistrée.
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

  const now = new Date()
  try {
    // 1. Identifiant Pennylane déjà connu localement pour cette personne.
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

    // 2. Recherche par e-mail normalisé.
    const byEmail = await searchCustomersByEmail(quoteRequest.email)
    if (byEmail.length === 1) return await finalizeSynced(quoteRequestId, byEmail[0], now)
    if (byEmail.length > 1) return await finalizeAmbiguous(quoteRequestId, byEmail, now)

    // 3. Recherche par téléphone normalisé (parcours borné, voir customers.ts).
    const { matches: byPhone, truncated: phoneScanTruncated } = await searchCustomersByPhone(quoteRequest.telephone)
    if (byPhone.length === 1) return await finalizeSynced(quoteRequestId, byPhone[0], now)
    if (byPhone.length > 1) return await finalizeAmbiguous(quoteRequestId, byPhone, now)
    if (phoneScanTruncated) {
      console.warn(`[pennylane-v2] Recherche par téléphone tronquée pour la demande ${quoteRequestId} — vérification manuelle recommandée.`)
    }

    // 4. Nom — dernier indice, jamais choisi automatiquement même si unique.
    const fullName = `${quoteRequest.prenom} ${quoteRequest.nom}`.trim()
    const byName = await searchCustomersByName(fullName)
    if (byName.length > 0) return await finalizeAmbiguous(quoteRequestId, byName, now)

    // 5. Aucune correspondance — création d'un nouveau client individuel
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
