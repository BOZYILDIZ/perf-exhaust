import type { QuoteSummary } from './quotes'
import type { InvoiceSummary } from './invoices'

/**
 * Timeline "Historique PERF'EXHAUST" — construite uniquement à partir de
 * dates réellement disponibles. Pennylane n'expose aucun horodatage dédié
 * "devis accepté" ou "facture payée" (confirmé par la référence officielle,
 * 2026-08-06) : ces deux événements utilisent `updated_at` comme date la
 * plus proche de la réalité disponible, jamais une date inventée — voir
 * docs/MAINTENANCE.md. `kind` est une chaîne libre (pas une énumération
 * fermée) pour que la timeline reste prête à accueillir d'autres types
 * d'événements sans modifier ce fichier.
 */

export interface TimelineEvent {
  kind: string
  label: string
  date: string
  detail?: string
  /** true si la date est une approximation (ex: updated_at faute de champ dédié). */
  approximate?: boolean
}

export interface TimelineSourceRequest {
  id: string
  createdAt: string
  pennylaneCustomerSyncedAt: string | null
}

export function buildClientTimeline(
  requests: TimelineSourceRequest[],
  quotes: QuoteSummary[],
  invoices: InvoiceSummary[]
): TimelineEvent[] {
  const events: TimelineEvent[] = []

  for (const r of requests) {
    events.push({ kind: 'demande_creee', label: 'Demande créée', date: r.createdAt })
    if (r.pennylaneCustomerSyncedAt) {
      events.push({ kind: 'sync_pennylane', label: 'Synchronisation Pennylane', date: r.pennylaneCustomerSyncedAt })
    }
  }

  for (const q of quotes) {
    if (q.createdAt) {
      events.push({ kind: 'devis_cree', label: 'Devis créé', date: q.createdAt, detail: q.number ?? `#${q.id}` })
    }
    if (q.status === 'accepted' && q.updatedAt) {
      events.push({ kind: 'devis_accepte', label: 'Devis accepté', date: q.updatedAt, detail: q.number ?? `#${q.id}`, approximate: true })
    }
  }

  for (const inv of invoices) {
    if (inv.date) {
      events.push({ kind: 'facture_creee', label: 'Facture créée', date: inv.date, detail: inv.number ?? `#${inv.id}` })
    }
    if (inv.displayStatus === 'paid' && (inv.updatedAt || inv.date)) {
      // Pennylane ne fournit pas de date de paiement dédiée (confirmé) —
      // `updated_at` (dernière modification de la facture) est la donnée
      // réelle la plus proche disponible, jamais une date inventée.
      events.push({ kind: 'facture_payee', label: 'Facture payée', date: inv.updatedAt ?? inv.date!, detail: inv.number ?? `#${inv.id}`, approximate: true })
    }
  }

  return events
    .filter((e) => e.date)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

export const TIMELINE_ICON_KIND: Record<string, string> = {
  demande_creee: 'request',
  sync_pennylane: 'sync',
  devis_cree: 'quote',
  devis_accepte: 'check',
  facture_creee: 'invoice',
  facture_payee: 'paid',
}
