import type { PennylaneBillingAddress } from './types'

export interface PartialPostalAddress {
  address?: string | null
  postalCode?: string | null
  city?: string | null
}

/**
 * Construit l'objet `billing_address` attendu par Pennylane à partir de la
 * véritable adresse du client, collectée depuis /rendez-vous
 * (billingAddress/billingPostalCode/billingCity, depuis le 2026-08-07).
 *
 * ⚠️ Confirmé en conditions réelles (test contre l'API de production,
 * 2026-07-25) : Pennylane REFUSE la création d'un client individuel avec un
 * `billing_address` incomplet — `{ country_alpha2: 'FR' }` seul est rejeté
 * en 400 ("Missing required fields: billing_address.address,
 * billing_address.postal_code, billing_address.city").
 *
 * Aucun repli : si l'adresse du client est absente ou incomplète (demandes
 * créées avant que le formulaire ne la collecte), la fonction renvoie
 * `null` plutôt que d'inventer/emprunter une adresse — voir sync.ts, qui
 * échoue alors explicitement (statut FAILED, message clair) plutôt que
 * d'envoyer une adresse partielle ou fictive que Pennylane rejetterait de
 * toute façon, ou pire, associerait à tort au client.
 */
export function buildBillingAddress(partial: PartialPostalAddress): PennylaneBillingAddress | null {
  if (!partial.address || !partial.postalCode || !partial.city) return null
  return {
    address: partial.address,
    postal_code: partial.postalCode,
    city: partial.city,
    country_alpha2: 'FR',
  }
}
