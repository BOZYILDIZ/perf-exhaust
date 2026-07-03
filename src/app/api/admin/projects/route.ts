import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured, getDb } from "@/lib/db";
import { projectSchema, sanitizeStrings } from "@/lib/admin-validation";
import { revalidatePath } from "next/cache";

function guardOrigin(req: NextRequest): boolean {
  // Protection CSRF : cookie SameSite=Lax + vérification d'origine sur les mutations
  const origin = req.headers.get("origin");
  if (!origin) return true; // requêtes same-origin sans header (fetch older)
  try {
    return new URL(origin).host === req.nextUrl.host;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    if (!isDbConfigured()) {
      return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });
    }
    const parsed = projectSchema.safeParse(sanitizeStrings(await req.json()));
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ error: `${first.path.join(".")} : ${first.message}` }, { status: 400 });
    }
    const d = parsed.data;
    const db = getDb();
    const exists = await db.project.findUnique({ where: { slug: d.slug }, select: { id: true } });
    if (exists) return NextResponse.json({ error: "Ce slug existe déjà" }, { status: 409 });

    const created = await db.project.create({
      data: {
        ...d,
        categorie: d.categorie || null,
        dureeProjet: d.dureeProjet || null,
        difficulte: d.difficulte || null,
        ctaCustom: d.ctaCustom || null,
        imagePrincipale: d.imagePrincipale || null,
        imageAlt: d.imageAlt || null,
        videoUrl: d.videoUrl || null,
        seoTitle: d.seoTitle || null,
        seoDescription: d.seoDescription || null,
        ogImage: d.ogImage || null,
        date: d.date || new Date().toISOString().slice(0, 10),
        publishedAt: d.status === "published" ? new Date() : null,
      },
    });
    revalidatePath("/realisations");
    revalidatePath("/");
    revalidatePath("/sitemap.xml");
    return NextResponse.json({ success: true, id: created.id, slug: created.slug });
  } catch (error) {
    console.error("[API/admin/projects POST]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
