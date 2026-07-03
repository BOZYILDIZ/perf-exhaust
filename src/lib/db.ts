import 'server-only'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

/**
 * Client Prisma gardé : n'est instancié QUE si DATABASE_URL est configurée.
 *
 * Sans base configurée (état actuel de la production Vercel), le site public
 * retombe automatiquement sur les données statiques de src/data/projects.ts
 * (voir src/lib/projects-repo.ts) et l'admin affiche un message explicite —
 * rien ne casse.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

export function getDb(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL non configurée — voir docs/MAINTENANCE.md § "Panel admin & base de données".'
    )
  }
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg(process.env.DATABASE_URL)
    globalForPrisma.prisma = new PrismaClient({ adapter })
  }
  return globalForPrisma.prisma
}
