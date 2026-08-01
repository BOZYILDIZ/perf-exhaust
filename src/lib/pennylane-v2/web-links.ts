/**
 * Liens "Ouvrir dans Pennylane" — la documentation officielle API v2 ne
 * décrit AUCUN format d'URL permettant d'ouvrir directement un client, un
 * devis ou une facture dans l'interface web authentifiée de Pennylane
 * (vérifié : ni dans la référence des endpoints, ni dans les guides). Seul
 * un `public_file_url` (lien PDF public, non authentifié) est confirmé pour
 * les devis/factures.
 *
 * Stratégie honnête plutôt que de deviner un format d'URL non confirmé :
 * 1. Utiliser un champ URL réellement renvoyé par l'API si présent
 *    (`url`, `public_url`, `public_file_url` selon la ressource).
 * 2. À défaut, ouvrir la page d'accueil authentifiée de Pennylane
 *    (comportement déjà utilisé par l'ancien flux manuel via
 *    `SiteSettings.pennylaneManualUrl`) plutôt que de fabriquer un lien
 *    profond non vérifié qui pourrait mener à une page inexistante.
 *
 * Voir docs/MAINTENANCE.md § "Limites connues de l'API".
 */

const PENNYLANE_APP_HOME = 'https://app.pennylane.com/'

export function resolveWebUrl(candidate: { url?: string; public_url?: string; public_file_url?: string } | null | undefined): string {
  return candidate?.url || candidate?.public_url || candidate?.public_file_url || PENNYLANE_APP_HOME
}
