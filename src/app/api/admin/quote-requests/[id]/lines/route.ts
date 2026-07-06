import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured, getDb } from "@/lib/db";
import { quoteLinesUpdateSchema, sanitizeStrings } from "@/lib/admin-validation";

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

/** Remplace l'intégralité des lignes d'un devis (l'admin les édite comme un groupe). */
export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });

    const { id } = await ctx.params;
    const parsed = quoteLinesUpdateSchema.safeParse(sanitizeStrings(await req.json()));
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ error: `${first.path.join(".")} : ${first.message}` }, { status: 400 });
    }

    const db = getDb();
    const exists = await db.quoteRequest.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });

    await db.$transaction([
      db.quoteLine.deleteMany({ where: { quoteRequestId: id } }),
      db.quoteLine.createMany({
        data: parsed.data.lines.map((line, i) => ({
          quoteRequestId: id,
          description: line.description,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
          vatRate: line.vatRate,
          sortOrder: i,
        })),
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/admin/quote-requests/lines PUT]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
