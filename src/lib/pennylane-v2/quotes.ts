import 'server-only'
import { fetchAllPennylanePages } from './http-client'
import { buildFilter } from './filter'
import { resolveWebUrl } from './web-links'
import type { PennylaneQuote } from './types'

const MAX_QUOTE_PAGES = 5

export interface QuoteSummary {
  id: number
  number: string | null
  date: string | null
  deadline: string | null
  status: PennylaneQuote['status']
  amountTTC: string | null
  webUrl: string
}

function toSummary(q: PennylaneQuote): QuoteSummary {
  return {
    id: q.id,
    number: q.number ?? null,
    date: q.date ?? null,
    deadline: q.deadline ?? null,
    status: q.status,
    amountTTC: q.currency_amount ?? null,
    webUrl: resolveWebUrl(q),
  }
}

/** Devis d'un client, triés du plus récent au plus ancien — bornés (voir MAX_QUOTE_PAGES) pour une fiche client, pas un export comptable. */
export async function listQuotesForCustomer(customerId: number): Promise<{ quotes: QuoteSummary[]; truncated: boolean }> {
  const filter = buildFilter([{ field: 'customer_id', operator: 'eq', value: customerId }])
  const { items, truncated } = await fetchAllPennylanePages<PennylaneQuote>(
    '/quotes',
    { filter, sort: '-id', limit: 100 },
    MAX_QUOTE_PAGES
  )
  return { quotes: items.map(toSummary), truncated }
}
