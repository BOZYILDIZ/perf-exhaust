import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured, getDb } from "@/lib/db";
import { projectSchema, sanitizeStrings } from "@/lib/admin-validation";
import { revalidatePath } from "next/cache";

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

async function guard(req: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
  if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });
  return null;
}

function revalidatePublic(slug: string) {
  revalidatePath("/realisations");
  revalidatePath(`/realisations/${slug}`);
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const denied = await guard(req);
    if (denied) return denied;
    const { id } = await ctx.params;
    const parsed = projectSchema.safeParse(sanitizeStrings(await req.json()));
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ error: `${first.path.join(".")} : ${first.message}` }, { status: 400 });
    }
    const d = parsed.data;
    const db = getDb();
    const current = await db.project.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "Réalisation introuvable" }, { status: 404 });
    const slugTaken = await db.project.findFirst({ where: { slug: d.slug, NOT: { id } }, select: { id: true } });
    if (slugTaken) return NextResponse.json({ error: "Ce slug existe déjà" }, { status: 409 });

    await db.project.update({
      where: { id },
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
        date: d.date || current.date,
        publishedAt:
          d.status === "published"
            ? current.publishedAt ?? new Date()
            : null,
      },
    });
    revalidatePublic(current.slug);
    if (current.slug !== d.slug) revalidatePublic(d.slug);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/admin/projects PUT]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const denied = await guard(req);
    if (denied) return denied;
    const { id } = await ctx.params;
    const db = getDb();
    const current = await db.project.findUnique({ where: { id }, select: { slug: true } });
    if (!current) return NextResponse.json({ error: "Réalisation introuvable" }, { status: 404 });
    await db.project.delete({ where: { id } });
    revalidatePublic(current.slug);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/admin/projects DELETE]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
