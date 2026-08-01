/**
 * Normalisations utilisées pour la déduplication client Pennylane — jamais
 * pour l'affichage (qui garde toujours la valeur saisie par le client telle
 * quelle), uniquement pour comparer/rechercher de façon fiable.
 */

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Normalise un numéro de téléphone français vers une forme canonique
 * `+33XXXXXXXXX` pour comparaison — accepte les formats courants saisis par
 * un client (espaces, points, tirets, parenthèses, préfixe 0/+33/0033).
 * Renvoie la chaîne de chiffres nettoyée si le format ne correspond à aucun
 * schéma français reconnu (reste comparable tant que la même normalisation
 * est appliquée des deux côtés).
 */
export function normalizePhoneFR(phone: string): string {
  const digitsOnly = phone.replace(/[^\d+]/g, '')
  if (digitsOnly.startsWith('+33')) return `+33${digitsOnly.slice(3).replace(/^0/, '')}`
  if (digitsOnly.startsWith('0033')) return `+33${digitsOnly.slice(4).replace(/^0/, '')}`
  if (digitsOnly.startsWith('0') && digitsOnly.length === 10) return `+33${digitsOnly.slice(1)}`
  return digitsOnly
}

/** Nettoie un nom sans altérer les caractères utiles (accents, tirets, apostrophes) — trim + espaces multiples réduits. */
export function normalizeNameForSearch(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

export function normalizedNamesEqual(a: string, b: string): boolean {
  return normalizeNameForSearch(a).localeCompare(normalizeNameForSearch(b), 'fr', { sensitivity: 'base' }) === 0
}
