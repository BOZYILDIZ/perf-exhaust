import { z } from "zod";

/**
 * Emplacements photo fixes du formulaire de devis — un seul fichier par
 * emplacement (jamais une galerie libre), ce qui plafonne naturellement à
 * 5 images sans logique de comptage séparée. Partagé entre le formulaire
 * public (upload), l'API (validation) et le CRM admin (affichage).
 */
export const VEHICLE_PHOTO_SLOTS = [
  {
    key: "vue_arriere",
    title: "Vue arrière complète",
    description: "Montrez l'arrière complet du véhicule.",
    required: true,
  },
  {
    key: "sorties_echappement",
    title: "Sorties d'échappement",
    description: "Prenez une photo rapprochée des sorties d'échappement.",
    required: true,
  },
  {
    key: "diffuseur",
    title: "Diffuseur arrière",
    description: "Si votre véhicule possède un diffuseur, prenez-le en photo.",
    required: false,
  },
  {
    key: "vue_cote",
    title: "Vue de côté",
    description: "Une photo de profil peut nous aider à identifier certains éléments.",
    required: false,
  },
  {
    key: "photo_libre",
    title: "Photo libre",
    description: "Ajoutez toute autre photo qui pourrait être utile.",
    required: false,
  },
] as const;

export type VehiclePhotoSlotKey = (typeof VEHICLE_PHOTO_SLOTS)[number]["key"];

export const VEHICLE_PHOTO_SLOT_KEYS = VEHICLE_PHOTO_SLOTS.map((s) => s.key) as VehiclePhotoSlotKey[];

export function vehiclePhotoSlotTitle(key: string): string {
  return VEHICLE_PHOTO_SLOTS.find((s) => s.key === key)?.title ?? key;
}

export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo
export const ALLOWED_PHOTO_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_PHOTOS = VEHICLE_PHOTO_SLOTS.length;

/** Métadonnées d'une photo uploadée — jamais l'image elle-même en base, voir QuoteRequest.photos. */
export interface VehiclePhoto {
  slot: VehiclePhotoSlotKey;
  url: string;
  name: string;
  size: number;
  mimeType: (typeof ALLOWED_PHOTO_MIME_TYPES)[number];
}

/**
 * Schéma des métadonnées d'une photo déjà uploadée (jamais le fichier lui-même) —
 * partagé entre le formulaire client et la revalidation serveur dans
 * /api/rendez-vous : ne jamais faire confiance à la seule validation client
 * pour une route publique.
 */
export const vehiclePhotoMetadataSchema = z.object({
  slot: z.enum(VEHICLE_PHOTO_SLOT_KEYS as [VehiclePhotoSlotKey, ...VehiclePhotoSlotKey[]]),
  url: z.string().url(),
  name: z.string().max(200),
  size: z.number().positive().max(MAX_PHOTO_SIZE_BYTES),
  mimeType: z.enum(ALLOWED_PHOTO_MIME_TYPES),
});
