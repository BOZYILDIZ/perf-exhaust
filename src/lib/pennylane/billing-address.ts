export interface PartialBillingAddress {
  address?: string | null
  postalCode?: string | null
  city?: string | null
  /** Code pays ISO 3166-1 alpha-2 (ex. "FR"). */
  countryAlpha2?: string | null
}

/**
 * Construit l'objet `billing_address` envoyé à Pennylane.
 *
 * Le schéma officiel de POST /company_customers (spec OpenAPI v2 de
 * Pennylane) déclare `billing_address` comme un objet à `additionalProperties:
 * false` dont les 4 champs `address`, `postal_code`, `city` et
 * `country_alpha2` sont TOUS requis dès que l'objet est fourni — il n'existe
 * pas de champ générique "country" ou "country_code" accepté par l'API.
 *
 * Notre formulaire de demande de devis ne collecte aucune adresse postale
 * (rue, code postal, ville) : les inventer produirait une donnée fausse dans
 * la comptabilité de l'atelier, ce qui est plus dangereux qu'un devis en
 * attente. On n'envoie donc QUE le pays (`country_alpha2`), seule
 * information dont on est raisonnablement sûr (l'atelier et sa clientèle
 * sont basés en France) — jamais de rue/CP/ville fabriqués. Si une adresse
 * réelle est un jour disponible (ex. champ ajouté au formulaire), elle est
 * utilisée intégralement à la place de ce repli minimal.
 *
 * Ce choix n'élimine pas forcément le risque de 422 : le schéma documenté
 * exige les 4 champs ensemble, donc Pennylane peut tout de même refuser une
 * adresse partielle. Dans ce cas, l'erreur exacte de Pennylane (champ
 * manquant précisé dans `details`) est remontée telle quelle à l'admin, qui
 * complète alors l'adresse directement dans Pennylane — voir
 * docs/MAINTENANCE.md § "Intégration Pennylane".
 *
 * Fonction pure, volontairement séparée de client.ts (qui importe
 * 'server-only') pour rester testable par un simple script Node/tsx.
 */
export function buildBillingAddress(partial?: PartialBillingAddress): Record<string, string> {
  const hasFullAddress = Boolean(partial?.address && partial?.postalCode && partial?.city)
  if (hasFullAddress) {
    return {
      address: partial!.address!,
      postal_code: partial!.postalCode!,
      city: partial!.city!,
      country_alpha2: partial?.countryAlpha2 || 'FR',
    }
  }
  return { country_alpha2: partial?.countryAlpha2 || 'FR' }
}
