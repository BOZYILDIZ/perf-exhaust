/**
 * Tests déterministes des règles pures des photos atelier — aucun accès
 * DB/réseau/stockage. Couvre l'ajout/retrait et la limite par catégorie.
 *
 *   npx tsx src/lib/agenda/workshop-photos.test.ts
 */
import { addWorkshopPhoto, removeWorkshopPhoto, WorkshopPhotoLimitError, MAX_WORKSHOP_PHOTOS_PER_CATEGORY, type WorkshopPhoto } from './workshop-photos'

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

const photo = (n: number): WorkshopPhoto => ({ url: `https://blob.example/photo-${n}.jpg`, name: `photo-${n}.jpg`, size: 1000, mimeType: 'image/jpeg' })

check('ajout sur une liste vide → une photo', addWorkshopPhoto([], photo(1)).length === 1)
check('ajout préserve les photos existantes (jamais un remplacement)', addWorkshopPhoto([photo(1)], photo(2)).length === 2)

check('retrait par URL → filtre uniquement la photo visée', (() => {
  const result = removeWorkshopPhoto([photo(1), photo(2)], photo(1).url)
  return result.length === 1 && result[0].url === photo(2).url
})())
check('retrait d\'une URL absente → idempotent, aucune erreur, liste inchangée', removeWorkshopPhoto([photo(1)], 'https://blob.example/absente.jpg').length === 1)

check('limite par catégorie : ajout refusé au-delà de MAX_WORKSHOP_PHOTOS_PER_CATEGORY', (() => {
  const full = Array.from({ length: MAX_WORKSHOP_PHOTOS_PER_CATEGORY }, (_, i) => photo(i))
  try {
    addWorkshopPhoto(full, photo(999))
    return false
  } catch (err) {
    return err instanceof WorkshopPhotoLimitError
  }
})())
check('juste en dessous de la limite → ajout encore accepté', (() => {
  const almostFull = Array.from({ length: MAX_WORKSHOP_PHOTOS_PER_CATEGORY - 1 }, (_, i) => photo(i))
  return addWorkshopPhoto(almostFull, photo(999)).length === MAX_WORKSHOP_PHOTOS_PER_CATEGORY
})())

console.log(`\n=== ${passed}/${passed + failed} tests réussis ===`)
if (failed > 0) process.exit(1)
