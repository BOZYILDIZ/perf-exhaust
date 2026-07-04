import type { Project } from '@/types'
import type { Project as DbProject } from '@prisma/client'
import { projects as staticProjects } from '@/data/projects'
import { getDb, isDbConfigured } from '@/lib/db'

/**
 * Couche d'accès aux réalisations avec repli automatique :
 *
 *   DATABASE_URL configurée  → lecture PostgreSQL (contenu géré par /admin)
 *   DATABASE_URL absente     → lecture de src/data/projects.ts (état historique)
 *
 * Les pages publiques ne consomment QUE les fonctions de ce fichier : le site
 * fonctionne donc à l'identique avant et après le branchement de la base.
 */

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

type GalleryImage = Project['images'][number]

function asGallery(value: unknown): GalleryImage[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (v): v is GalleryImage =>
      typeof v === 'object' && v !== null &&
      typeof (v as GalleryImage).src === 'string' &&
      typeof (v as GalleryImage).alt === 'string'
  )
}

/** Mappe une ligne Prisma vers le type public `Project` (composants inchangés). */
export function toPublicProject(row: DbProject): Project {
  return {
    id: row.id,
    slug: row.slug,
    vehicule: row.vehicule,
    marque: row.marque,
    modele: row.modele,
    annee: row.annee,
    prestation: row.prestation,
    tags: asStringArray(row.tags),
    sonoriteTag: row.sonoriteTag,
    filterTags: asStringArray(row.filterTags),
    description: row.description,
    descriptionComplete: row.descriptionComplete,
    objectifsClient: row.objectifsClient,
    modificationsRealisees: row.modificationsRealisees,
    materiaux: row.materiaux,
    resultatSonore: row.resultatSonore,
    images: asGallery(row.galerie),
    videoUrl: row.videoUrl ?? undefined,
    featured: row.featured,
    date: row.date || row.createdAt.toISOString().slice(0, 10),
    imagePrincipale: row.imagePrincipale ?? undefined,
    imageAlt: row.imageAlt ?? undefined,
    seoTitle: row.seoTitle ?? undefined,
    seoDescription: row.seoDescription ?? undefined,
    ogImage: row.ogImage ?? undefined,
  }
}

/** Réalisations publiées, ordonnées (galerie, home, sitemap). */
export async function getPublishedProjects(): Promise<Project[]> {
  if (!isDbConfigured()) return staticProjects
  const rows = await getDb().project.findMany({
    where: { status: 'published' },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  })
  return rows.map(toPublicProject)
}

/**
 * Détail d'une réalisation par slug.
 * `includeDrafts` réservé à la prévisualisation admin (session vérifiée par
 * l'appelant) — un brouillon reste introuvable pour le public.
 */
export async function getPublishedProjectBySlug(
  slug: string,
  { includeDrafts = false }: { includeDrafts?: boolean } = {}
): Promise<{ project: Project; isDraft: boolean } | null> {
  if (!isDbConfigured()) {
    const p = staticProjects.find((s) => s.slug === slug)
    return p ? { project: p, isDraft: false } : null
  }
  const row = await getDb().project.findUnique({ where: { slug } })
  if (!row) return null
  if (row.status !== 'published' && !includeDrafts) return null
  return { project: toPublicProject(row), isDraft: row.status !== 'published' }
}

/** Réalisations mises en avant (section home). */
export async function getFeaturedProjects(): Promise<Project[]> {
  const all = await getPublishedProjects()
  return all.filter((p) => p.featured)
}
