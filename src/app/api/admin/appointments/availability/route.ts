import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured } from "@/lib/db";
import { getAvailableSlots } from "@/lib/agenda/appointments";

const querySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  durationMinutes: z.coerce.number().int().positive().max(24 * 60),
  excludeAppointmentId: z.string().optional(),
});

/** Créneaux réellement disponibles pour une fenêtre et une durée — utilisé par la fenêtre de planification (/admin/devis/[id]) et par l'agenda. */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });

    const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });

    const from = new Date(parsed.data.from);
    const to = new Date(parsed.data.to);
    if (to <= from) return NextResponse.json({ error: "La date de fin doit être après la date de début" }, { status: 400 });

    const slots = await getAvailableSlots({ from, to, durationMinutes: parsed.data.durationMinutes, excludeAppointmentId: parsed.data.excludeAppointmentId });
    return NextResponse.json({
      slots: slots.map((s) => ({ startAt: s.startAt.toISOString(), endAt: s.endAt.toISOString() })),
    });
  } catch (error) {
    console.error("[API/admin/appointments/availability]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
