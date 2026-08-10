import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured } from "@/lib/db";
import { completeIntervention } from "@/lib/agenda/workshop-actions";
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

const bodySchema = z.object({ notifyClient: z.boolean().default(false) });

/**
 * `notifyClient` facultatif — un rendez-vous manuel sans email n'a jamais
 * besoin de le fournir : le workflow atelier se termine normalement, voir
 * completeIntervention() pour la garde anti-double-envoi.
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });

    const { id } = await ctx.params;
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

    const result = await completeIntervention(id, parsed.data.notifyClient);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof AppointmentNotFoundError) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("[API/admin/appointments/[id]/complete-intervention]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
