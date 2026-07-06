import 'server-only'
import {
  PennylaneError,
  type PennylaneCustomer,
  type PennylaneCreateQuoteInput,
  type PennylaneQuote,
  type PennylaneErrorBody,
} from './types'

/**
 * Client Pennylane API v2 (https://pennylane.readme.io/reference).
 *
 * Toute la logique d'appel réseau est centralisée ici — aucun composant ni
 * route ne doit fetch() Pennylane directement. Voir docs/MAINTENANCE.md
 * § "Intégration Pennylane" pour le détail des endpoints, limites et du
 * workflow (création de client → devis, toujours déclenchée manuellement
 * depuis /admin/devis/[id], jamais automatique).
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
 * Crée un client "entreprise" Pennylane. `billing_address` est exigé par
 * l'API mais notre formulaire de devis ne collecte pas d'adresse postale —
 * on envoie un objet vide : Pennylane l'accepte ou renvoie une erreur 422
 * explicite (champ manquant précisé dans `details`), remontée telle quelle
 * à l'admin. Limite documentée dans docs/MAINTENANCE.md.
 */
export async function createCompanyCustomer(input: { name: string; email: string; phone?: string }): Promise<PennylaneCustomer> {
  return pennylaneRequest<PennylaneCustomer>('/company_customers', {
    method: 'POST',
    retryOn429: false, // écriture non-idempotente : jamais de retry automatique
    body: JSON.stringify({
      name: input.name,
      emails: [input.email],
      phone: input.phone || undefined,
      billing_address: {},
    }),
  })
}

/** Retrouve le client par email, ou le crée s'il n'existe pas encore. */
export async function createOrFindCustomer(input: { name: string; email: string; phone?: string }): Promise<{ customer: PennylaneCustomer; created: boolean }> {
  const existing = await findCustomerByEmail(input.email)
  if (existing) return { customer: existing, created: false }
  const customer = await createCompanyCustomer(input)
  return { customer, created: true }
}

/**
 * Crée un devis Pennylane. Toujours déclenché explicitement par l'admin —
 * jamais en réaction directe à la soumission du formulaire public.
 * Le devis est créé dans l'état initial par défaut de Pennylane (brouillon,
 * non envoyé) : cette intégration n'appelle jamais l'endpoint d'envoi/mise
 * à jour de statut, l'atelier reste maître de la validation finale.
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
