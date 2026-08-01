import type { PennylaneBillingAddress } from './types'

export interface PartialPostalAddress {
  address?: string | null
  postalCode?: string | null
  city?: string | null
}

/**
 * Adresse de repli — l'adresse de l'ATELIER PERF'EXHAUST, jamais celle du
 * client (le formulaire public ne collecte aucune adresse postale
 * aujourd'hui). Utilisée uniquement pour satisfaire l'exigence technique de
 * Pennylane sur `billing_address` lors de la création automatique — à
 * corriger manuellement dans Pennylane dès que la vraie adresse du client
 * est connue. Configurée par variables d'environnement (jamais en dur) :
 * `PENNYLANE_FALLBACK_ADDRESS` / `_POSTAL_CODE` / `_CITY`.
 */
function getFallbackAddress(): PartialPostalAddress | null {
  const address = process.env.PENNYLANE_FALLBACK_ADDRESS
  const postalCode = process.env.PENNYLANE_FALLBACK_POSTAL_CODE
  const city = process.env.PENNYLANE_FALLBACK_CITY
  if (address && postalCode && city) return { address, postalCode, city }
  return null
}

/**
 * Construit l'objet `billing_address` attendu par Pennylane.
 *
 * ⚠️ Confirmé en conditions réelles (test contre l'API de production,
 * 2026-07-25) : Pennylane REFUSE la création d'un client individuel avec un
 * `billing_address` incomplet — `{ country_alpha2: 'FR' }` seul est rejeté
 * en 400 ("Missing required fields: billing_address.address,
 * billing_address.postal_code, billing_address.city"). L'hypothèse inverse
 * de l'ancienne intégration ("seul country_alpha2 suffit par défaut") était
 * fausse — jamais vérifiée contre un vrai compte à l'époque.
 *
 * Le formulaire public PERF'EXHAUST ne collecte aujourd'hui aucune adresse
 * postale du client — par accord explicite (2026-07-25), l'adresse de
 * l'ATELIER lui-même sert de repli via les variables d'environnement
 * `PENNYLANE_FALLBACK_ADDRESS`/`_POSTAL_CODE`/`_CITY`, afin de ne jamais
 * bloquer la création automatique. Cette adresse de repli n'est PAS celle
 * du client — à corriger manuellement dans Pennylane dès que l'information
 * réelle est connue (voir docs/MAINTENANCE.md § "Limites connues de l'API").
 * Si ces variables ne sont pas configurées, la création échoue explicitement
 * (statut FAILED, message clair) plutôt que d'envoyer une adresse partielle
 * que Pennylane rejetterait de toute façon.
 */
export function buildBillingAddress(partial?: PartialPostalAddress): PennylaneBillingAddress | null {
  const source = partial?.address && partial.postalCode && partial.city ? partial : getFallbackAddress()
  if (!source?.address || !source.postalCode || !source.city) return null
  return {
    address: source.address,
    postal_code: source.postalCode,
    city: source.city,
    country_alpha2: 'FR',
  }
}
