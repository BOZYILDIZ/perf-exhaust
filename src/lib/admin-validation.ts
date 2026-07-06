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

/** Statuts possibles d'une demande de devis (mini-CRM). */
export const QUOTE_STATUSES = ['new', 'contacted', 'in_progress', 'completed', 'archived'] as const

/** Statuts du suivi manuel Pennylane (plan gratuit, sans API — voir src/lib/pennylane/mode.ts). */
export const PENNYLANE_MANUAL_STATUSES = [
  'a_creer',
  'devis_cree',
  'devis_envoye',
  'devis_accepte',
  'devis_refuse',
  'facture_creee',
  'paye',
] as const

/** Mise à jour d'une demande de devis depuis l'admin (CRM + suivi manuel Pennylane). */
export const quoteRequestUpdateSchema = z
  .object({
    status: z.enum(QUOTE_STATUSES).optional(),
    notes: z.string().max(5000).optional(),
    pennylaneManualStatus: z.enum(PENNYLANE_MANUAL_STATUSES).optional(),
    pennylaneQuoteNumber: z.string().max(120).optional().or(z.literal('')),
    pennylaneQuoteUrl: z.string().url("Lien Pennylane invalide").optional().or(z.literal('')),
  })
  .refine((v) => Object.values(v).some((value) => value !== undefined), {
    message: 'Aucune modification fournie',
  })

/** Paramètres globaux du site, édités depuis /admin/settings. */
export const siteSettingsSchema = z.object({
  businessName: z.string().min(1).max(120),
  phone: z.string().min(4).max(30),
  email: z.string().email(),
  address: z.string().min(1).max(200),
  postalCode: z.string().min(2).max(20),
  city: z.string().min(1).max(120),
  instagramUrl: z.string().url().optional().or(z.literal('')),
  tiktokUrl: z.string().url().optional().or(z.literal('')),
  googleReviewsUrl: z.string().url().optional().or(z.literal('')),
  shiftechUrl: z.string().url().optional().or(z.literal('')),
  openingHours: z.string().max(300),
  legalForm: z.string().max(120).optional().or(z.literal('')),
  siret: z.string().max(30).optional().or(z.literal('')),
  publicationDirector: z.string().max(120).optional().or(z.literal('')),
  pennylaneManualUrl: z.string().url("URL Pennylane invalide").max(500).optional().or(z.literal('')),
})

/** Prestation affichée sur /services, éditée depuis /admin/services. */
export const serviceSchema = z.object({
  title: z.string().min(2, 'Titre requis'),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalide : minuscules, chiffres et tirets uniquement'),
  shortDescription: z.string().min(10, 'Description courte requise (10 caractères min)'),
  longDescription: z.string().default(''),
  icon: z.string().min(1).max(40).default('wrench'),
  status: z.enum(['draft', 'published']),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  seoTitle: z.string().max(120).optional().or(z.literal('')),
  seoDescription: z.string().max(300).optional().or(z.literal('')),
})

/** Question fréquente, éditée depuis /admin/faq. */
export const faqItemSchema = z.object({
  question: z.string().min(5, 'Question requise'),
  answer: z.string().min(5, 'Réponse requise'),
  category: z.string().max(80).optional().or(z.literal('')),
  status: z.enum(['draft', 'published']),
  sortOrder: z.number().int().min(0).max(9999).default(0),
})

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
