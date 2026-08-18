import { z } from 'zod'
import { ALLOWED_PHOTO_MIME_TYPES, MAX_PHOTO_SIZE_BYTES } from '@/lib/vehicle-photo-slots'

/**
 * Photos avant/après intervention (Appointment.photosAvant/photosApres) —
 * même principe que VehiclePhoto (src/lib/vehicle-photo-slots.ts) : jamais
 * l'image elle-même en base, uniquement ses métadonnées (URL Vercel Blob).
 * Contrairement à VehiclePhoto, aucun "slot" fixe ici — une galerie libre par
 * catégorie (avant/après), voir addWorkshopPhoto/removeWorkshopPhoto.
 */

export type WorkshopPhotoCategory = 'avant' | 'apres'
export const WORKSHOP_PHOTO_CATEGORIES: readonly WorkshopPhotoCategory[] = ['avant', 'apres']

/** Généreux mais borné — évite une galerie illimitée sans jamais gêner un usage réel. */
export const MAX_WORKSHOP_PHOTOS_PER_CATEGORY = 12

export interface WorkshopPhoto {
  url: string
  name: string
  size: number
  mimeType: (typeof ALLOWED_PHOTO_MIME_TYPES)[number]
}

export const workshopPhotoMetadataSchema = z.object({
  url: z.string().url(),
  name: z.string().max(200),
  size: z.number().positive().max(MAX_PHOTO_SIZE_BYTES),
  mimeType: z.enum(ALLOWED_PHOTO_MIME_TYPES),
})

export class WorkshopPhotoLimitError extends Error {
  constructor() {
    super(`Limite de ${MAX_WORKSHOP_PHOTOS_PER_CATEGORY} photos atteinte pour cette catégorie`)
    this.name = 'WorkshopPhotoLimitError'
  }
}

/** Ajoute une photo — lève WorkshopPhotoLimitError si la catégorie est déjà pleine (jamais un ajout silencieusement refusé). */
export function addWorkshopPhoto(photos: WorkshopPhoto[], photo: WorkshopPhoto): WorkshopPhoto[] {
  if (photos.length >= MAX_WORKSHOP_PHOTOS_PER_CATEGORY) throw new WorkshopPhotoLimitError()
  return [...photos, photo]
}

/** Retire une photo par URL — idempotent (aucune erreur si l'URL est déjà absente, ex. double-clic sur "supprimer"). */
export function removeWorkshopPhoto(photos: WorkshopPhoto[], url: string): WorkshopPhoto[] {
  return photos.filter((p) => p.url !== url)
}
