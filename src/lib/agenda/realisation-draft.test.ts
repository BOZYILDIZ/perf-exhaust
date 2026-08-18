/**
 * Tests déterministes du prefill de brouillon Réalisation — aucun accès
 * DB/réseau. Couvre : RDV lié (marque/modèle/année connus) vs RDV manuel
 * (repli), année invalide/absente, mapping des photos avant/après.
 *
 *   npx tsx src/lib/agenda/realisation-draft.test.ts
 */
import { buildRealisationDraftFromAppointment, type RealisationDraftSource } from './realisation-draft'
import type { WorkshopPhoto } from './workshop-photos'

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

const NOW = new Date('2026-08-18T10:00:00.000Z')
const photo = (n: number): WorkshopPhoto => ({ url: `https://blob.example/p${n}.jpg`, name: `p${n}.jpg`, size: 1000, mimeType: 'image/jpeg' })

const LINKED: RealisationDraftSource = {
  vehicle: 'BMW 320d (2019)', marque: 'BMW', modele: '320d', annee: '2019', motorisation: '2.0 diesel',
  photosAvant: [photo(1), photo(2)], photosApres: [photo(3)],
}

const MANUAL: RealisationDraftSource = {
  vehicle: 'Golf 7 GTI', marque: null, modele: null, annee: null, motorisation: null,
  photosAvant: [], photosApres: [],
}

check('RDV lié : marque/modèle/année repris tels quels', (() => {
  const d = buildRealisationDraftFromAppointment(LINKED, NOW)
  return d.marque === 'BMW' && d.modele === '320d' && d.annee === '2019'
})())

check('RDV manuel : marque absente → repli sur le libellé véhicule complet', buildRealisationDraftFromAppointment(MANUAL, NOW).marque === 'Golf 7 GTI')
check('RDV manuel : modèle absent → placeholder explicite, jamais vide', buildRealisationDraftFromAppointment(MANUAL, NOW).modele === 'Modèle à préciser')
check('RDV manuel : année absente → repli sur l\'année courante (jamais une chaîne invalide qui casserait la validation du formulaire)', buildRealisationDraftFromAppointment(MANUAL, NOW).annee === '2026')

check('année mal formée (ex. saisie libre invalide) → repli sur l\'année courante plutôt qu\'une valeur invalide', (() => {
  const d = buildRealisationDraftFromAppointment({ ...LINKED, annee: 'inconnue' }, NOW)
  return d.annee === '2026'
})())

check('toujours créé en brouillon, jamais publié automatiquement', buildRealisationDraftFromAppointment(LINKED, NOW).status === 'draft')
check('featured toujours false par défaut (jamais mis en avant sans action admin explicite)', buildRealisationDraftFromAppointment(LINKED, NOW).featured === false)

check('galerie : photos avant puis après, dans l\'ordre, avec le bon type', (() => {
  const g = buildRealisationDraftFromAppointment(LINKED, NOW).galerie
  return g.length === 3 && g[0].type === 'avant' && g[1].type === 'avant' && g[2].type === 'apres' && g[0].src === photo(1).url
})())
check('galerie : alt jamais vide (bloquerait la sauvegarde côté formulaire existant)', buildRealisationDraftFromAppointment(LINKED, NOW).galerie.every((g) => g.alt.length > 0))
check('aucune photo → galerie vide, pas d\'erreur', buildRealisationDraftFromAppointment(MANUAL, NOW).galerie.length === 0)

check('description/descriptionComplete toujours non vides (satisfont la validation min 10 caractères du formulaire existant)', (() => {
  const d = buildRealisationDraftFromAppointment(MANUAL, NOW)
  return d.description.length >= 10 && d.descriptionComplete.length >= 10
})())

console.log(`\n=== ${passed}/${passed + failed} tests réussis ===`)
if (failed > 0) process.exit(1)
