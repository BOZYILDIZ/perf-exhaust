/**
 * Tests déterministes des règles pures du workflow atelier — aucun accès
 * DB/réseau. Couvre en particulier les exigences explicites de la Phase C :
 * jamais de recul d'un dossier commercial déjà avancé, jamais de réactivation
 * automatique d'un dossier REFUSE/ARCHIVE, résolution correcte de
 * l'immatriculation canonique.
 *
 *   npx tsx src/lib/agenda/workshop-status.test.ts
 */
import {
  nextWorkshopStatus,
  computeForwardMirror,
  computeCorrectionMirror,
  resolveAppointmentLicensePlate,
} from './workshop-status'

let passed = 0
let failed = 0
function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++
    console.log(`PASS — ${name}`)
  } else {
    failed++
    console.log(`FAIL — ${name}${detail ? ' :: ' + detail : ''}`)
  }
}

// ===== nextWorkshopStatus =====

check('null (pas encore arrivé) → VEHICULE_ARRIVE', nextWorkshopStatus(null) === 'VEHICULE_ARRIVE')
check('VEHICULE_ARRIVE → EN_INTERVENTION', nextWorkshopStatus('VEHICULE_ARRIVE') === 'EN_INTERVENTION')
check('EN_INTERVENTION → TERMINE', nextWorkshopStatus('EN_INTERVENTION') === 'TERMINE')
check('TERMINE → RESTITUE', nextWorkshopStatus('TERMINE') === 'RESTITUE')
check('RESTITUE → null (fin de la progression)', nextWorkshopStatus('RESTITUE') === null)

// ===== computeForwardMirror — progression normale =====

check(
  'ACCEPTE + VEHICULE_ARRIVE → VEHICULE_ARRIVE (avance)',
  computeForwardMirror('ACCEPTE', 'VEHICULE_ARRIVE') === 'VEHICULE_ARRIVE'
)
check(
  'RDV_PLANIFIE + VEHICULE_ARRIVE → VEHICULE_ARRIVE (avance)',
  computeForwardMirror('RDV_PLANIFIE', 'VEHICULE_ARRIVE') === 'VEHICULE_ARRIVE'
)
check(
  'VEHICULE_ARRIVE + EN_INTERVENTION → EN_INTERVENTION (avance)',
  computeForwardMirror('VEHICULE_ARRIVE', 'EN_INTERVENTION') === 'EN_INTERVENTION'
)
check(
  'EN_INTERVENTION + TERMINE → TERMINE (avance)',
  computeForwardMirror('EN_INTERVENTION', 'TERMINE') === 'TERMINE'
)
check(
  'TERMINE + RESTITUE → RESTITUE (avance)',
  computeForwardMirror('TERMINE', 'RESTITUE') === 'RESTITUE'
)

// ===== computeForwardMirror — jamais de recul =====

check(
  'TERMINE + VEHICULE_ARRIVE → null (jamais de recul, dossier déjà plus avancé)',
  computeForwardMirror('TERMINE', 'VEHICULE_ARRIVE') === null
)
check(
  'RESTITUE + EN_INTERVENTION → null (jamais de recul)',
  computeForwardMirror('RESTITUE', 'EN_INTERVENTION') === null
)
check(
  'EN_INTERVENTION + VEHICULE_ARRIVE → null (jamais de recul, même une seule étape)',
  computeForwardMirror('EN_INTERVENTION', 'VEHICULE_ARRIVE') === null
)
check(
  'même statut (idempotence) → null (pas un "recul" mais pas un changement non plus)',
  computeForwardMirror('EN_INTERVENTION', 'EN_INTERVENTION') === null
)
check(
  'dossier commercial déjà très avancé (RESTITUE) + tentative VEHICULE_ARRIVE → null',
  computeForwardMirror('RESTITUE', 'VEHICULE_ARRIVE') === null
)

// ===== computeForwardMirror — dossiers protégés =====

check(
  'dossier REFUSE + VEHICULE_ARRIVE → null (jamais réactivé automatiquement)',
  computeForwardMirror('REFUSE', 'VEHICULE_ARRIVE') === null
)
check(
  'dossier ARCHIVE + TERMINE → null (jamais réactivé automatiquement)',
  computeForwardMirror('ARCHIVE', 'TERMINE') === null
)

// ===== computeForwardMirror — garde défensive =====

check(
  'statut commercial inconnu → null (ne devine jamais)',
  computeForwardMirror('STATUT_INCONNU', 'VEHICULE_ARRIVE') === null
)

// ===== computeCorrectionMirror — corrections manuelles (peuvent reculer) =====

check(
  'correction : EN_INTERVENTION dossier TERMINE → recule vers EN_INTERVENTION (admin corrige une erreur)',
  computeCorrectionMirror('TERMINE', 'EN_INTERVENTION') === 'EN_INTERVENTION'
)
check(
  'correction : null (véhicule pas encore arrivé) dossier VEHICULE_ARRIVE → RDV_PLANIFIE',
  computeCorrectionMirror('VEHICULE_ARRIVE', null) === 'RDV_PLANIFIE'
)
check(
  'correction : RESTITUE dossier RESTITUE → idempotent, retourne RESTITUE',
  computeCorrectionMirror('RESTITUE', 'RESTITUE') === 'RESTITUE'
)

// ===== computeCorrectionMirror — dossiers protégés et hors périmètre =====

check(
  'correction sur dossier REFUSE → null (jamais touché, même en correction)',
  computeCorrectionMirror('REFUSE', 'VEHICULE_ARRIVE') === null
)
check(
  'correction sur dossier ARCHIVE → null (jamais touché, même en correction)',
  computeCorrectionMirror('ARCHIVE', null) === null
)
check(
  'correction sur un dossier qui n\'a pas encore de RDV (DEVIS_ENVOYE) → null (hors périmètre)',
  computeCorrectionMirror('DEVIS_ENVOYE', 'VEHICULE_ARRIVE') === null
)
check(
  'correction sur NOUVELLE (très en amont) → null (hors périmètre atelier)',
  computeCorrectionMirror('NOUVELLE', 'VEHICULE_ARRIVE') === null
)

// ===== resolveAppointmentLicensePlate =====

check(
  'RDV lié : QuoteRequest.licensePlate présent → canonique, priorité absolue',
  resolveAppointmentLicensePlate('AA-123-AA', 'BB-999-BB') === 'AA-123-AA'
)
check(
  'RDV lié : QuoteRequest.licensePlate absent, Appointment.licensePlate présent → repli sur Appointment',
  resolveAppointmentLicensePlate(null, 'BB-999-BB') === 'BB-999-BB'
)
check(
  'RDV manuel : uniquement Appointment.licensePlate → utilisé directement',
  resolveAppointmentLicensePlate(undefined, 'CC-777-CC') === 'CC-777-CC'
)
check(
  'aucune immatriculation renseignée nulle part → null',
  resolveAppointmentLicensePlate(null, null) === null
)
check(
  'QuoteRequest.licensePlate chaîne vide traitée comme "non renseigné" côté appelant, pas ce module — vérifie juste que null/undefined sont bien géré',
  resolveAppointmentLicensePlate(undefined, undefined) === null
)

console.log(`\n=== ${passed}/${passed + failed} tests réussis ===`)
if (failed > 0) process.exit(1)
