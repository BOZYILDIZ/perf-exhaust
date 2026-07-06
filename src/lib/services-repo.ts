import type { Service } from '@/types'
import type { Service as DbService } from '@prisma/client'
import { services as staticServices } from '@/data/services'
import { getDb, isDbConfigured } from '@/lib/db'

/**
 * Prestations affichées sur /services — même pattern de repli que
 * src/lib/projects-repo.ts : DB si configurée ET au moins une prestation
 * publiée existe, sinon src/data/services.ts (état historique).
 */
export function toPublicService(row: DbService): Service {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.shortDescription,
    icon: row.icon,
  }
}

export async function getPublishedServices(): Promise<Service[]> {
  if (!isDbConfigured()) return staticServices
  const rows = await getDb().service.findMany({
    where: { status: 'published' },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })
  if (rows.length === 0) return staticServices
  return rows.map(toPublicService)
}
