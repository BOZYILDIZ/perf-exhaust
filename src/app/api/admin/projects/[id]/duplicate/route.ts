import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured, getDb } from "@/lib/db";

/**
 * Duplique une réalisation en BROUILLON (slug suffixé -copie, -copie-2...).
 * Gain de saisie majeur pour les projets similaires.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const origin = req.headers.get("origin");
    if (origin && new URL(origin).host !== req.nextUrl.host) {
      return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    }
    if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });

    const { id } = await ctx.params;
    const db = getDb();
    const source = await db.project.findUnique({ where: { id } });
    if (!source) return NextResponse.json({ error: "Réalisation introuvable" }, { status: 404 });

    let slug = `${source.slug}-copie`;
    for (let n = 2; await db.project.findUnique({ where: { slug }, select: { id: true } }); n++) {
      slug = `${source.slug}-copie-${n}`;
    }

    const data = { ...source } as Partial<typeof source>;
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;
    const copy = await db.project.create({
      data: {
        ...(data as Omit<typeof source, "id" | "createdAt" | "updatedAt">),
        slug,
        status: "draft",
        publishedAt: null,
        featured: false,
        vehicule: `${source.vehicule} (copie)`,
        tags: data.tags ?? [],
        filterTags: data.filterTags ?? [],
        galerie: data.galerie ?? [],
      },
    });
    return NextResponse.json({ success: true, id: copy.id, slug: copy.slug });
  } catch (error) {
    console.error("[API/admin/duplicate]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
