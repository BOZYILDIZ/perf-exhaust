import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured, getDb } from "@/lib/db";
import { isPennylaneConfigured, createDraftQuoteFromRequest } from "@/lib/pennylane/client";
import { PennylaneError } from "@/lib/pennylane/types";

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

/**
 * Réessaie (ou déclenche pour la première fois) la création du brouillon
 * Pennylane d'une demande — utilisé quand la tentative automatique de
 * /api/rendez-vous a échoué, ou n'a jamais eu lieu (DB indisponible au
 * moment de la demande, PENNYLANE_API_KEY ajoutée après coup...).
 * Pennylane reste la source unique pour les devis : cette route ne fait que
 * relancer createDraftQuoteFromRequest, jamais construire de devis local.
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });
    if (!isPennylaneConfigured()) {
      return NextResponse.json({ error: "Pennylane non configuré (PENNYLANE_API_KEY absente)." }, { status: 503 });
    }

    const { id } = await ctx.params;
    const db = getDb();
    const quoteRequest = await db.quoteRequest.findUnique({ where: { id } });
    if (!quoteRequest) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });

    if (quoteRequest.pennylaneQuoteId) {
      return NextResponse.json(
        { error: "Un devis Pennylane existe déjà pour cette demande — pas de nouvelle création pour éviter un doublon." },
        { status: 409 }
      );
    }

    try {
      const draft = await createDraftQuoteFromRequest({
        nom: quoteRequest.nom,
        prenom: quoteRequest.prenom,
        email: quoteRequest.email,
        telephone: quoteRequest.telephone,
        marque: quoteRequest.marque,
        modele: quoteRequest.modele,
        annee: quoteRequest.annee,
        motorisation: quoteRequest.motorisation,
        rearDiffuser: quoteRequest.rearDiffuser,
        typeProjet: quoteRequest.typeProjet,
        sonorite: quoteRequest.sonorite,
        message: quoteRequest.message,
      });

      const updated = await db.quoteRequest.update({
        where: { id },
        data: {
          pennylaneCustomerId: String(draft.customerId),
          pennylaneQuoteId: String(draft.quoteId),
          pennylaneQuoteNumber: draft.quoteNumber,
          pennylaneQuoteUrl: draft.quoteUrl,
          pennylaneSyncStatus: "draft_created",
          pennylaneSyncError: null,
          pennylaneSyncedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        pennylaneQuoteId: updated.pennylaneQuoteId,
        pennylaneQuoteNumber: updated.pennylaneQuoteNumber,
        pennylaneQuoteUrl: updated.pennylaneQuoteUrl,
        pennylaneSyncStatus: updated.pennylaneSyncStatus,
      });
    } catch (err) {
      const adminMessage = err instanceof PennylaneError ? err.toAdminMessage() : "Erreur inattendue lors de la communication avec Pennylane.";
      console.error("[API/admin/pennylane/retry] Échec création brouillon Pennylane", {
        quoteRequestId: id,
        status: err instanceof PennylaneError ? err.status : undefined,
        code: err instanceof PennylaneError ? err.code : undefined,
      });
      await db.quoteRequest.update({
        where: { id },
        data: { pennylaneSyncStatus: "failed", pennylaneSyncError: adminMessage, pennylaneSyncedAt: new Date() },
      });
      return NextResponse.json({ success: false, error: adminMessage }, { status: 502 });
    }
  } catch (error) {
    console.error("[API/admin/pennylane/retry]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
