/**
 * Seed : crée (ou laisse intacte) la ligne unique SiteSettings avec les
 * valeurs actuellement codées en dur dans le site (FALLBACK_SETTINGS).
 * Idempotent : n'écrase jamais une configuration déjà personnalisée depuis
 * /admin/settings.
 *
 *   npm run db:seed:settings
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { FALLBACK_SETTINGS } from '../src/data/settings'

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL manquante — abandon.')
  process.exit(1)
}

const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL) })

async function main() {
  const existing = await prisma.siteSettings.findUnique({ where: { id: 'singleton' } })
  if (existing) {
    console.log('Seed settings : une configuration existe déjà — aucune modification.')
    return
  }
  await prisma.siteSettings.create({ data: { id: 'singleton', ...FALLBACK_SETTINGS } })
  console.log('Seed settings terminé : configuration initiale créée.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
