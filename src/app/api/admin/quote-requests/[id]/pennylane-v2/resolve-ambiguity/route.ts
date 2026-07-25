import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured, getDb } from "@/lib/db";
import { resolvePennylaneCustomerAmbiguity } from "@/lib/pennylane-v2/sync";

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

const schema = z.object({
  customerId: z.number().int().positive(),
  customerType: z.enum(["individual", "company"]),
});

/**
 * Résolution manuelle d'une correspondance ambiguë (statut AMBIGUOUS) —
 * l'admin choisit explicitement le bon client parmi les candidats affichés.
 * Aucune sélection automatique n'est jamais faite par le système (voir
 * sync.ts) : cette route est le seul moyen de sortir de l'état AMBIGUOUS.
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });

    const { id } = await ctx.params;
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

    const quoteRequest = await getDb().quoteRequest.findUnique({ where: { id }, select: { id: true, pennylaneCustomerSyncStatus: true } });
    if (!quoteRequest) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    if (quoteRequest.pennylaneCustomerSyncStatus !== "AMBIGUOUS") {
      return NextResponse.json({ error: "Cette demande n'est pas en attente de résolution." }, { status: 409 });
    }

    await resolvePennylaneCustomerAmbiguity(id, parsed.data.customerId, parsed.data.customerType);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/admin/pennylane-v2/resolve-ambiguity]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
