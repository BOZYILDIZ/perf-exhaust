export interface Project {
  id: string
  slug: string
  vehicule: string
  marque: string
  modele: string
  annee: string
  prestation: string
  tags: string[]
  sonoriteTag: string
  /** Valeurs stables utilisées par les filtres de la galerie (ex: "ligne-complete", "grave"). */
  filterTags: string[]
  description: string
  descriptionComplete: string
  objectifsClient: string
  modificationsRealisees: string
  materiaux: string
  resultatSonore: string
  images: { src: string; alt: string; type: 'avant' | 'apres' | 'detail' }[]
  videoUrl?: string
  featured: boolean
  date: string
  /** Image de couverture (admin) — affichée si URL http(s) réelle. */
  imagePrincipale?: string
  imageAlt?: string
  /** Surcharges SEO saisies dans l'admin. */
  seoTitle?: string
  seoDescription?: string
  ogImage?: string
}

export interface Service {
  id: string
  /** Identifiant stable pour l'URL/l'admin (kebab-case). */
  slug: string
  title: string
  description: string
  icon: string
  /** Puces techniques — absentes pour les services créés depuis l'admin (non demandé dans ce modèle). */
  details?: string[]
  badge?: string
}

export interface Partner {
  id: string
  name: string
  logo?: string
  description: string
  url?: string
  type: string
}
