/**
 * Badge client — calculé automatiquement, jamais saisi manuellement.
 * Priorité (du plus urgent au plus neutre) : une facture impayée ou un devis
 * en attente priment toujours sur l'ancienneté du client, car ce sont des
 * actions potentiellement nécessaires côté atelier.
 */

export type ClientBadgeKind = 'unpaid_invoice' | 'pending_quote' | 'loyal' | 'existing' | 'new'

export interface ClientBadge {
  kind: ClientBadgeKind
  label: string
  emoji: string
  tone: 'err' | 'warn' | 'loyal' | 'existing' | 'new'
}

export interface ClientBadgeInput {
  requestCount: number
  hasUnpaidInvoice: boolean
  hasPendingQuote: boolean
}

const LOYAL_THRESHOLD = 3

export function computeClientBadge(input: ClientBadgeInput): ClientBadge {
  if (input.hasUnpaidInvoice) {
    return { kind: 'unpaid_invoice', label: 'Facture impayée', emoji: '🔴', tone: 'err' }
  }
  if (input.hasPendingQuote) {
    return { kind: 'pending_quote', label: 'Devis en attente', emoji: '🟠', tone: 'warn' }
  }
  if (input.requestCount >= LOYAL_THRESHOLD) {
    return { kind: 'loyal', label: 'Client fidèle', emoji: '🟣', tone: 'loyal' }
  }
  if (input.requestCount >= 2) {
    return { kind: 'existing', label: 'Client existant', emoji: '🔵', tone: 'existing' }
  }
  return { kind: 'new', label: 'Nouveau client', emoji: '🟢', tone: 'new' }
}
