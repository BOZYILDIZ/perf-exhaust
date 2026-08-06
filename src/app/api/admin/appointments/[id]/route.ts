import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured } from "@/lib/db";
import { updateAppointmentNotes, AppointmentNotFoundError } from "@/lib/agenda/appointments";

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

const updateSchema = z.object({ notes: z.string().max(2000) });

/** Modification des notes internes d'un rendez-vous — ne touche jamais au créneau (voir /reschedule pour déplacer). */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });

    const { id } = await ctx.params;
    const parsed = updateSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

    await updateAppointmentNotes(id, parsed.data.notes);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AppointmentNotFoundError) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("[API/admin/appointments/[id] PATCH]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
