import type { FAQItem as DbFAQItem } from '@prisma/client'
import { getDb, isDbConfigured } from '@/lib/db'
import { DEFAULT_FAQS, type PublicFAQ } from '@/data/faq'

export type { PublicFAQ }
export { DEFAULT_FAQS }

export function toPublicFAQ(row: DbFAQItem): PublicFAQ {
  return { question: row.question, answer: row.answer }
}

/** Questions publiées, triées — DB si configurée et non vide, sinon contenu historique. */
export async function getPublishedFAQs(): Promise<PublicFAQ[]> {
  if (!isDbConfigured()) return DEFAULT_FAQS
  const rows = await getDb().fAQItem.findMany({
    where: { status: 'published' },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })
  if (rows.length === 0) return DEFAULT_FAQS
  return rows.map(toPublicFAQ)
}
