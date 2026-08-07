import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured } from "@/lib/db";
import { rescheduleAppointment, AppointmentConflictError, AppointmentNotFoundError } from "@/lib/agenda/appointments";

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
  startAt: z.string().datetime(),
  durationMinutes: z.number().int().positive().max(24 * 60),
});

/** Déplace un rendez-vous — revalide la disponibilité, régénère le token d'annulation (l'ancien lien devient invalide, voir étape 6/7 pour l'email). */
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });

    const { id } = await ctx.params;
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

    const startAt = new Date(parsed.data.startAt);
    if (startAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "Impossible de déplacer un rendez-vous dans le passé." }, { status: 400 });
    }

    const updated = await rescheduleAppointment(id, startAt, parsed.data.durationMinutes);
    return NextResponse.json({ success: true, appointment: { id: updated.id, startAt: updated.startAt.toISOString(), endAt: updated.endAt.toISOString() } });
  } catch (error) {
    if (error instanceof AppointmentConflictError) return NextResponse.json({ error: error.message }, { status: 409 });
    if (error instanceof AppointmentNotFoundError) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("[API/admin/appointments/[id]/reschedule]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
