import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured } from "@/lib/db";
import { correctWorkshopStatus } from "@/lib/agenda/workshop-actions";
import { AppointmentNotFoundError } from "@/lib/agenda/appointments";
import { WORKSHOP_STATUSES } from "@/lib/admin-validation";

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

const bodySchema = z.object({ workshopStatus: z.enum(WORKSHOP_STATUSES).nullable() });

/**
 * Seul point d'entrée qui peut faire RECULER le statut atelier — réservé à
 * la correction manuelle d'une erreur de manip (voir computeCorrectionMirror,
 * seule fonction de mirroring appelée qui accepte un recul).
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });

    const { id } = await ctx.params;
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

    await correctWorkshopStatus(id, parsed.data.workshopStatus);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AppointmentNotFoundError) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("[API/admin/appointments/[id]/correct-workshop-status]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
