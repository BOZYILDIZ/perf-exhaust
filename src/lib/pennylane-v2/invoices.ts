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
  displayStatus: InvoiceDisplayStatus
  amountTTC: number | null
  amountPaid: number | null
  amountRemaining: number | null
  webUrl: string
}

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

/**
 * Dérive un statut d'affichage lisible à partir des champs réellement
 * documentés pour les factures (`status` ne contient qu'une énumération
 * confirmée pour "draft" ; le paiement se lit via `is_paid` et
 * `outstanding_balance` — voir types.ts pour le détail de cette limite de
 * l'API). Ne prétend jamais à une précision que l'API ne garantit pas.
 */
function deriveDisplayStatus(inv: PennylaneCustomerInvoice, amountTTC: number | null, remaining: number | null): InvoiceDisplayStatus {
  if (inv.status === 'draft') return 'draft'
  if (inv.is_paid === true || remaining === 0) return 'paid'
  if (remaining !== null && amountTTC !== null && remaining > 0 && remaining < amountTTC) return 'partially_paid'
  if (inv.deadline && remaining !== null && remaining > 0) {
    const isOverdue = new Date(inv.deadline).getTime() < Date.now()
    if (isOverdue) return 'overdue'
  }
  return 'unpaid'
}

function toSummary(inv: PennylaneCustomerInvoice): InvoiceSummary {
  const amountTTC = toNumber(inv.currency_amount)
  const amountRemaining = toNumber(inv.outstanding_balance)
  const amountPaid = amountTTC !== null && amountRemaining !== null ? amountTTC - amountRemaining : null
  return {
    id: inv.id,
    number: inv.invoice_number ?? null,
    date: inv.issue_date ?? null,
    deadline: inv.deadline ?? null,
    displayStatus: deriveDisplayStatus(inv, amountTTC, amountRemaining),
    amountTTC,
    amountPaid,
    amountRemaining,
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
  totalBilled: number
  totalPaid: number
  totalRemaining: number
  lastInvoiceDate: string | null
  hasUnpaid: boolean
}

export function summarizeInvoices(invoices: InvoiceSummary[]): InvoicesFinancialSummary {
  let totalBilled = 0
  let totalPaid = 0
  let totalRemaining = 0
  let lastInvoiceDate: string | null = null
  let hasUnpaid = false

  for (const inv of invoices) {
    if (inv.displayStatus === 'draft') continue // pas encore facturé pour de bon
    totalBilled += inv.amountTTC ?? 0
    totalPaid += inv.amountPaid ?? 0
    totalRemaining += inv.amountRemaining ?? 0
    if (inv.displayStatus === 'unpaid' || inv.displayStatus === 'overdue' || inv.displayStatus === 'partially_paid') hasUnpaid = true
    if (inv.date && (!lastInvoiceDate || inv.date > lastInvoiceDate)) lastInvoiceDate = inv.date
  }

  return { count: invoices.length, totalBilled, totalPaid, totalRemaining, lastInvoiceDate, hasUnpaid }
}
