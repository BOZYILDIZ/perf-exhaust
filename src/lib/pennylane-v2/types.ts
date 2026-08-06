/**
 * Types Pennylane API v2 — construits à partir de la documentation officielle
 * vérifiée (pennylane.readme.io, juillet 2026), pas des suppositions de
 * l'ancienne extension Chrome. Certains champs de réponse n'ont pas pu être
 * confirmés exhaustivement (pages de référence tronquées) : ils sont typés
 * `unknown`/optionnels plutôt qu'affirmés à tort — voir docs/MAINTENANCE.md
 * § "Limites connues de l'API".
 */

export type PennylaneCustomerType = 'individual' | 'company'

/**
 * Objet adresse Pennylane — les 4 champs sont exigés ensemble s'ils sont
 * fournis (constaté empiriquement par l'équipe sur l'ancienne intégration,
 * non documenté explicitement dans la référence API). Le formulaire public
 * PERF'EXHAUST ne collecte pas d'adresse postale : `country_alpha2: 'FR'`
 * seul est envoyé par défaut (voir billing-address.ts).
 */
export interface PennylaneBillingAddress {
  address?: string
  postal_code?: string
  city?: string
  country_alpha2?: string
}

/** Champs communs aux deux types de client (retour API). */
interface PennylaneCustomerBase {
  id: number
  customer_type?: PennylaneCustomerType
  emails?: string[]
  phone?: string | null
  billing_address?: PennylaneBillingAddress | null
  external_reference?: string | null
  reg_no?: string | null
  vat_number?: string | null
  // Confirmés par un appel réel (2026-08-06, GET /customers/{id}) : aucun
  // champ `url`/`public_url` n'existe sur l'objet client — Pennylane
  // n'expose aucun lien direct vers la fiche client dans l'app web.
  created_at?: string
  updated_at?: string
}

export interface PennylaneIndividualCustomer extends PennylaneCustomerBase {
  first_name: string
  last_name: string
}

export interface PennylaneCompanyCustomer extends PennylaneCustomerBase {
  name: string
}

export type PennylaneCustomer = PennylaneIndividualCustomer | PennylaneCompanyCustomer

export function customerDisplayName(c: PennylaneCustomer): string {
  if ('first_name' in c) return `${c.first_name} ${c.last_name}`.trim()
  return c.name
}

export interface CreateIndividualCustomerInput {
  first_name: string
  last_name: string
  phone: string
  billing_address: PennylaneBillingAddress
  emails?: string[]
  external_reference?: string
}

export interface CreateCompanyCustomerInput {
  name: string
  billing_address: PennylaneBillingAddress
  phone?: string
  vat_number?: string
  reg_no?: string
  emails?: string[]
  external_reference?: string
}

/**
 * Statuts de devis — confirmés par la référence officielle
 * (pennylane.readme.io/reference/listquotes, vérifiée le 2026-08-06).
 */
export type PennylaneQuoteStatus = 'pending' | 'accepted' | 'denied' | 'expired' | 'invoiced'

export interface PennylaneQuote {
  id: number
  number?: string | null
  status: PennylaneQuoteStatus
  date?: string | null
  deadline?: string | null
  customer_id: number
  currency?: string
  currency_amount?: string
  currency_amount_before_tax?: string
  currency_tax?: string
  created_at?: string
  updated_at?: string
  /** Expire 30 minutes après génération (documenté) — jamais mis en cache au-delà de sa durée de vie réelle. */
  public_file_url?: string
}

/**
 * Statut de facture client — confirmé par un appel réel contre le compte de
 * production (2026-08-06, GET /customer_invoices) ET la référence officielle
 * (pennylane.readme.io/reference/getcustomerinvoices) : l'énumération réelle
 * est bien plus riche que "draft" seul (précédemment supposé faute de
 * données réelles). Les champs de paiement réellement renvoyés sont `paid`
 * et `remaining_amount_with_tax`/`remaining_amount_without_tax` — PAS
 * `is_paid`/`outstanding_balance` (champs jamais confirmés, corrigés ici).
 */
export type PennylaneInvoiceStatus =
  | 'draft'
  | 'upcoming'
  | 'late'
  | 'paid'
  | 'partially_paid'
  | 'partially_cancelled'
  | 'cancelled'
  | 'archived'
  | 'incomplete'
  | 'credit_note'
  | 'proforma'
  | 'shipping_order'
  | 'purchasing_order'
  | 'estimate_pending'
  | 'estimate_accepted'
  | 'estimate_invoiced'
  | 'estimate_denied'

export interface PennylaneCustomerInvoice {
  id: number
  invoice_number?: string | null
  status?: PennylaneInvoiceStatus | string
  date?: string | null
  deadline?: string | null
  customer_id: number
  currency?: string
  currency_amount?: string
  currency_amount_before_tax?: string
  currency_tax?: string
  paid?: boolean
  remaining_amount_with_tax?: string | number | null
  remaining_amount_without_tax?: string | number | null
  created_at?: string
  updated_at?: string
  /** Aucune mention d'expiration trouvée dans la doc pour les factures (contrairement aux devis) — traité prudemment comme potentiellement temporaire. */
  public_file_url?: string
}

export type InvoiceDisplayStatus = 'paid' | 'partially_paid' | 'unpaid' | 'overdue' | 'draft' | 'cancelled' | 'other'

export interface PennylaneListMeta {
  has_more: boolean
  next_cursor: string | null
}

export interface PennylanePaginatedResponse<T> {
  items: T[]
  meta?: PennylaneListMeta
  // L'API répond parfois has_more/next_cursor au niveau racine plutôt que
  // dans `meta` selon l'endpoint (variations constatées entre pages de
  // documentation) — les deux formes sont gérées, voir http-client.ts.
  has_more?: boolean
  next_cursor?: string | null
}

export interface PennylaneErrorBody {
  error?: string
  message?: string
  details?: Record<string, unknown>
}
