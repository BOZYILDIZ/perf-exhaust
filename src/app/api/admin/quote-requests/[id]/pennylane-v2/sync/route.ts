import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured } from "@/lib/db";
import { isPennylaneV2Configured } from "@/lib/pennylane-v2/config";
import { syncCustomerForQuoteRequest } from "@/lib/pennylane-v2/sync";

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

/**
 * Relance la synchronisation CLIENT Pennylane API v2 pour une demande —
 * utilisé après un échec (bouton "Relancer la synchronisation") ou pour
 * synchroniser une demande créée avant que le token ne soit configuré.
 * Repasse systématiquement par la recherche complète (id local → email →
 * téléphone → nom) avant toute création : aucun risque de doublon même
 * après plusieurs tentatives.
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });
    if (!isPennylaneV2Configured()) {
      return NextResponse.json({ error: "Pennylane non configuré (PENNYLANE_API_TOKEN absente)." }, { status: 503 });
    }

    const { id } = await ctx.params;
    const outcome = await syncCustomerForQuoteRequest(id);
    return NextResponse.json({ success: outcome.status !== "FAILED", outcome });
  } catch (error) {
    console.error("[API/admin/pennylane-v2/sync]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
