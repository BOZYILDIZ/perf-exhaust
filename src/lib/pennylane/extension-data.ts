import { rearDiffuserLabel } from '@/lib/quote-request-options'

/**
 * Données structurées exposées sur /admin/devis/[id] pour l'extension
 * Chrome "PERF'EXHAUST — Assistant Pennylane" (chrome-extension/
 * perfexhaust-pennylane-assistant/). Fonction pure, sans accès DB ni secret
 * — reste importable partout, y compris par des scripts de test autonomes.
 *
 * Aucune donnée sensible au-delà de ce que l'admin voit déjà à l'écran sur
 * cette page (protégée par la session admin) : pas de notes internes, pas
 * d'identifiants Pennylane, pas de statistiques de synchronisation.
 */
export interface PennylaneExtensionQuoteData {
  quoteRequestId: string
  clientName: string
  email: string
  phone: string
  vehicle: string
  brand: string
  model: string
  year: string
  engine: string
  projectType: string
  soundPreference: string
  rearDiffuser: string
  message: string
  suggestedLine: string
  vatRate: number
}

export interface QuoteRequestLike {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string
  marque: string
  modele: string
  annee: string
  motorisation: string | null
  typeProjet: string
  sonorite: string
  rearDiffuser: string
  message: string
}

export function buildExtensionQuoteData(q: QuoteRequestLike): PennylaneExtensionQuoteData {
  return {
    quoteRequestId: q.id,
    clientName: `${q.prenom} ${q.nom}`,
    email: q.email,
    phone: q.telephone,
    vehicle: `${q.marque} ${q.modele} (${q.annee})`,
    brand: q.marque,
    model: q.modele,
    year: q.annee,
    engine: q.motorisation || '',
    projectType: q.typeProjet,
    soundPreference: q.sonorite,
    rearDiffuser: rearDiffuserLabel(q.rearDiffuser),
    message: q.message,
    suggestedLine: 'Échappement sur mesure — prix à compléter',
    vatRate: 20,
  }
}

/**
 * Sérialise pour un `<script type="application/json">` inline. `message`
 * contient du texte saisi librement par le client public (formulaire de
 * devis) : si jamais il contient la séquence `</script>`, un JSON.stringify
 * brut permettrait de refermer prématurément la balise et d'injecter du
 * HTML dans la page admin. On neutralise `<` (et par prudence `>` et `&`)
 * en échappement unicode — inerte en JSON, invisible pour le parseur côté
 * extension, mais plus jamais interprétable comme balisage HTML.
 */
export function safeJsonForScriptTag(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}
