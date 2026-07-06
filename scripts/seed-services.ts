/**
 * Seed : importe les 7 services historiques (src/data/services.ts) vers la
 * base PostgreSQL, sans doublon (par slug).
 *
 *   npm run db:seed:services
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { services } from '../src/data/services'

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL manquante — abandon.')
  process.exit(1)
}

const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL) })

async function main() {
  let created = 0
  let skipped = 0
  for (const [i, s] of services.entries()) {
    const existing = await prisma.service.findUnique({ where: { slug: s.slug }, select: { id: true } })
    if (existing) {
      skipped++
      continue
    }
    await prisma.service.create({
      data: {
        title: s.title,
        slug: s.slug,
        shortDescription: s.description,
        icon: s.icon,
        status: 'published',
        sortOrder: i,
      },
    })
    created++
  }
  console.log(`Seed services terminé : ${created} créé(s), ${skipped} déjà présent(s) (ignorés).`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
