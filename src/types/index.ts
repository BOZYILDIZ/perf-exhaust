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
}

export interface Service {
  id: string
  title: string
  description: string
  icon: string
  details: string[]
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

export interface SocialPost {
  id: string
  platform: 'instagram' | 'tiktok'
  thumbnail: string
  url: string
  caption: string
  likes?: number
  date: string
}
