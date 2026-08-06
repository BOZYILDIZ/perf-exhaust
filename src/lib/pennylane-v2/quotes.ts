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
  amountHT: string | null
  amountTTC: string | null
  createdAt: string | null
  updatedAt: string | null
  webUrl: string
}

function toSummary(q: PennylaneQuote): QuoteSummary {
  return {
    id: q.id,
    number: q.number ?? null,
    date: q.date ?? null,
    deadline: q.deadline ?? null,
    status: q.status,
    amountHT: q.currency_amount_before_tax ?? null,
    amountTTC: q.currency_amount ?? null,
    createdAt: q.created_at ?? null,
    updatedAt: q.updated_at ?? null,
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

export interface QuotesStatsSummary {
  count: number
  accepted: number
  denied: number
  expired: number
  pending: number
  invoiced: number
}

/** Statuts confirmés par la référence officielle (pennylane.readme.io/reference/listquotes) — aucun autre statut n'est supposé exister. */
export function summarizeQuotes(quotes: QuoteSummary[]): QuotesStatsSummary {
  const stats: QuotesStatsSummary = { count: quotes.length, accepted: 0, denied: 0, expired: 0, pending: 0, invoiced: 0 }
  for (const q of quotes) {
    if (q.status === 'accepted') stats.accepted += 1
    else if (q.status === 'denied') stats.denied += 1
    else if (q.status === 'expired') stats.expired += 1
    else if (q.status === 'pending') stats.pending += 1
    else if (q.status === 'invoiced') stats.invoiced += 1
  }
  return stats
}
