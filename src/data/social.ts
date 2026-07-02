/**
 * Configuration des réseaux sociaux et avis Google — SANS API ni scraping.
 *
 * Tout est piloté manuellement depuis ce fichier :
 * - les liens vers les profils officiels ;
 * - une liste optionnelle de posts/vidéos à mettre en avant (`featuredPosts`) ;
 * - le lien vers la fiche Google Business pour les avis.
 *
 * Voir docs/MAINTENANCE.md pour la marche à suivre détaillée.
 */

export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/perfexhaust67/',
  tiktok: 'https://www.tiktok.com/@perfexhaust',
} as const

/**
 * URL de la fiche Google Business (bouton "Voir les avis Google").
 * Laisser vide ('') tant que l'URL exacte n'est pas connue : la section
 * affichera alors une invitation sans bouton cassé.
 * Format attendu : https://g.page/r/XXXXXXXX/review ou lien Google Maps de la fiche.
 */
export const GOOGLE_REVIEWS_URL = ''

export interface FeaturedPost {
  platform: 'instagram' | 'tiktok'
  /** URL publique du post/de la vidéo (ex: https://www.instagram.com/p/XXXX/) */
  url: string
  /** Courte légende affichée sur la carte */
  caption: string
}

/**
 * Posts à mettre en avant sur la page d'accueil, ajoutés MANUELLEMENT.
 * Exemple :
 *   { platform: 'instagram', url: 'https://www.instagram.com/p/ABC123/', caption: 'Ligne complète inox — Golf GTI' },
 *   { platform: 'tiktok', url: 'https://www.tiktok.com/@perfexhaust/video/123', caption: 'Soudure TIG en atelier' },
 * Si la liste est vide, la section affiche uniquement les cartes profils.
 */
export const featuredPosts: FeaturedPost[] = []
