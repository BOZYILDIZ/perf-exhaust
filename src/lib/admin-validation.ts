import { z } from 'zod'

/** Valeurs autorisées pour les filtres de la galerie publique. */
export const FILTER_TAGS = [
  'ligne-complete',
  'demi-ligne',
  'silencieux',
  'grave',
  'sportif',
  'inox',
  'discret',
  'agressif',
  'reparation',
] as const

const galleryImage = z.object({
  src: z.string().min(1),
  alt: z.string().min(1, "Texte alternatif requis pour chaque image"),
  type: z.enum(['avant', 'apres', 'detail']),
})

/** Payload complet d'une réalisation (création / édition admin). */
export const projectSchema = z.object({
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalide : minuscules, chiffres et tirets uniquement'),
  status: z.enum(['draft', 'published']),

  vehicule: z.string().min(2, 'Véhicule requis'),
  marque: z.string().min(2, 'Marque requise'),
  modele: z.string().min(1, 'Modèle requis'),
  annee: z.string().regex(/^(19|20)\d{2}$/, 'Année invalide (ex : 2021)'),
  prestation: z.string().min(2, 'Prestation requise'),
  categorie: z.string().max(80).optional().or(z.literal('')),
  tags: z.array(z.string().min(1).max(40)).max(10),
  sonoriteTag: z.string().min(2, 'Profil sonore requis'),
  filterTags: z.array(z.enum(FILTER_TAGS)),

  description: z.string().min(10, 'Description courte requise (10 caractères min)'),
  descriptionComplete: z.string().min(10, 'Description longue requise'),
  objectifsClient: z.string().default(''),
  modificationsRealisees: z.string().default(''),
  materiaux: z.string().default(''),
  resultatSonore: z.string().default(''),
  dureeProjet: z.string().max(120).optional().or(z.literal('')),
  difficulte: z.string().max(120).optional().or(z.literal('')),
  ctaCustom: z.string().max(200).optional().or(z.literal('')),

  imagePrincipale: z.string().optional().or(z.literal('')),
  imageAlt: z.string().max(200).optional().or(z.literal('')),
  galerie: z.array(galleryImage).max(24),
  videoUrl: z.string().url('URL vidéo invalide').optional().or(z.literal('')),

  seoTitle: z.string().max(120).optional().or(z.literal('')),
  seoDescription: z.string().max(300).optional().or(z.literal('')),
  ogImage: z.string().optional().or(z.literal('')),

  featured: z.boolean().default(false),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date au format AAAA-MM-JJ')
    .optional()
    .or(z.literal('')),
  sortOrder: z.number().int().min(0).max(9999).default(0),
})

export type ProjectPayload = z.infer<typeof projectSchema>

/** Nettoyage léger : trim + suppression des caractères de contrôle. */
export function sanitizeStrings<T>(value: T): T {
  if (typeof value === 'string') {
    return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim() as T
  }
  if (Array.isArray(value)) return value.map(sanitizeStrings) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, sanitizeStrings(v)])
    ) as T
  }
  return value
}
