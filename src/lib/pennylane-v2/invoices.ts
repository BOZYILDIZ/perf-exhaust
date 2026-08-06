import 'server-only'
import { fetchAllPennylanePages } from './http-client'
import { buildFilter } from './filter'
import { resolveWebUrl } from './web-links'
import type { PennylaneCustomerInvoice, InvoiceDisplayStatus } from './types'

const MAX_INVOICE_PAGES = 5

export interface InvoiceSummary {
  id: number
  number: string | null
  date: string | null
  deadline: string | null
  /** Statut réel Pennylane, non traduit — conservé pour ne perdre aucune information (ex: "estimate_pending"). */
  rawStatus: string | null
  displayStatus: InvoiceDisplayStatus
  amountHT: number | null
  amountTTC: number | null
  amountPaid: number | null
  amountRemaining: number | null
  createdAt: string | null
  updatedAt: string | null
  webUrl: string
}

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

/**
 * Statut d'affichage — dérivé du champ `status` réel de Pennylane (confirmé
 * par un appel réel contre le compte de production le 2026-08-06 et par la
 * référence officielle GET /customer_invoices), PAS deviné à partir des
 * montants. L'énumération réelle est plus riche que nos 5 catégories
 * d'affichage : les statuts non mappés explicitement tombent dans "other"
 * plutôt que d'être présumés à tort.
 */
function deriveDisplayStatus(inv: PennylaneCustomerInvoice): InvoiceDisplayStatus {
  switch (inv.status) {
    case 'draft': return 'draft'
    case 'cancelled':
    case 'partially_cancelled': return 'cancelled'
    case 'paid': return 'paid'
    case 'partially_paid': return 'partially_paid'
    case 'late': return 'overdue'
    case 'upcoming': return 'unpaid'
    default: return inv.paid ? 'paid' : 'other'
  }
}

function toSummary(inv: PennylaneCustomerInvoice): InvoiceSummary {
  const amountHT = toNumber(inv.currency_amount_before_tax)
  const amountTTC = toNumber(inv.currency_amount)
  const amountRemaining = toNumber(inv.remaining_amount_with_tax)
  const amountPaid = amountTTC !== null && amountRemaining !== null ? amountTTC - amountRemaining : null
  return {
    id: inv.id,
    number: inv.invoice_number ?? null,
    date: inv.date ?? null,
    deadline: inv.deadline ?? null,
    rawStatus: inv.status ?? null,
    displayStatus: deriveDisplayStatus(inv),
    amountHT,
    amountTTC,
    amountPaid,
    amountRemaining,
    createdAt: inv.created_at ?? null,
    updatedAt: inv.updated_at ?? null,
    webUrl: resolveWebUrl(inv),
  }
}

export async function listInvoicesForCustomer(customerId: number): Promise<{ invoices: InvoiceSummary[]; truncated: boolean }> {
  const filter = buildFilter([{ field: 'customer_id', operator: 'eq', value: customerId }])
  const { items, truncated } = await fetchAllPennylanePages<PennylaneCustomerInvoice>(
    '/customer_invoices',
    { filter, sort: '-date', limit: 100 },
    MAX_INVOICE_PAGES
  )
  return { invoices: items.map(toSummary), truncated }
}

export interface InvoicesFinancialSummary {
  count: number
  paidCount: number
  unpaidCount: number
  totalBilled: number
  totalPaid: number
  totalRemaining: number
  lastInvoiceDate: string | null
  hasUnpaid: boolean
}

/** Statuts qui ne représentent pas une facture réellement due (brouillon, annulée) — exclus des totaux monétaires. */
const NON_BILLABLE_STATUSES: InvoiceDisplayStatus[] = ['draft', 'cancelled']

export function summarizeInvoices(invoices: InvoiceSummary[]): InvoicesFinancialSummary {
  let totalBilled = 0
  let totalPaid = 0
  let totalRemaining = 0
  let lastInvoiceDate: string | null = null
  let hasUnpaid = false
  let paidCount = 0
  let unpaidCount = 0

  for (const inv of invoices) {
    if (NON_BILLABLE_STATUSES.includes(inv.displayStatus)) continue
    totalBilled += inv.amountTTC ?? 0
    totalPaid += inv.amountPaid ?? 0
    totalRemaining += inv.amountRemaining ?? 0
    if (inv.displayStatus === 'paid') {
      paidCount += 1
    } else {
      unpaidCount += 1
      hasUnpaid = true
    }
    if (inv.date && (!lastInvoiceDate || inv.date > lastInvoiceDate)) lastInvoiceDate = inv.date
  }

  return { count: invoices.length, paidCount, unpaidCount, totalBilled, totalPaid, totalRemaining, lastInvoiceDate, hasUnpaid }
}
