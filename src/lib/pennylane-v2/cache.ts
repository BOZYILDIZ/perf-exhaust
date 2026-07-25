import { PENNYLANE_V2_FINANCIALS_TTL_MS } from './config'

/** Vrai si le cache des devis/factures doit être rafraîchi (jamais synchronisé, ou plus vieux que le TTL). */
export function isFinancialsCacheStale(syncedAt: Date | null): boolean {
  if (!syncedAt) return true
  return Date.now() - syncedAt.getTime() > PENNYLANE_V2_FINANCIALS_TTL_MS
}
