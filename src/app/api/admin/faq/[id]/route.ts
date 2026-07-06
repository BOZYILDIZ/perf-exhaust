import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured, getDb } from "@/lib/db";
import { faqItemSchema, sanitizeStrings } from "@/lib/admin-validation";
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
    const parsed = faqItemSchema.safeParse(sanitizeStrings(await req.json()));
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ error: `${first.path.join(".")} : ${first.message}` }, { status: 400 });
    }
    const d = parsed.data;
    const db = getDb();
    const exists = await db.fAQItem.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Question introuvable" }, { status: 404 });

    await db.fAQItem.update({ where: { id }, data: { ...d, category: d.category || null } });
    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/admin/faq PUT]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const denied = await guard(req);
    if (denied) return denied;
    const { id } = await ctx.params;
    const db = getDb();
    const exists = await db.fAQItem.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Question introuvable" }, { status: 404 });
    await db.fAQItem.delete({ where: { id } });
    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/admin/faq DELETE]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
