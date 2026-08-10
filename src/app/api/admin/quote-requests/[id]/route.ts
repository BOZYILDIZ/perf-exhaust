import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured, getDb } from "@/lib/db";
import { quoteRequestUpdateSchema, sanitizeStrings } from "@/lib/admin-validation";
import { ACTIVE_APPOINTMENT_STATUSES } from "@/lib/agenda/appointments";
import { logActivityEvent, ACTIVITY_EVENT_TYPES } from "@/lib/activity-events";
import { QUOTE_STATUS_LABELS, type QuoteStatus } from "@/lib/quote-pipeline";

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

async function guard(req: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
  if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });
  return null;
}

/**
 * Changement de statut CRM, notes internes, et/ou suivi manuel Pennylane
 * (statut/numéro/lien — plan gratuit sans API, voir src/lib/pennylane/mode.ts).
 */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const denied = await guard(req);
    if (denied) return denied;
    const { id } = await ctx.params;
    const parsed = quoteRequestUpdateSchema.safeParse(sanitizeStrings(await req.json()));
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ error: `${first.path.join(".")} : ${first.message}` }, { status: 400 });
    }
    const db = getDb();
    const exists = await db.quoteRequest.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!exists) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });

    const { pennylaneQuoteNumber, pennylaneQuoteUrl, ...rest } = parsed.data;
    // Un (re)passage à DEVIS_ENVOYE relance le compteur de relances
    // commerciales : nouveau repère temporel, et les relances déjà comptées
    // pour un envoi précédent ne doivent pas bloquer un nouvel envoi (voir
    // src/lib/quote-followup.ts et prisma/schema.prisma § QuoteRequest.quoteSentAt).
    const enteringDevisEnvoye = rest.status === "DEVIS_ENVOYE" && rest.status !== exists.status;
    await db.quoteRequest.update({
      where: { id },
      data: {
        ...rest,
        ...(pennylaneQuoteNumber !== undefined && { pennylaneQuoteNumber: pennylaneQuoteNumber || null }),
        ...(pennylaneQuoteUrl !== undefined && { pennylaneQuoteUrl: pennylaneQuoteUrl || null }),
        ...(enteringDevisEnvoye && { quoteSentAt: new Date(), followupStage: 0, lastFollowupSentAt: null }),
      },
    });

    if (rest.status && rest.status !== exists.status) {
      const fromLabel = QUOTE_STATUS_LABELS[exists.status as QuoteStatus] ?? exists.status;
      const toLabel = QUOTE_STATUS_LABELS[rest.status as QuoteStatus] ?? rest.status;
      await logActivityEvent({
        quoteRequestId: id,
        type: ACTIVITY_EVENT_TYPES.QUOTE_STATUS_CHANGED,
        title: `Statut changé : ${fromLabel} → ${toLabel}`,
        metadata: { from: exists.status, to: rest.status },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/admin/quote-requests PATCH]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

/**
 * Suppression définitive (l'archivage se fait via PATCH status=archived).
 * Bloquée si un rendez-vous ACTIF (PENDING/CONFIRMED) est rattaché — annuler
 * le rendez-vous au préalable lève le blocage (voir src/lib/agenda/).
 */
export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const denied = await guard(req);
    if (denied) return denied;
    const { id } = await ctx.params;
    const db = getDb();
    const exists = await db.quoteRequest.findUnique({
      where: { id },
      select: { id: true, appointment: { select: { status: true } } },
    });
    if (!exists) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    if (exists.appointment && (ACTIVE_APPOINTMENT_STATUSES as readonly string[]).includes(exists.appointment.status)) {
      return NextResponse.json(
        { error: "Impossible de supprimer : un rendez-vous actif est rattaché à cette demande. Annulez-le d'abord." },
        { status: 409 }
      );
    }
    await db.quoteRequest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/admin/quote-requests DELETE]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
