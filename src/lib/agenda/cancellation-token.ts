import 'server-only'
import { randomBytes, createHash } from 'node:crypto'

/**
 * Token d'annulation client — jamais stocké en clair. `generateCancellationToken`
 * renvoie le token brut (à mettre dans l'URL de l'email, une seule fois) et
 * son hash SHA-256 (seul persisté en base, colonne `cancellationTokenHash`).
 * La vérification se fait par recherche exacte sur le hash (voir
 * `hashCancellationToken`) — aucune valeur secrète n'est jamais comparée
 * caractère par caractère côté application.
 */
export function generateCancellationToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url') // 256 bits d'entropie
  return { token, hash: hashCancellationToken(token) }
}

export function hashCancellationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
