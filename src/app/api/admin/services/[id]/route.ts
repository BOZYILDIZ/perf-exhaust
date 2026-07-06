import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured, getDb } from "@/lib/db";
import { serviceSchema, sanitizeStrings } from "@/lib/admin-validation";
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

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const denied = await guard(req);
    if (denied) return denied;
    const { id } = await ctx.params;
    const parsed = serviceSchema.safeParse(sanitizeStrings(await req.json()));
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ error: `${first.path.join(".")} : ${first.message}` }, { status: 400 });
    }
    const d = parsed.data;
    const db = getDb();
    const current = await db.service.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "Prestation introuvable" }, { status: 404 });
    const slugTaken = await db.service.findFirst({ where: { slug: d.slug, NOT: { id } }, select: { id: true } });
    if (slugTaken) return NextResponse.json({ error: "Ce slug existe déjà" }, { status: 409 });

    await db.service.update({
      where: { id },
      data: { ...d, seoTitle: d.seoTitle || null, seoDescription: d.seoDescription || null },
    });
    revalidatePath("/services");
    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/admin/services PUT]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const denied = await guard(req);
    if (denied) return denied;
    const { id } = await ctx.params;
    const db = getDb();
    const exists = await db.service.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Prestation introuvable" }, { status: 404 });
    await db.service.delete({ where: { id } });
    revalidatePath("/services");
    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/admin/services DELETE]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
