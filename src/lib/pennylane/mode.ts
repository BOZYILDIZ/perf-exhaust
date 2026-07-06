/**
 * Résolution du mode Pennylane — module pur (aucun import 'server-only',
 * aucun accès réseau) pour rester testable par un simple script Node/tsx.
 *
 * Le plan gratuit Pennylane n'inclut pas l'accès à l'API : PENNYLANE_MODE
 * permet de choisir explicitement le workflow, avec un repli sensé si la
 * variable est absente.
 *
 *   PENNYLANE_MODE=api    → force le mode API (brouillon automatique).
 *   PENNYLANE_MODE=manual → force le mode manuel assisté (copier-coller),
 *                            même si PENNYLANE_API_KEY est présente (utile
 *                            pour repasser au plan gratuit sans retirer la
 *                            clé d'un environnement de test par exemple).
 *   (absent)               → "api" si PENNYLANE_API_KEY est configurée,
 *                            sinon "manual" (comportement par défaut adapté
 *                            au plan gratuit, sans configuration requise).
 */
export type PennylaneMode = 'api' | 'manual'

export function getPennylaneMode(): PennylaneMode {
  const explicit = process.env.PENNYLANE_MODE?.trim().toLowerCase()
  if (explicit === 'manual') return 'manual'
  if (explicit === 'api') return 'api'
  return process.env.PENNYLANE_API_KEY ? 'api' : 'manual'
}

export function isPennylaneApiMode(): boolean {
  return getPennylaneMode() === 'api'
}

export function isPennylaneManualMode(): boolean {
  return getPennylaneMode() === 'manual'
}
