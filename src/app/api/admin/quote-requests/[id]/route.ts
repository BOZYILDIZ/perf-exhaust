import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured, getDb } from "@/lib/db";
import { quoteRequestUpdateSchema, sanitizeStrings } from "@/lib/admin-validation";

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

/** Changement de statut et/ou mise à jour des notes internes. */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const denied = await guard(req);
    if (denied) return denied;
    const { id } = await ctx.params;
    const parsed = quoteRequestUpdateSchema.safeParse(sanitizeStrings(await req.json()));
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ error: `${first.path.join(".")} : ${first.message}` }, { status: 400 });
    }
    const db = getDb();
    const exists = await db.quoteRequest.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });

    await db.quoteRequest.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/admin/quote-requests PATCH]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

/** Suppression définitive (l'archivage se fait via PATCH status=archived). */
export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const denied = await guard(req);
    if (denied) return denied;
    const { id } = await ctx.params;
    const db = getDb();
    const exists = await db.quoteRequest.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    await db.quoteRequest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/admin/quote-requests DELETE]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
