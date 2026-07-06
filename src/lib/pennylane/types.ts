/**
 * Types Pennylane API v2 — limités aux champs réellement documentés et
 * utilisés par cette intégration (customers + quotes). Le format exact de
 * la réponse de création de devis (numéro, URL publique) n'est pas
 * intégralement documenté par Pennylane au moment de l'écriture : les
 * champs correspondants sont donc optionnels et lus de façon défensive.
 * Voir docs/MAINTENANCE.md § "Intégration Pennylane".
 */

export interface PennylaneAddress {
  address?: string
  zip_code?: string
  city?: string
  country_alpha2?: string
}

export interface PennylaneCustomer {
  id: number
  name?: string
  emails?: string[]
  [key: string]: unknown
}

export interface PennylaneQuoteLineInput {
  label: string
  quantity: number
  /** Pennylane exige les montants sous forme de chaîne (évite les erreurs d'arrondi flottant côté API). */
  raw_currency_unit_price: string
  vat_rate: string
  unit?: string
}

export interface PennylaneCreateQuoteInput {
  date: string
  deadline: string
  customer_id: number
  invoice_lines: PennylaneQuoteLineInput[]
  external_reference?: string
  pdf_description?: string
  pdf_invoice_subject?: string
}

export interface PennylaneQuote {
  id: number
  number?: string
  status?: string
  public_url?: string
  url?: string
  pdf_url?: string
  [key: string]: unknown
}

export interface PennylaneErrorBody {
  error?: string
  message?: string
  details?: unknown
}

export class PennylaneError extends Error {
  readonly status: number
  readonly code?: string
  readonly details?: unknown

  constructor(status: number, body: PennylaneErrorBody | null, fallbackMessage: string) {
    super(body?.message || fallbackMessage)
    this.name = 'PennylaneError'
    this.status = status
    this.code = body?.error
    this.details = body?.details
  }

  /** Message compréhensible pour l'admin — jamais de détails techniques bruts (stack, secrets). */
  toAdminMessage(): string {
    if (this.status === 401 || this.status === 403) {
      return "Accès refusé par Pennylane — la clé API est invalide, expirée ou n'a pas les permissions nécessaires."
    }
    if (this.status === 422) {
      const detail = typeof this.details === 'object' && this.details
        ? JSON.stringify(this.details)
        : ''
      return `Pennylane a refusé les données envoyées : ${this.message}${detail ? ` (${detail})` : ''}`
    }
    if (this.status === 429) {
      return 'Trop de requêtes envoyées à Pennylane (limite atteinte) — réessayez dans quelques secondes.'
    }
    if (this.status >= 500) {
      return 'Pennylane est temporairement indisponible — réessayez plus tard.'
    }
    return `Erreur Pennylane (${this.status}) : ${this.message}`
  }
}
