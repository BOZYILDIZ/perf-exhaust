import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

/**
 * Upload d'images via Vercel Blob (BLOB_READ_WRITE_TOKEN).
 * Sans token configuré : 503 avec message clair — l'admin reste utilisable
 * (les champs URL acceptent une adresse externe en attendant).
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "Stockage d'images non configuré : ajoutez BLOB_READ_WRITE_TOKEN (Vercel Blob) — voir docs/MAINTENANCE.md." },
        { status: 503 }
      );
    }
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: "Format non supporté (JPEG, PNG ou WebP uniquement)" }, { status: 415 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Fichier trop volumineux (5 Mo maximum)" }, { status: 413 });
    }
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").slice(-80);
    const blob = await put(`projects/${Date.now()}-${safeName}`, file, {
      access: "public",
      contentType: file.type,
    });
    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    console.error("[API/admin/upload]", error);
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}
