import 'server-only'
import {
  PennylaneError,
  type PennylaneCustomer,
  type PennylaneCreateQuoteInput,
  type PennylaneQuote,
  type PennylaneErrorBody,
} from './types'
import { buildBillingAddress, type PartialBillingAddress } from './billing-address'
import { getPennylaneMode, isPennylaneApiMode, isPennylaneManualMode, type PennylaneMode } from './mode'
import { rearDiffuserLabel } from '@/lib/quote-request-options'

export type { PartialBillingAddress, PennylaneMode }
export { getPennylaneMode, isPennylaneApiMode, isPennylaneManualMode }

/**
 * Client Pennylane API v2 (https://pennylane.readme.io/reference).
 *
 * Toute la logique d'appel réseau est centralisée ici — aucun composant ni
 * route ne doit fetch() Pennylane directement. Voir docs/MAINTENANCE.md
 * § "Intégration Pennylane" pour le détail des endpoints et des limites.
 *
 * Pennylane est la source unique pour les devis et les factures. Selon
 * PENNYLANE_MODE (voir ./mode.ts) :
 *  - mode "api"    : dès qu'une demande est enregistrée via /rendez-vous,
 *                    createDraftQuoteFromRequest() crée automatiquement un
 *                    brouillon (nécessite un abonnement Pennylane avec API).
 *  - mode "manual" : plan gratuit sans API — l'admin copie les informations
 *                    depuis /admin/devis/[id] (bouton "Copier pour
 *                    Pennylane") et crée le devis à la main, puis renseigne
 *                    le statut/numéro/lien manuellement.
 * Dans les deux cas, le panel PERF'EXHAUST ne construit jamais de devis
 * local — il ne fait que refléter ce résultat (ID, numéro, lien).
 */

const BASE_URL = (process.env.PENNYLANE_BASE_URL || 'https://app.pennylane.com/api/external/v2').replace(/\/+$/, '')
const TIMEOUT_MS = 15_000

export function isPennylaneConfigured(): boolean {
  return Boolean(process.env.PENNYLANE_API_KEY)
}

/** Mappe un taux de TVA en % (20, 10, 0) vers l'énumération Pennylane (France). */
export function mapVatRateToPennylane(ratePercent: number): string {
  if (ratePercent === 20) return 'FR_200'
  if (ratePercent === 10) return 'FR_100'
  if (ratePercent === 5.5) return 'FR_55'
  if (ratePercent === 2.1) return 'FR_21'
  if (ratePercent === 0) return 'exempt'
  // Taux non standard : on retombe sur le taux normal plutôt que d'envoyer une valeur invalide à l'API.
  return 'FR_200'
}

async function pennylaneRequest<T>(
  path: string,
  init: RequestInit & { retryOn429?: boolean } = {}
): Promise<T> {
  if (!process.env.PENNYLANE_API_KEY) {
    // Ne devrait jamais être atteint : les appelants vérifient isPennylaneConfigured() en amont.
    // Garde-fou pour ne jamais partir sur une requête sans clé (et donc sans risque de la logger).
    throw new PennylaneError(0, null, 'Pennylane non configuré (PENNYLANE_API_KEY absente).')
  }

  const { retryOn429 = true, ...requestInit } = init
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...requestInit,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.PENNYLANE_API_KEY}`,
        'Content-Type': 'application/json',
        // Recommandé par Pennylane en prévision/suite de la migration API 2026
        // (pennylane.readme.io/docs/2026-api-changes-guide) — sans effet si déjà appliqué par défaut.
        'X-Use-2026-API-Changes': 'true',
        ...requestInit.headers,
      },
    })
  } catch (err) {
    clearTimeout(timer)
    const isAbort = err instanceof Error && err.name === 'AbortError'
    console.error('[pennylane] Erreur réseau', { path, isAbort })
    throw new PennylaneError(0, null, isAbort ? 'Délai dépassé en contactant Pennylane.' : 'Erreur réseau en contactant Pennylane.')
  } finally {
    clearTimeout(timer)
  }

  if (response.status === 429 && retryOn429) {
    // Seul cas de retry automatique : une requête de LECTURE limitée en débit — sans risque de doublon.
    const retryAfterSec = Number(response.headers.get('retry-after')) || 2
    console.warn(`[pennylane] 429 rate-limit sur ${path}, retry après ${retryAfterSec}s`)
    await new Promise((r) => setTimeout(r, Math.min(retryAfterSec, 10) * 1000))
    return pennylaneRequest<T>(path, { ...init, retryOn429: false })
  }

  if (!response.ok) {
    let body: PennylaneErrorBody | null = null
    try {
      body = await response.json()
    } catch {
      // Corps non-JSON (ex: 502 HTML) — on garde body=null, le message générique prendra le relais.
    }
    console.error('[pennylane] Requête échouée', { path, status: response.status, code: body?.error })
    throw new PennylaneError(response.status, body, `Requête Pennylane échouée (${response.status})`)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

/** Recherche un client existant par email — évite de créer des doublons dans Pennylane. */
export async function findCustomerByEmail(email: string): Promise<PennylaneCustomer | null> {
  const query = new URLSearchParams({ 'filter[emails][in][]': email, limit: '1' })
  const result = await pennylaneRequest<{ items?: PennylaneCustomer[] }>(`/customers?${query.toString()}`, {
    method: 'GET',
  })
  return result.items?.[0] ?? null
}

/**
 * Crée un client "entreprise" Pennylane. Voir buildBillingAddress() pour le
 * détail de la contrainte Pennylane sur `billing_address` et la stratégie de
 * repli (pays seul, jamais de rue/CP/ville inventés).
 */
export async function createCompanyCustomer(input: { name: string; email: string; phone?: string } & PartialBillingAddress): Promise<PennylaneCustomer> {
  return pennylaneRequest<PennylaneCustomer>('/company_customers', {
    method: 'POST',
    retryOn429: false, // écriture non-idempotente : jamais de retry automatique
    body: JSON.stringify({
      name: input.name,
      emails: [input.email],
      phone: input.phone || undefined,
      billing_address: buildBillingAddress(input),
    }),
  })
}

/** Retrouve le client par email, ou le crée s'il n'existe pas encore. */
export async function createOrFindCustomer(input: { name: string; email: string; phone?: string } & PartialBillingAddress): Promise<{ customer: PennylaneCustomer; created: boolean }> {
  const existing = await findCustomerByEmail(input.email)
  if (existing) return { customer: existing, created: false }
  const customer = await createCompanyCustomer(input)
  return { customer, created: true }
}

/**
 * Crée un devis Pennylane. Le devis est créé dans l'état initial par défaut
 * de Pennylane (brouillon, non envoyé) : cette intégration n'appelle jamais
 * l'endpoint d'envoi/mise à jour de statut — l'atelier reste maître de la
 * relecture, du chiffrage et de l'envoi final, depuis Pennylane lui-même.
 */
export async function createQuote(input: PennylaneCreateQuoteInput): Promise<PennylaneQuote> {
  return pennylaneRequest<PennylaneQuote>('/quotes', {
    method: 'POST',
    retryOn429: false, // écriture non-idempotente : jamais de retry automatique
    body: JSON.stringify(input),
  })
}

/** Relit l'état actuel d'un devis (statut, numéro...) déjà créé. */
export async function getQuote(id: string): Promise<PennylaneQuote> {
  return pennylaneRequest<PennylaneQuote>(`/quotes/${encodeURIComponent(id)}`, { method: 'GET' })
}

export interface DraftQuoteSourceRequest extends PartialBillingAddress {
  nom: string
  prenom: string
  email: string
  telephone: string
  marque: string
  modele: string
  annee: string
  motorisation?: string | null
  typeProjet: string
  sonorite: string
  rearDiffuser: string
  message: string
}

export interface DraftQuoteResult {
  customerId: number
  quoteId: number
  quoteNumber: string | null
  quoteUrl: string | null
  rawStatus: string | null
}

/** Bloc de description inclus dans le devis — jamais de prix inventé. */
function buildDraftQuoteDescription(r: DraftQuoteSourceRequest): string {
  return [
    `Client : ${r.prenom} ${r.nom}`,
    `Téléphone : ${r.telephone}`,
    `Email : ${r.email}`,
    `Véhicule : ${r.marque} ${r.modele} (${r.annee})`,
    r.motorisation ? `Motorisation : ${r.motorisation}` : null,
    `Type de projet : ${r.typeProjet}`,
    `Sonorité souhaitée : ${r.sonorite}`,
    `Diffuseur arrière : ${rearDiffuserLabel(r.rearDiffuser)}`,
    '',
    `Message du client : ${r.message}`,
    '',
    'Prix à compléter dans Pennylane après analyse.',
  ]
    .filter((line) => line !== null)
    .join('\n')
}

/**
 * Point d'entrée unique du workflow automatique : crée/retrouve le client
 * Pennylane puis un brouillon de devis pré-rempli à partir d'une demande —
 * jamais de prix définitif inventé (ligne générique à 0 €, à chiffrer dans
 * Pennylane). Appelée depuis /api/rendez-vous (best-effort, à la réception
 * de chaque demande) et depuis la route de retry admin.
 */
export async function createDraftQuoteFromRequest(request: DraftQuoteSourceRequest): Promise<DraftQuoteResult> {
  const { customer } = await createOrFindCustomer({
    name: `${request.prenom} ${request.nom}`,
    email: request.email,
    phone: request.telephone,
    // Adresse réelle utilisée si un jour disponible sur la demande ; sinon
    // repli pays-seul géré par buildBillingAddress() — voir sa docstring.
    address: request.address,
    postalCode: request.postalCode,
    city: request.city,
    countryAlpha2: request.countryAlpha2,
  })

  const today = new Date()
  const deadline = new Date(today)
  deadline.setDate(deadline.getDate() + 30)
  const isoDate = (d: Date) => d.toISOString().slice(0, 10)

  const quote = await createQuote({
    date: isoDate(today),
    deadline: isoDate(deadline),
    customer_id: customer.id,
    pdf_invoice_subject: `Demande de devis — ${request.marque} ${request.modele}`,
    pdf_description: buildDraftQuoteDescription(request),
    invoice_lines: [
      {
        label: 'Échappement sur mesure — prix à définir après analyse',
        quantity: 1,
        raw_currency_unit_price: '0.00',
        vat_rate: mapVatRateToPennylane(20),
        unit: 'unité',
      },
    ],
  })

  return {
    customerId: customer.id,
    quoteId: quote.id,
    quoteNumber: typeof quote.number === 'string' ? quote.number : null,
    quoteUrl: typeof quote.public_url === 'string' ? quote.public_url : (typeof quote.url === 'string' ? quote.url : null),
    rawStatus: typeof quote.status === 'string' ? quote.status : null,
  }
}
