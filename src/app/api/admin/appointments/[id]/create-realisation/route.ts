import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getDb, isDbConfigured } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { buildRealisationDraftFromAppointment } from "@/lib/agenda/realisation-draft";
import type { WorkshopPhoto } from "@/lib/agenda/workshop-photos";

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

function parsePhotos(value: unknown): WorkshopPhoto[] {
  return Array.isArray(value) ? (value as WorkshopPhoto[]) : [];
}

/**
 * Crée un BROUILLON de réalisation à partir d'un rendez-vous atelier —
 * réutilise l'architecture Project existante à l'identique (même approche
 * que la duplication de réalisation) : toujours `status: "draft"`, jamais
 * publié automatiquement. Idempotent : si une réalisation existe déjà pour
 * ce rendez-vous (Project.sourceAppointmentId), la renvoie telle quelle au
 * lieu d'en créer une seconde.
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });

    const { id } = await ctx.params;
    const db = getDb();
    const appointment = await db.appointment.findUnique({
      where: { id },
      include: {
        realisation: { select: { id: true, slug: true } },
        quoteRequest: { select: { marque: true, modele: true, annee: true, motorisation: true } },
      },
    });
    if (!appointment) return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });

    if (appointment.realisation) {
      return NextResponse.json({ success: true, id: appointment.realisation.id, slug: appointment.realisation.slug, alreadyExisted: true });
    }

    // Même règle que resolveAppointmentLicensePlate (workshop-status.ts) :
    // QuoteRequest est canonique pour un RDV lié, Appointment.motorisation
    // n'est lu que pour un RDV manuel.
    const motorisation = appointment.quoteRequestId ? (appointment.quoteRequest?.motorisation ?? null) : appointment.motorisation;

    const draft = buildRealisationDraftFromAppointment({
      vehicle: appointment.vehicle,
      marque: appointment.quoteRequest?.marque ?? null,
      modele: appointment.quoteRequest?.modele ?? null,
      annee: appointment.quoteRequest?.annee ?? null,
      motorisation,
      photosAvant: parsePhotos(appointment.photosAvant),
      photosApres: parsePhotos(appointment.photosApres),
    });

    const base = slugify(appointment.vehicle) || "realisation";
    let slug = base;
    for (let n = 2; await db.project.findUnique({ where: { slug }, select: { id: true } }); n++) {
      slug = `${base}-${n}`;
    }

    const project = await db.project.create({
      data: { ...draft, slug, sourceAppointmentId: appointment.id },
    });

    return NextResponse.json({ success: true, id: project.id, slug: project.slug, alreadyExisted: false });
  } catch (error) {
    console.error("[API/admin/appointments/[id]/create-realisation]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
