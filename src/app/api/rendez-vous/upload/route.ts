import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  ALLOWED_PHOTO_MIME_TYPES,
  MAX_PHOTO_SIZE_BYTES,
  VEHICLE_PHOTO_SLOT_KEYS,
} from "@/lib/vehicle-photo-slots";

/**
 * Upload public (non authentifié) des photos du véhicule jointes à une
 * demande de devis. Distinct de /api/admin/upload (réservé à l'admin) :
 * surface publique = validations renforcées (signature réelle du fichier
 * en plus du type MIME déclaré par le navigateur, rate-limit dédié,
 * préfixe de chemin Blob séparé des assets gérés par l'admin).
 */

/** Signatures binaires ("magic bytes") des formats acceptés — ne fait jamais confiance au seul `file.type` déclaré par le client. */
function sniffImageMimeType(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && // "RIFF"
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50 // "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    // Limite dédiée (distincte de /api/rendez-vous) : jusqu'à 5 photos
    // légitimes par demande ne doivent jamais être bloquées, tout en
    // bornant l'abus d'un point d'upload public non authentifié.
    if (!checkRateLimit(`upload:${getClientIp(req)}`, 20, 60_000)) {
      return NextResponse.json({ error: "Trop de requêtes. Attendez une minute." }, { status: 429 });
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: "Stockage d'images non configuré." }, { status: 503 });
    }

    const form = await req.formData();
    const file = form.get("file");
    const slot = form.get("slot");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    }
    if (typeof slot !== "string" || !VEHICLE_PHOTO_SLOT_KEYS.includes(slot as (typeof VEHICLE_PHOTO_SLOT_KEYS)[number])) {
      return NextResponse.json({ error: "Emplacement photo invalide" }, { status: 400 });
    }
    if (!ALLOWED_PHOTO_MIME_TYPES.includes(file.type as (typeof ALLOWED_PHOTO_MIME_TYPES)[number])) {
      return NextResponse.json({ error: "Format non supporté (JPG, PNG ou WebP uniquement)" }, { status: 415 });
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      return NextResponse.json({ error: "Fichier trop volumineux (10 Mo maximum)" }, { status: 413 });
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const sniffed = sniffImageMimeType(buffer);
    if (!sniffed || !ALLOWED_PHOTO_MIME_TYPES.includes(sniffed as (typeof ALLOWED_PHOTO_MIME_TYPES)[number])) {
      // Le type MIME déclaré par le navigateur peut être falsifié — on ne
      // fait confiance qu'à la signature binaire réelle du fichier.
      return NextResponse.json({ error: "Le contenu du fichier ne correspond pas à une image JPG, PNG ou WebP valide" }, { status: 415 });
    }

    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").slice(-80) || "photo";
    const blob = await put(`quote-requests/${Date.now()}-${slot}-${safeName}`, file, {
      access: "public",
      contentType: sniffed,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      name: file.name.slice(0, 200),
      size: file.size,
      mimeType: sniffed,
    });
  } catch (error) {
    console.error("[API/rendez-vous/upload]", error);
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}
