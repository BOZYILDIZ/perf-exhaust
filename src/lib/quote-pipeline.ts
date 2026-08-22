import { QUOTE_STATUSES } from '@/lib/admin-validation'

export type QuoteStatus = (typeof QUOTE_STATUSES)[number]

/**
 * Source unique de vérité pour l'affichage du pipeline commercial (labels,
 * couleurs, filtres rapides, statut suivant suggéré). Toute page qui affiche
 * ou filtre par QuoteRequest.status importe ce module plutôt que de redéfinir
 * ses propres libellés — évite la dérive entre /admin/devis, la fiche détail
 * et le dashboard.
 */
export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  NOUVELLE: 'Nouvelle',
  A_CONTACTER: 'À contacter',
  DEVIS_EN_PREPARATION: 'Devis en préparation',
  DEVIS_ENVOYE: 'Devis envoyé',
  EN_ATTENTE_CLIENT: 'En attente client',
  ACCEPTE: 'Acceptée',
  REFUSE: 'Refusée',
  RDV_PLANIFIE: 'RDV planifié',
  VEHICULE_ARRIVE: 'Véhicule arrivé',
  EN_INTERVENTION: 'En intervention',
  TERMINE: 'Terminée',
  RESTITUE: 'Véhicule restitué',
  ARCHIVE: 'Archivée',
}

export const QUOTE_STATUS_STYLES: Record<QuoteStatus, string> = {
  NOUVELLE: 'text-brand-400 bg-brand-500/10',
  A_CONTACTER: 'text-blue-300 bg-blue-500/10',
  DEVIS_EN_PREPARATION: 'text-yellow-400 bg-yellow-500/10',
  DEVIS_ENVOYE: 'text-yellow-400 bg-yellow-500/10',
  EN_ATTENTE_CLIENT: 'text-orange-300 bg-orange-500/10',
  ACCEPTE: 'text-green-400 bg-green-500/10',
  REFUSE: 'text-red-400 bg-red-500/10',
  RDV_PLANIFIE: 'text-purple-300 bg-purple-500/10',
  VEHICULE_ARRIVE: 'text-purple-300 bg-purple-500/10',
  EN_INTERVENTION: 'text-purple-300 bg-purple-500/10',
  TERMINE: 'text-green-400 bg-green-500/10',
  RESTITUE: 'text-gray-300 bg-white/5',
  ARCHIVE: 'text-gray-500 bg-white/5',
}

/** Statut commercial suivant "logique" — UI guidée seulement, jamais imposé par l'API. */
export const QUOTE_STATUS_NEXT: Partial<Record<QuoteStatus, QuoteStatus>> = {
  NOUVELLE: 'A_CONTACTER',
  A_CONTACTER: 'DEVIS_EN_PREPARATION',
  DEVIS_EN_PREPARATION: 'DEVIS_ENVOYE',
  DEVIS_ENVOYE: 'EN_ATTENTE_CLIENT',
  EN_ATTENTE_CLIENT: 'ACCEPTE',
  ACCEPTE: 'RDV_PLANIFIE',
  RDV_PLANIFIE: 'VEHICULE_ARRIVE',
  VEHICULE_ARRIVE: 'EN_INTERVENTION',
  EN_INTERVENTION: 'TERMINE',
  TERMINE: 'RESTITUE',
}

/** Statuts atteignables par une action atelier (voir Appointment.workshopStatus) — jamais choisis via le menu libre. */
export const WORKSHOP_DRIVEN_STATUSES: readonly QuoteStatus[] = ['VEHICULE_ARRIVE', 'EN_INTERVENTION', 'TERMINE', 'RESTITUE']

/** Filtres rapides de /admin/devis — regroupent les 13 statuts détaillés en 7 vues métier. */
export const QUOTE_QUICK_FILTERS: { key: string; label: string; statuses: QuoteStatus[] }[] = [
  { key: 'nouvelles', label: 'Nouvelles', statuses: ['NOUVELLE'] },
  { key: 'a_contacter', label: 'À contacter', statuses: ['A_CONTACTER'] },
  { key: 'en_attente_client', label: 'En attente client', statuses: ['DEVIS_EN_PREPARATION', 'DEVIS_ENVOYE', 'EN_ATTENTE_CLIENT'] },
  { key: 'acceptees', label: 'Acceptées', statuses: ['ACCEPTE'] },
  { key: 'rdv_planifies', label: 'RDV planifiés', statuses: ['RDV_PLANIFIE', 'VEHICULE_ARRIVE', 'EN_INTERVENTION'] },
  { key: 'terminees', label: 'Terminées', statuses: ['TERMINE', 'RESTITUE'] },
  { key: 'refusees', label: 'Refusées', statuses: ['REFUSE'] },
]

/** true si une relance commerciale a du sens pour ce statut (voir src/lib/quote-followup.ts). */
export function isFollowupEligible(status: string): boolean {
  return status === 'DEVIS_ENVOYE'
}
