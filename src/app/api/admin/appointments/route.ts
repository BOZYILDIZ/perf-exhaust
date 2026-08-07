import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured } from "@/lib/db";
import { createAppointment, AppointmentConflictError, AppointmentNotFoundError } from "@/lib/agenda/appointments";

function guardOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.nextUrl.host;
  } catch {
    return false;
  }
}

const createSchema = z.object({
  quoteRequestId: z.string().min(1),
  startAt: z.string().datetime(),
  durationMinutes: z.number().int().positive().max(24 * 60),
  notes: z.string().max(2000).optional(),
});

/**
 * "Valider et planifier le rendez-vous" — crée directement en CONFIRMED
 * (décision produit validée, PENDING réservé à une évolution future).
 * L'envoi de l'email de confirmation est ajouté à l'étape 6 ; ne bloque pas
 * cette route en attendant (la création réussit indépendamment).
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });

    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ error: `${first.path.join(".")} : ${first.message}` }, { status: 400 });
    }

    const startAt = new Date(parsed.data.startAt);
    if (startAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "Impossible de planifier un rendez-vous dans le passé." }, { status: 400 });
    }

    const created = await createAppointment({
      quoteRequestId: parsed.data.quoteRequestId,
      startAt,
      durationMinutes: parsed.data.durationMinutes,
      notes: parsed.data.notes,
    });

    return NextResponse.json({ success: true, appointment: { id: created.id, startAt: created.startAt.toISOString(), endAt: created.endAt.toISOString() } });
  } catch (error) {
    if (error instanceof AppointmentConflictError) return NextResponse.json({ error: error.message }, { status: 409 });
    if (error instanceof AppointmentNotFoundError) return NextResponse.json({ error: error.message }, { status: 404 });
    if (error instanceof Error && error.message.includes("déjà un rendez-vous")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("[API/admin/appointments POST]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
