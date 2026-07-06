/**
 * Seed : importe les 10 questions historiques (src/lib/faq-repo.ts) vers la
 * base PostgreSQL, sans doublon (par intitulé de question exact).
 *
 *   npm run db:seed:faq
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { DEFAULT_FAQS } from '../src/data/faq'

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL manquante — abandon.')
  process.exit(1)
}

const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL) })

async function main() {
  let created = 0
  let skipped = 0
  for (const [i, f] of DEFAULT_FAQS.entries()) {
    const existing = await prisma.fAQItem.findFirst({ where: { question: f.question }, select: { id: true } })
    if (existing) {
      skipped++
      continue
    }
    await prisma.fAQItem.create({
      data: {
        question: f.question,
        answer: f.answer,
        status: 'published',
        sortOrder: i,
      },
    })
    created++
  }
  console.log(`Seed FAQ terminé : ${created} créée(s), ${skipped} déjà présente(s) (ignorées).`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
