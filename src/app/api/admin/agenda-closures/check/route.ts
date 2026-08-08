import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured } from "@/lib/db";
import { listActiveAppointmentsInDateRange } from "@/lib/agenda/appointments";

const querySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * Rendez-vous actifs déjà présents dans une future plage de fermeture —
 * jamais utilisé pour supprimer/déplacer automatiquement quoi que ce soit,
 * uniquement pour afficher l'avertissement admin avant de confirmer une
 * fermeture ("N rendez-vous existant(s) se trouve(nt) dans cette période").
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });

    const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    if (parsed.data.endDate < parsed.data.startDate) return NextResponse.json({ appointments: [] });

    const appointments = await listActiveAppointmentsInDateRange(parsed.data.startDate, parsed.data.endDate);
    return NextResponse.json({
      appointments: appointments.map((a) => ({
        id: a.id, customerName: a.customerName, vehicle: a.vehicle,
        startAt: a.startAt.toISOString(), status: a.status,
      })),
    });
  } catch (error) {
    console.error("[API/admin/agenda-closures/check]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
