import type { WorkshopPhoto } from './workshop-photos'

/**
 * Prépare les champs d'un brouillon de Réalisation (Project) à partir d'un
 * rendez-vous atelier terminé — fonction pure, aucun accès DB/réseau. La
 * création réelle (slug unique, écriture) reste dans l'API route (voir
 * /api/admin/appointments/[id]/create-realisation), qui réutilise
 * exactement l'architecture Project existante (même approche que la
 * duplication de réalisation, src/app/api/admin/projects/[id]/duplicate/route.ts) :
 * TOUJOURS créé en `status: "draft"`, jamais publié automatiquement —
 * l'admin termine et publie depuis /admin/realisations/[id]/edit, sans
 * aucun raccourci parallèle.
 */

const YEAR_REGEX = /^(19|20)\d{2}$/

export interface RealisationDraftSource {
  vehicle: string
  marque: string | null
  modele: string | null
  annee: string | null
  motorisation: string | null
  photosAvant: WorkshopPhoto[]
  photosApres: WorkshopPhoto[]
}

export interface RealisationDraftFields {
  vehicule: string
  marque: string
  modele: string
  annee: string
  prestation: string
  sonoriteTag: string
  description: string
  descriptionComplete: string
  tags: string[]
  filterTags: string[]
  galerie: { src: string; alt: string; type: 'avant' | 'apres' | 'detail' }[]
  status: 'draft'
  featured: false
  sortOrder: 0
}

export function buildRealisationDraftFromAppointment(source: RealisationDraftSource, now: Date = new Date()): RealisationDraftFields {
  const marque = source.marque?.trim() || source.vehicle
  const modele = source.modele?.trim() || 'Modèle à préciser'
  const annee = source.annee && YEAR_REGEX.test(source.annee) ? source.annee : String(now.getFullYear())

  const galerie: RealisationDraftFields['galerie'] = [
    ...source.photosAvant.map((p) => ({ src: p.url, alt: `Avant intervention — ${source.vehicle}`, type: 'avant' as const })),
    ...source.photosApres.map((p) => ({ src: p.url, alt: `Après intervention — ${source.vehicle}`, type: 'apres' as const })),
  ]

  return {
    vehicule: source.vehicle,
    marque,
    modele,
    annee,
    prestation: 'Prestation à préciser',
    sonoriteTag: 'À préciser',
    description: `Intervention réalisée sur ${source.vehicle}. Description à compléter avant publication.`,
    descriptionComplete: `Intervention réalisée sur ${source.vehicle}${source.motorisation ? ` (${source.motorisation})` : ''}. À compléter avant publication : objectifs client, modifications réalisées, matériaux utilisés, résultat sonore.`,
    tags: [],
    filterTags: [],
    galerie,
    status: 'draft',
    featured: false,
    sortOrder: 0,
  }
}
