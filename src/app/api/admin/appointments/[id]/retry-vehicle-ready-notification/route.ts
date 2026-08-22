import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured } from "@/lib/db";
import { retryVehicleReadyNotification } from "@/lib/agenda/workshop-actions";
import { AppointmentNotFoundError } from "@/lib/agenda/appointments";

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
 * Réessai explicite de la notification "véhicule prêt" après un échec —
 * n'a de sens qu'une fois l'intervention terminée, mais partage la même
 * garde d'unicité que l'essai initial (voir attemptVehicleReadyNotification
 * dans src/lib/agenda/workshop-actions.ts) : aucun risque de double envoi
 * même en cas de double-clic sur ce bouton.
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });

    const { id } = await ctx.params;
    const result = await retryVehicleReadyNotification(id);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof AppointmentNotFoundError) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("[API/admin/appointments/[id]/retry-vehicle-ready-notification]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
