/**
 * Construit le paramètre `filter` Pennylane API v2 — un tableau JSON de
 * conditions `{ field, operator, value }`, encodé en chaîne puis passé en
 * query string (confirmé par l'exemple officiel de la documentation de
 * pagination : `filter=[{"field":"status","operator":"eq","value":"draft"}]`).
 *
 * L'ancienne intégration (src/lib/pennylane/client.ts) utilisait une syntaxe
 * `filter[emails][in][]=...` de type paramètres imbriqués Rails — jamais
 * confirmée par la documentation officielle et non reprise ici.
 */
export interface PennylaneFilterCondition {
  field: string
  operator: 'eq' | 'not_eq' | 'in' | 'not_in' | 'lt' | 'lteq' | 'gt' | 'gteq' | 'start_with'
  value: unknown
}

export function buildFilter(conditions: PennylaneFilterCondition[]): string {
  return JSON.stringify(conditions)
}
