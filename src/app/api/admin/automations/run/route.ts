import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured } from "@/lib/db";
import { runAutomations } from "@/lib/automation-runner";

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
 * Déclenchement manuel des automatisations (rappels/relances/avis) — aucun
 * cron Vercel branché pour l'instant (voir src/lib/automation-runner.ts).
 * Ce bouton admin est le seul déclencheur actuel ; le jour où un cron est
 * activé, il appellera cette même logique (runAutomations), pas une copie.
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });

    const result = await runAutomations();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[API/admin/automations/run]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
