import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getDb, isDbConfigured } from "@/lib/db";
import { ALLOWED_PHOTO_MIME_TYPES, MAX_PHOTO_SIZE_BYTES } from "@/lib/vehicle-photo-slots";
import {
  addWorkshopPhoto,
  removeWorkshopPhoto,
  WorkshopPhotoLimitError,
  WORKSHOP_PHOTO_CATEGORIES,
  type WorkshopPhoto,
  type WorkshopPhotoCategory,
} from "@/lib/agenda/workshop-photos";

type Ctx = { params: Promise<{ id: string }> };

function guardOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.nextUrl.host;
  } catch {
    return false;
  }
}

function categoryColumn(category: WorkshopPhotoCategory): "photosAvant" | "photosApres" {
  return category === "avant" ? "photosAvant" : "photosApres";
}

function parsePhotos(value: unknown): WorkshopPhoto[] {
  return Array.isArray(value) ? (value as WorkshopPhoto[]) : [];
}

/**
 * Ajoute une photo avant/après intervention — même garde que
 * /api/admin/upload (503 explicite si BLOB_READ_WRITE_TOKEN absent, jamais
 * de repli filesystem/base64, voir docs/MAINTENANCE.md). Admin uniquement :
 * pas de sniffing binaire ici (surface non publique), comme /api/admin/upload.
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "Stockage d'images non configuré : ajoutez BLOB_READ_WRITE_TOKEN (Vercel Blob) — voir docs/MAINTENANCE.md." },
        { status: 503 }
      );
    }

    const { id } = await ctx.params;
    const form = await req.formData();
    const file = form.get("file");
    const category = form.get("category");
    if (!(file instanceof File)) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    if (typeof category !== "string" || !WORKSHOP_PHOTO_CATEGORIES.includes(category as WorkshopPhotoCategory)) {
      return NextResponse.json({ error: "Catégorie invalide (avant/apres)" }, { status: 400 });
    }
    if (!ALLOWED_PHOTO_MIME_TYPES.includes(file.type as (typeof ALLOWED_PHOTO_MIME_TYPES)[number])) {
      return NextResponse.json({ error: "Format non supporté (JPEG, PNG ou WebP uniquement)" }, { status: 415 });
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      return NextResponse.json({ error: "Fichier trop volumineux (10 Mo maximum)" }, { status: 413 });
    }

    const db = getDb();
    const column = categoryColumn(category as WorkshopPhotoCategory);
    const appointment = await db.appointment.findUnique({ where: { id }, select: { photosAvant: true, photosApres: true } });
    if (!appointment) return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });

    const current = parsePhotos(column === "photosAvant" ? appointment.photosAvant : appointment.photosApres);

    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").slice(-80) || "photo";
    const blob = await put(`appointments/${id}/${category}/${Date.now()}-${safeName}`, file, {
      access: "public",
      contentType: file.type,
    });
    const photo: WorkshopPhoto = { url: blob.url, name: file.name.slice(0, 200), size: file.size, mimeType: file.type as WorkshopPhoto["mimeType"] };

    let updated: WorkshopPhoto[];
    try {
      updated = addWorkshopPhoto(current, photo);
    } catch (err) {
      if (err instanceof WorkshopPhotoLimitError) {
        // Le fichier est déjà envoyé sur Blob à ce stade — mieux vaut le
        // supprimer plutôt que laisser un blob orphelin jamais référencé.
        await del(blob.url).catch(() => undefined);
        return NextResponse.json({ error: err.message }, { status: 409 });
      }
      throw err;
    }

    await db.appointment.update({ where: { id }, data: { [column]: updated } });
    return NextResponse.json({ success: true, photos: updated });
  } catch (error) {
    console.error("[API/admin/appointments/[id]/photos POST]", error);
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}

/** Retrait d'une photo — best-effort sur la suppression Blob (jamais bloquant si le token est absent ou l'appel échoue). */
export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });

    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const { category, url } = body as { category?: string; url?: string };
    if (typeof category !== "string" || !WORKSHOP_PHOTO_CATEGORIES.includes(category as WorkshopPhotoCategory) || typeof url !== "string") {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }

    const db = getDb();
    const column = categoryColumn(category as WorkshopPhotoCategory);
    const appointment = await db.appointment.findUnique({ where: { id }, select: { photosAvant: true, photosApres: true } });
    if (!appointment) return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });

    const current = parsePhotos(column === "photosAvant" ? appointment.photosAvant : appointment.photosApres);
    const updated = removeWorkshopPhoto(current, url);
    await db.appointment.update({ where: { id }, data: { [column]: updated } });

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await del(url).catch(() => undefined);
    }

    return NextResponse.json({ success: true, photos: updated });
  } catch (error) {
    console.error("[API/admin/appointments/[id]/photos DELETE]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
