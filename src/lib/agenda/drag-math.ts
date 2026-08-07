/**
 * Calculs purs pour le glisser-déposer / redimensionnement de la grille
 * horaire — aucune dépendance au DOM (testable directement). Le composant
 * React (AgendaCalendar.tsx) ne fait que lire les coordonnées de la souris
 * et appeler ces fonctions.
 */

/** Convertit un déplacement vertical en pixels en minutes, selon la hauteur d'une heure à l'écran. */
export function pixelsToMinutes(deltaPixels: number, hourHeightPx: number): number {
  return (deltaPixels / hourHeightPx) * 60
}

/** Arrondit des minutes au multiple de `snapTo` le plus proche (par défaut 15 min). */
export function snapMinutes(minutes: number, snapTo = 15): number {
  return Math.round(minutes / snapTo) * snapTo
}

/** Nouvelle date de début après un déplacement vertical (en minutes), déjà arrondi par l'appelant si besoin. */
export function applyMinutesDelta(startAt: Date, deltaMinutes: number): Date {
  return new Date(startAt.getTime() + deltaMinutes * 60000)
}

/**
 * Index de la colonne (jour) sous une position X donnée, à partir des
 * bornes gauche/droite de chaque colonne. Renvoie -1 si hors de toute
 * colonne (ex: pointeur relâché en dehors de la grille).
 */
export function columnIndexAtX(clientX: number, columnBounds: { left: number; right: number }[]): number {
  for (let i = 0; i < columnBounds.length; i++) {
    if (clientX >= columnBounds[i].left && clientX < columnBounds[i].right) return i
  }
  return -1
}

/** Durée minimale d'un rendez-vous/bloc lors d'un redimensionnement (jamais 0 ni négatif). */
export const MIN_DURATION_MINUTES = 15

export function clampDuration(minutes: number): number {
  return Math.max(MIN_DURATION_MINUTES, minutes)
}
