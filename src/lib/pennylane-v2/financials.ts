import 'server-only'
import type { Prisma } from '@prisma/client'
import { getDb } from '@/lib/db'
import { listQuotesForCustomer, type QuoteSummary } from './quotes'
import { listInvoicesForCustomer, summarizeInvoices, type InvoiceSummary, type InvoicesFinancialSummary } from './invoices'
import { isFinancialsCacheStale } from './cache'
import { pennylaneErrorToAdminMessage } from './errors'

export interface CustomerFinancials {
  notSynced: boolean
  quotes: QuoteSummary[]
  invoices: InvoiceSummary[]
  summary: InvoicesFinancialSummary
  fetchedAt: Date | null
  stale: boolean
  error: string | null
}

const EMPTY_SUMMARY: InvoicesFinancialSummary = {
  count: 0,
  totalBilled: 0,
  totalPaid: 0,
  totalRemaining: 0,
  lastInvoiceDate: null,
  hasUnpaid: false,
}

/**
 * Récupère les devis/factures d'un client Pennylane pour une demande, avec
 * cache (voir cache.ts pour le TTL). Ne rappelle l'API que si le cache est
 * expiré ou `forceRefresh` est demandé (bouton "Actualiser") — jamais à
 * chaque rendu de page.
 */
export async function getCustomerFinancials(quoteRequestId: string, opts: { forceRefresh?: boolean } = {}): Promise<CustomerFinancials> {
  const db = getDb()
  const q = await db.quoteRequest.findUnique({
    where: { id: quoteRequestId },
    select: {
      pennylaneCustomerId: true,
      pennylaneQuotesCache: true,
      pennylaneInvoicesCache: true,
      pennylaneFinancialsSyncedAt: true,
    },
  })

  if (!q?.pennylaneCustomerId) {
    return { notSynced: true, quotes: [], invoices: [], summary: EMPTY_SUMMARY, fetchedAt: null, stale: false, error: null }
  }

  const stale = isFinancialsCacheStale(q.pennylaneFinancialsSyncedAt)
  if (!opts.forceRefresh && !stale && q.pennylaneQuotesCache && q.pennylaneInvoicesCache) {
    const quotes = q.pennylaneQuotesCache as unknown as QuoteSummary[]
    const invoices = q.pennylaneInvoicesCache as unknown as InvoiceSummary[]
    return { notSynced: false, quotes, invoices, summary: summarizeInvoices(invoices), fetchedAt: q.pennylaneFinancialsSyncedAt, stale: false, error: null }
  }

  try {
    const customerId = Number(q.pennylaneCustomerId)
    const [{ quotes }, { invoices }] = await Promise.all([
      listQuotesForCustomer(customerId),
      listInvoicesForCustomer(customerId),
    ])
    const now = new Date()
    await db.quoteRequest.update({
      where: { id: quoteRequestId },
      data: {
        pennylaneQuotesCache: quotes as unknown as Prisma.InputJsonValue,
        pennylaneInvoicesCache: invoices as unknown as Prisma.InputJsonValue,
        pennylaneFinancialsSyncedAt: now,
      },
    })
    return { notSynced: false, quotes, invoices, summary: summarizeInvoices(invoices), fetchedAt: now, stale: false, error: null }
  } catch (err) {
    console.error(`[pennylane-v2] Échec de récupération des devis/factures pour la demande ${quoteRequestId} :`, err)
    const message = pennylaneErrorToAdminMessage(err)
    // Panne temporaire : si un cache existe encore, mieux vaut l'afficher
    // (marqué périmé) que de ne rien montrer du tout.
    if (q.pennylaneQuotesCache && q.pennylaneInvoicesCache) {
      const quotes = q.pennylaneQuotesCache as unknown as QuoteSummary[]
      const invoices = q.pennylaneInvoicesCache as unknown as InvoiceSummary[]
      return { notSynced: false, quotes, invoices, summary: summarizeInvoices(invoices), fetchedAt: q.pennylaneFinancialsSyncedAt, stale: true, error: message }
    }
    return { notSynced: false, quotes: [], invoices: [], summary: EMPTY_SUMMARY, fetchedAt: null, stale: false, error: message }
  }
}
