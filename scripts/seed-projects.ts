/**
 * Seed : importe les 15 réalisations historiques (src/data/projects.ts)
 * vers la base PostgreSQL, sans doublon (upsert par slug).
 *
 *   npm run db:seed
 *
 * Conserve : slugs, filterTags, contenus, featured, dates — les URLs et le
 * SEO existants restent identiques après bascule sur la base.
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { projects } from '../src/data/projects'

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL manquante — abandon.')
  process.exit(1)
}

const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL) })

async function main() {
  let created = 0
  let skipped = 0
  for (const [i, p] of projects.entries()) {
    const existing = await prisma.project.findUnique({ where: { slug: p.slug }, select: { id: true } })
    if (existing) {
      skipped++
      continue
    }
    await prisma.project.create({
      data: {
        slug: p.slug,
        status: 'published',
        vehicule: p.vehicule,
        marque: p.marque,
        modele: p.modele,
        annee: p.annee,
        prestation: p.prestation,
        tags: p.tags,
        sonoriteTag: p.sonoriteTag,
        filterTags: p.filterTags,
        description: p.description,
        descriptionComplete: p.descriptionComplete,
        objectifsClient: p.objectifsClient,
        modificationsRealisees: p.modificationsRealisees,
        materiaux: p.materiaux,
        resultatSonore: p.resultatSonore,
        galerie: p.images,
        videoUrl: p.videoUrl ?? null,
        featured: p.featured,
        date: p.date,
        sortOrder: i,
        publishedAt: new Date(p.date),
      },
    })
    created++
  }
  console.log(`Seed terminé : ${created} créée(s), ${skipped} déjà présente(s) (ignorées).`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
