import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured } from "@/lib/db";
import { createManualAppointment, AppointmentConflictError } from "@/lib/agenda/appointments";
import { REAR_DIFFUSER_VALUES } from "@/lib/quote-request-options";

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
  prenom: z.string().min(2, "Prénom requis"),
  nom: z.string().min(2, "Nom requis"),
  telephone: z.string().regex(/^[+0-9 .()-]{10,20}$/, "Téléphone invalide"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  address: z.string().max(300).optional(),
  marque: z.string().min(2, "Marque requise"),
  modele: z.string().min(1, "Modèle requis"),
  annee: z.string().regex(/^(19|20)\d{2}$/, "Année invalide"),
  motorisation: z.string().max(200).optional(),
  licensePlate: z.string().max(20).optional(),
  rearDiffuser: z.enum(REAR_DIFFUSER_VALUES).optional(),
  vehicleNotes: z.string().max(2000).optional(),
  startAt: z.string().datetime(),
  durationMinutes: z.number().int().positive().max(24 * 60),
  notes: z.string().max(2000).optional(),
});

/**
 * Création manuelle d'un rendez-vous depuis /admin/agenda — client passé au
 * comptoir ou par téléphone, sans demande de devis (voir
 * createManualAppointment). Réutilise le même moteur de disponibilité que
 * la création depuis une demande ; ne bloque jamais sur un échec Pennylane
 * ou l'absence d'email.
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

    const created = await createManualAppointment({
      prenom: parsed.data.prenom,
      nom: parsed.data.nom,
      telephone: parsed.data.telephone,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      marque: parsed.data.marque,
      modele: parsed.data.modele,
      annee: parsed.data.annee,
      motorisation: parsed.data.motorisation || null,
      licensePlate: parsed.data.licensePlate || null,
      rearDiffuser: parsed.data.rearDiffuser || null,
      vehicleNotes: parsed.data.vehicleNotes,
      startAt,
      durationMinutes: parsed.data.durationMinutes,
      notes: parsed.data.notes,
    });

    return NextResponse.json({
      success: true,
      appointment: { id: created.id, startAt: created.startAt.toISOString(), endAt: created.endAt.toISOString() },
      emailSent: created.emailSent,
      pennylaneCustomerId: created.pennylaneCustomerId,
    });
  } catch (error) {
    if (error instanceof AppointmentConflictError) return NextResponse.json({ error: error.message }, { status: 409 });
    console.error("[API/admin/appointments/manual POST]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
