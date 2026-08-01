import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured } from "@/lib/db";
import { isPennylaneV2Configured } from "@/lib/pennylane-v2/config";
import { getCustomerFinancials } from "@/lib/pennylane-v2/financials";

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
 * Force le rafraîchissement des devis/factures Pennylane d'un client
 * (bouton "Actualiser") — contourne le cache/TTL habituel (voir
 * src/lib/pennylane-v2/cache.ts). Lecture seule côté Pennylane (aucune
 * facture n'est modifiée) — accessible uniquement à l'admin authentifié,
 * jamais via une route publique.
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
    const financials = await getCustomerFinancials(id, { forceRefresh: true });
    return NextResponse.json({ success: true, financials });
  } catch (error) {
    console.error("[API/admin/pennylane-v2/financials]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
