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
  // Champ éventuel exposant une URL directe (non confirmé par la doc,
  // exploité en repli défensif — voir buildPennylaneWebUrl()).
  url?: string
  public_url?: string
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

/** Statuts de devis documentés (référence PUT /quotes/{id}/update_status). */
export type PennylaneQuoteStatus = 'pending' | 'accepted' | 'denied' | 'expired' | 'invoiced'

export interface PennylaneQuote {
  id: number
  number?: string | null
  status: PennylaneQuoteStatus
  date?: string
  deadline?: string | null
  customer_id: number
  currency?: string
  currency_amount?: string
  currency_amount_before_tax?: string
  currency_tax?: string
  public_file_url?: string
  url?: string
}

/**
 * Statut de facture client — l'API v2 documentée n'expose pas d'énumération
 * `status` propre pour les factures (contrairement aux devis) : le modèle de
 * données observé (data-sharing.pennylane.com) donne `is_paid` (booléen) et
 * `outstanding_balance` (reste dû), à partir desquels un statut d'affichage
 * est dérivé côté PERF'EXHAUST (voir invoices.ts `deriveInvoiceDisplayStatus`).
 * `status: "draft"` est en revanche confirmé (exemple de réponse officiel).
 */
export interface PennylaneCustomerInvoice {
  id: number
  invoice_number?: string | null
  status?: string // "draft" confirmé ; autres valeurs non documentées formellement
  issue_date?: string
  deadline?: string | null
  customer_id: number
  currency?: string
  currency_amount?: string
  currency_amount_before_tax?: string
  currency_tax?: string
  is_paid?: boolean
  outstanding_balance?: string | number | null
  public_file_url?: string
  url?: string
}

export type InvoiceDisplayStatus = 'paid' | 'partially_paid' | 'unpaid' | 'overdue' | 'draft'

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
