import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendAppointmentToShop, sendConfirmationToClient } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isDbConfigured, getDb } from "@/lib/db";
import { isPennylaneConfigured, createDraftQuoteFromRequest } from "@/lib/pennylane/client";
import { PennylaneError } from "@/lib/pennylane/types";

const schema = z.object({
  nom: z.string().min(2),
  prenom: z.string().min(2),
  telephone: z.string().regex(/^[+0-9 .()-]{10,20}$/, "Téléphone invalide"),
  email: z.string().email(),
  marque: z.string().min(2),
  modele: z.string().min(1),
  annee: z.string().regex(/^(19|20)\d{2}$/, "Année invalide"),
  motorisation: z.string().optional(),
  typeProjet: z.string().min(1),
  sonoritePreference: z.string().min(1),
  description: z.string().min(10),
  creneauSouhaite: z.string().optional(),
  rgpd: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    if (!checkRateLimit(getClientIp(req))) {
      return NextResponse.json({ error: "Trop de requêtes. Attendez une minute." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const data = parsed.data;
    if (!data.rgpd) {
      return NextResponse.json({ error: "Consentement RGPD requis" }, { status: 400 });
    }

    // Mini-CRM : la demande est enregistrée en base en plus de l'email —
    // best-effort, ne doit jamais empêcher l'envoi des emails ni casser le
    // formulaire si la base est temporairement indisponible.
    let quoteRequestId: string | null = null;
    if (isDbConfigured()) {
      try {
        const created = await getDb().quoteRequest.create({
          data: {
            nom: data.nom,
            prenom: data.prenom,
            email: data.email,
            telephone: data.telephone,
            marque: data.marque,
            modele: data.modele,
            annee: data.annee,
            motorisation: data.motorisation || null,
            typeProjet: data.typeProjet,
            sonorite: data.sonoritePreference,
            message: data.description,
            pennylaneSyncStatus: isPennylaneConfigured() ? "pending" : "not_configured",
          },
        });
        quoteRequestId = created.id;
      } catch (dbError) {
        console.error("[API/rendez-vous] Échec de l'enregistrement en base (email envoyé normalement) :", dbError);
      }
    } else {
      console.warn("[API/rendez-vous] DATABASE_URL absente — demande non persistée, email envoyé quand même.");
    }

    await Promise.all([
      sendAppointmentToShop(data),
      sendConfirmationToClient(data),
    ]);

    // Pennylane est la source unique pour les devis : un brouillon est créé
    // automatiquement dès que la demande est enregistrée. Best-effort total —
    // le client ne voit jamais un échec Pennylane, seul l'admin le voit
    // (pennylaneSyncStatus/"failed" + bouton "Réessayer" sur /admin/devis/[id]).
    if (quoteRequestId && isPennylaneConfigured()) {
      try {
        const draft = await createDraftQuoteFromRequest({
          nom: data.nom,
          prenom: data.prenom,
          email: data.email,
          telephone: data.telephone,
          marque: data.marque,
          modele: data.modele,
          annee: data.annee,
          motorisation: data.motorisation,
          typeProjet: data.typeProjet,
          sonorite: data.sonoritePreference,
          message: data.description,
        });
        await getDb().quoteRequest.update({
          where: { id: quoteRequestId },
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
      } catch (pennylaneError) {
        const adminMessage = pennylaneError instanceof PennylaneError
          ? pennylaneError.toAdminMessage()
          : "Erreur inattendue lors de la communication avec Pennylane.";
        console.error("[API/rendez-vous] Échec création brouillon Pennylane (demande client non impactée) :", {
          quoteRequestId,
          status: pennylaneError instanceof PennylaneError ? pennylaneError.status : undefined,
          code: pennylaneError instanceof PennylaneError ? pennylaneError.code : undefined,
        });
        try {
          await getDb().quoteRequest.update({
            where: { id: quoteRequestId },
            data: { pennylaneSyncStatus: "failed", pennylaneSyncError: adminMessage, pennylaneSyncedAt: new Date() },
          });
        } catch (updateError) {
          console.error("[API/rendez-vous] Échec sauvegarde du statut d'erreur Pennylane :", updateError);
        }
      }
    }

    return NextResponse.json({ success: true, message: "Demande envoyée avec succès" });
  } catch (error) {
    console.error("[API/rendez-vous] Error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
