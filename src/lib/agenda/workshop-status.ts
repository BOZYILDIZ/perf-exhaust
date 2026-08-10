/**
 * Règles pures du workflow atelier — aucun accès DB/réseau ici, uniquement
 * des fonctions de calcul testables sans base de données (voir
 * workshop-status.test.ts). C'est délibéré : la Phase C ne peut pas encore
 * s'appuyer sur des tests contre une vraie base (migration non appliquée à
 * la base Neon partagée), donc toute la logique de décision qui PEUT être
 * pure DOIT l'être, pour rester vérifiable dès maintenant.
 *
 * Séparation stricte des deux workflows (jamais mélangés) :
 *  - QuoteRequest.status = pipeline COMMERCIAL (source de vérité : la demande).
 *  - Appointment.workshopStatus = progression PHYSIQUE du véhicule dans
 *    l'atelier (source de vérité : le rendez-vous). Fonctionne identiquement
 *    pour un RDV manuel (quoteRequestId null) — c'est justement pour ça que ce
 *    champ vit sur Appointment et non sur QuoteRequest.
 *
 * Le miroir Appointment → QuoteRequest est TOUJOURS à sens unique. Aucune
 * fonction ici ne lit jamais workshopStatus à partir de QuoteRequest.status.
 */

export type WorkshopStatus = 'VEHICULE_ARRIVE' | 'EN_INTERVENTION' | 'TERMINE' | 'RESTITUE'

export const WORKSHOP_STATUS_ORDER: readonly WorkshopStatus[] = ['VEHICULE_ARRIVE', 'EN_INTERVENTION', 'TERMINE', 'RESTITUE']

export const WORKSHOP_STATUS_LABELS: Record<WorkshopStatus, string> = {
  VEHICULE_ARRIVE: 'Véhicule arrivé',
  EN_INTERVENTION: 'En intervention',
  TERMINE: 'Terminé / Véhicule prêt',
  RESTITUE: 'Véhicule restitué',
}

/** Libellé du gros bouton d'action contextuel — la SEULE action mise en avant, jamais un choix parmi plusieurs. */
export const WORKSHOP_ACTION_LABELS: Record<'ARRIVAL' | 'START' | 'COMPLETE' | 'RETURN', string> = {
  ARRIVAL: 'Véhicule arrivé',
  START: "Démarrer l'intervention",
  COMPLETE: "Terminer l'intervention",
  RETURN: 'Véhicule restitué',
}

/**
 * Ordre complet du pipeline commercial pour comparaison de progression —
 * REFUSE et ARCHIVE en sont volontairement exclus (statuts terminaux/
 * branches, pas des étapes linéaires comparables par index).
 */
const PIPELINE_ORDER = [
  'NOUVELLE', 'A_CONTACTER', 'DEVIS_EN_PREPARATION', 'DEVIS_ENVOYE', 'EN_ATTENTE_CLIENT',
  'ACCEPTE', 'RDV_PLANIFIE', 'VEHICULE_ARRIVE', 'EN_INTERVENTION', 'TERMINE', 'RESTITUE',
] as const

/** Dossiers clos qu'aucune action atelier ne doit jamais réactiver automatiquement. */
const PROTECTED_QUOTE_STATUSES = new Set(['REFUSE', 'ARCHIVE'])

/** Portion du pipeline commercial qu'une CORRECTION de statut atelier peut légitimement toucher. */
const WORKSHOP_TAIL_QUOTE_STATUSES = new Set(['RDV_PLANIFIE', 'VEHICULE_ARRIVE', 'EN_INTERVENTION', 'TERMINE', 'RESTITUE'])

/** Étape atelier suivante — null si `current` est déjà RESTITUE (fin de la progression normale). */
export function nextWorkshopStatus(current: WorkshopStatus | null): WorkshopStatus | null {
  if (current === null) return 'VEHICULE_ARRIVE'
  const idx = WORKSHOP_STATUS_ORDER.indexOf(current)
  if (idx === -1 || idx === WORKSHOP_STATUS_ORDER.length - 1) return null
  return WORKSHOP_STATUS_ORDER[idx + 1]
}

/**
 * Calcule le nouveau QuoteRequest.status suite à une PROGRESSION atelier
 * normale (jamais une correction manuelle) — ou `null` si rien ne doit
 * changer. Règles explicites et testables :
 *
 *  1. Jamais si le dossier est REFUSE ou ARCHIVE — aucune action atelier ne
 *     réactive automatiquement un dossier clos.
 *  2. Jamais un recul : le nouveau statut n'est appliqué que si sa position
 *     dans PIPELINE_ORDER est STRICTEMENT après la position actuelle. Une
 *     progression atelier ne peut donc jamais faire "reculer" un dossier
 *     déjà plus avancé (ex. si un admin a déjà mis TERMINE manuellement,
 *     re-cliquer "Véhicule arrivé" par erreur sur le RDV ne le repasserait
 *     jamais en arrière).
 *  3. Jamais si l'un des deux statuts est absent de PIPELINE_ORDER (garde
 *     défensive — ne devrait pas arriver avec les valeurs actuelles de
 *     l'enum, mais on ne devine jamais silencieusement).
 */
export function computeForwardMirror(currentQuoteStatus: string, workshopStatus: WorkshopStatus): string | null {
  if (PROTECTED_QUOTE_STATUSES.has(currentQuoteStatus)) return null
  const currentIdx = PIPELINE_ORDER.indexOf(currentQuoteStatus as (typeof PIPELINE_ORDER)[number])
  const targetIdx = PIPELINE_ORDER.indexOf(workshopStatus)
  if (currentIdx === -1 || targetIdx === -1) return null
  if (targetIdx <= currentIdx) return null
  return workshopStatus
}

/**
 * Calcule le nouveau QuoteRequest.status suite à une CORRECTION manuelle du
 * statut atelier (l'admin corrige une erreur de manip — peut donc reculer,
 * à la différence de computeForwardMirror) — ou `null` si rien ne doit
 * changer. Règles explicites et testables :
 *
 *  1. Jamais si le dossier est REFUSE ou ARCHIVE.
 *  2. Jamais si le dossier n'est pas déjà dans la portion "atelier" du
 *     pipeline (RDV_PLANIFIE et après) — une correction du statut atelier
 *     ne doit jamais toucher un dossier qui n'a pas encore de rendez-vous
 *     planifié (ce cas ne devrait de toute façon jamais se produire, un
 *     workshopStatus n'existant que sur un Appointment déjà créé).
 *  3. `newWorkshopStatus` null (correction "en fait le véhicule n'est pas
 *     encore arrivé") mappe vers RDV_PLANIFIE, l'étape juste avant.
 */
export function computeCorrectionMirror(currentQuoteStatus: string, newWorkshopStatus: WorkshopStatus | null): string | null {
  if (PROTECTED_QUOTE_STATUSES.has(currentQuoteStatus)) return null
  if (!WORKSHOP_TAIL_QUOTE_STATUSES.has(currentQuoteStatus)) return null
  return newWorkshopStatus ?? 'RDV_PLANIFIE'
}

/**
 * Immatriculation à afficher pour un rendez-vous — QuoteRequest.licensePlate
 * est CANONIQUE dès qu'une demande est liée (même principe que motorisation/
 * rearDiffuser/customerAddress, voir prisma/schema.prisma § Appointment) ;
 * Appointment.licensePlate n'est lu que pour un rendez-vous manuel.
 */
export function resolveAppointmentLicensePlate(
  quoteRequestLicensePlate: string | null | undefined,
  appointmentLicensePlate: string | null | undefined
): string | null {
  return quoteRequestLicensePlate ?? appointmentLicensePlate ?? null
}

/**
 * Délai au-delà duquel un verrou "essai en cours" est considéré abandonné
 * (crash serveur en plein essai, jamais libéré normalement) et peut être
 * repris par un nouvel essai — 2 minutes, largement au-dessus de la durée
 * réelle d'un appel Resend (quelques secondes). Seul cas où ce délai entre
 * en jeu ; un échec normal libère le verrou immédiatement (voir
 * attemptVehicleReadyNotification() dans workshop-actions.ts).
 */
export const STALE_NOTIFICATION_CLAIM_MS = 2 * 60 * 1000

export interface VehicleReadyNotificationClaimState {
  vehicleReadyNotifiedAt: Date | null
  vehicleReadyNotificationInProgress: boolean
  vehicleReadyNotificationLastAttemptAt: Date | null
}

/**
 * Un nouvel essai d'envoi peut être tenté si : jamais réussi, ET (aucun essai
 * en cours OU l'essai en cours date de plus de STALE_NOTIFICATION_CLAIM_MS —
 * récupération après un crash serveur qui n'aurait jamais complété).
 *
 * Cette fonction documente et teste la RÈGLE ; l'unicité réelle contre une
 * vraie concurrence (double-clic, deux requêtes simultanées) vient de
 * l'atomicité de la requête SQL équivalente (un seul `updateMany` avec ce
 * même WHERE, voir workshop-actions.ts) — jamais d'un SELECT suivi d'un
 * UPDATE séparés, qui laisserait une fenêtre de course entre les deux.
 */
export function canAttemptVehicleReadyNotification(state: VehicleReadyNotificationClaimState, now: Date): boolean {
  if (state.vehicleReadyNotifiedAt !== null) return false
  if (!state.vehicleReadyNotificationInProgress) return true
  if (!state.vehicleReadyNotificationLastAttemptAt) return true
  return now.getTime() - state.vehicleReadyNotificationLastAttemptAt.getTime() > STALE_NOTIFICATION_CLAIM_MS
}
