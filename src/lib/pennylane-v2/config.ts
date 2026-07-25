/**
 * Configuration de l'intégration Pennylane API v2 — nouvelle intégration
 * (remplace à terme le flux manuel/extension). Séparée de src/lib/pennylane/
 * (ancienne intégration, conservée intacte tant que la Phase A n'est pas
 * validée — voir docs/MAINTENANCE.md § "Intégration Pennylane API v2").
 *
 * Base URL et authentification vérifiées dans la documentation officielle
 * (pennylane.readme.io, juillet 2026) — jamais déduites de l'ancien code de
 * l'extension Chrome, qui n'utilisait aucune API.
 */
import 'server-only'

export function getPennylaneV2BaseUrl(): string {
  return process.env.PENNYLANE_BASE_URL_V2 || 'https://app.pennylane.com/api/external/v2'
}

export function isPennylaneV2Configured(): boolean {
  return Boolean(process.env.PENNYLANE_API_TOKEN)
}

/** Ne renvoie jamais le token lui-même — uniquement pour construire l'en-tête Authorization côté serveur. */
export function getPennylaneV2Token(): string {
  const token = process.env.PENNYLANE_API_TOKEN
  if (!token) {
    throw new Error('PENNYLANE_API_TOKEN absente — voir docs/MAINTENANCE.md § "Intégration Pennylane API v2".')
  }
  return token
}

/**
 * Lu dynamiquement (pas une constante figée au chargement du module) pour
 * permettre aux tests de simuler un timeout réseau avec un délai court sans
 * redémarrer le processus — voir docs/MAINTENANCE.md § "Tests".
 */
export function getPennylaneV2TimeoutMs(): number {
  const override = process.env.PENNYLANE_V2_TIMEOUT_MS_OVERRIDE
  const parsed = override ? Number(override) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 15_000
}

/** Délai avant lequel les devis/factures en cache sont considérés à jour (voir cache.ts). */
export const PENNYLANE_V2_FINANCIALS_TTL_MS = 15 * 60 * 1000 // 15 minutes

/** Nombre maximal de pages parcourues lors d'un scan client (recherche par téléphone) — voir customers.ts. */
export const PENNYLANE_V2_PHONE_SEARCH_MAX_PAGES = 10
export const PENNYLANE_V2_PHONE_SEARCH_PAGE_SIZE = 100
