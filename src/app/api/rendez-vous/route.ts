import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendAppointmentToShop, sendConfirmationToClient } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isDbConfigured, getDb } from "@/lib/db";
import { createDraftQuoteFromRequest } from "@/lib/pennylane/client";
import { getPennylaneMode } from "@/lib/pennylane/mode";
import { PennylaneError } from "@/lib/pennylane/types";
import { REAR_DIFFUSER_VALUES } from "@/lib/quote-request-options";
import { isPennylaneV2Configured } from "@/lib/pennylane-v2/config";
import { syncCustomerForQuoteRequest } from "@/lib/pennylane-v2/sync";
import { MAX_PHOTOS, vehiclePhotoMetadataSchema } from "@/lib/vehicle-photo-slots";
import { sendPushToAllAdmins } from "@/lib/push/sendPushNotification";
import { logActivityEvent, ACTIVITY_EVENT_TYPES } from "@/lib/activity-events";

/** "Jean Dupont — BMW M240i" avec repli propre si une info manque ; ajoute le type de projet seulement si le résultat reste court (voir mission notifications push § 8). */
function buildQuoteRequestPushBody(data: { prenom: string; nom: string; marque: string; modele: string; typeProjet: string }): string {
  const name = [data.prenom, data.nom].filter(Boolean).join(" ").trim();
  const vehicle = [data.marque, data.modele].filter(Boolean).join(" ").trim();
  const base = [name, vehicle].filter(Boolean).join(" — ") || "Nouvelle demande reçue";
  const withProject = data.typeProjet ? `${base} (${data.typeProjet})` : base;
  return withProject.length <= 70 ? withProject : base;
}

const schema = z.object({
  nom: z.string().min(2),
  prenom: z.string().min(2),
  telephone: z.string().regex(/^[+0-9 .()-]{10,20}$/, "Téléphone invalide"),
  email: z.string().email(),
  billingAddress: z.string().min(3, "Adresse requise"),
  billingPostalCode: z.string().regex(/^\d{5}$/, "Code postal invalide"),
  billingCity: z.string().min(2, "Ville requise"),
  marque: z.string().min(2),
  modele: z.string().min(1),
  annee: z.string().regex(/^(19|20)\d{2}$/, "Année invalide"),
  motorisation: z.string().optional(),
  // Facultative — voir QuoteRequest.licensePlate (prisma/schema.prisma).
  licensePlate: z.string().max(20).optional(),
  rearDiffuser: z.enum(REAR_DIFFUSER_VALUES),
  typeProjet: z.string().min(1),
  sonoritePreference: z.string().min(1),
  description: z.string().min(10),
  creneauSouhaite: z.string().optional(),
  // Photos déjà uploadées vers Vercel Blob avant la soumission — jamais de
  // fichier ici, uniquement les métadonnées (voir /api/rendez-vous/upload).
  // Revalidées ici même si le client les a déjà validées (route publique).
  photos: z.array(vehiclePhotoMetadataSchema).max(MAX_PHOTOS).optional(),
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
    const pennylaneMode = getPennylaneMode();
    let quoteRequestId: string | null = null;
    if (isDbConfigured()) {
      try {
        const created = await getDb().quoteRequest.create({
          data: {
            nom: data.nom,
            prenom: data.prenom,
            email: data.email,
            telephone: data.telephone,
            billingAddress: data.billingAddress,
            billingPostalCode: data.billingPostalCode,
            billingCity: data.billingCity,
            marque: data.marque,
            modele: data.modele,
            annee: data.annee,
            motorisation: data.motorisation || null,
            licensePlate: data.licensePlate || null,
            rearDiffuser: data.rearDiffuser,
            typeProjet: data.typeProjet,
            sonorite: data.sonoritePreference,
            message: data.description,
            photos: data.photos ?? [],
            pennylaneSyncStatus: pennylaneMode === "api" ? "pending" : "not_configured",
            // Mode manuel (plan gratuit Pennylane, sans API) : la demande démarre
            // "à créer dans Pennylane" — l'admin la fait avancer depuis /admin/devis/[id].
            pennylaneManualStatus: pennylaneMode === "manual" ? "a_creer" : null,
          },
        });
        quoteRequestId = created.id;
        await logActivityEvent({
          quoteRequestId,
          type: ACTIVITY_EVENT_TYPES.QUOTE_REQUEST_CREATED,
          title: `Demande reçue — ${data.prenom} ${data.nom} (${data.marque} ${data.modele})`,
          actor: "customer",
        });
      } catch (dbError) {
        console.error("[API/rendez-vous] Échec de l'enregistrement en base (email envoyé normalement) :", dbError);
      }
    } else {
      console.warn("[API/rendez-vous] DATABASE_URL absente — demande non persistée, email envoyé quand même.");
    }

    // Synchronisation CLIENT Pennylane API v2 (nouvelle intégration,
    // indépendante du flux "quote" ci-dessous) — recherche/déduplication
    // puis création si besoin, jamais bloquante : un échec ici ne doit
    // jamais transformer une demande par ailleurs réussie en erreur pour le
    // client (voir syncCustomerForQuoteRequest, qui ne lève jamais). Le
    // résultat est uniquement visible dans le panel admin (section
    // Pennylane sur /admin/devis/[id]), jamais côté public.
    // Les envois d'e-mail sont eux aussi best-effort : la demande est déjà
    // enregistrée en base à ce stade (priorité absolue) — un e-mail rejeté
    // (ex: adresse invalide côté fournisseur) ne doit jamais transformer une
    // demande par ailleurs réussie en erreur 500 pour le client.
    await Promise.all([
      sendAppointmentToShop(data).catch((err) => {
        console.error("[API/rendez-vous] Échec de l'e-mail atelier (demande non affectée) :", err);
      }),
      sendConfirmationToClient(data).catch((err) => {
        console.error("[API/rendez-vous] Échec de l'e-mail de confirmation client (demande non affectée) :", err);
      }),
      quoteRequestId && isPennylaneV2Configured()
        ? syncCustomerForQuoteRequest(quoteRequestId).catch((err) => {
            console.error("[API/rendez-vous] Erreur inattendue lors de la synchronisation client Pennylane (demande non affectée) :", err);
          })
        : Promise.resolve(),
    ]);

    // Notification push admin (nouvelle demande) — best-effort total, après
    // les emails : sendPushToAllAdmins ne lève jamais (voir
    // src/lib/push/sendPushNotification.ts), mais on l'enveloppe quand même
    // ici pour garantir qu'aucune régression future dans ce module ne
    // puisse un jour transformer une demande par ailleurs réussie en 500.
    if (quoteRequestId) {
      try {
        await sendPushToAllAdmins({
          title: "Nouvelle demande de devis",
          body: buildQuoteRequestPushBody(data),
          url: `/admin/devis/${quoteRequestId}`,
          data: { quoteRequestId },
        });
      } catch (err) {
        console.error("[API/rendez-vous] Échec inattendu de la notification push (demande non affectée) :", err);
      }
    }

    // Pennylane est la source unique pour les devis. En mode "api", un
    // brouillon est créé automatiquement dès que la demande est enregistrée —
    // best-effort total, le client ne voit jamais un échec Pennylane, seul
    // l'admin le voit (pennylaneSyncStatus="failed" + bouton "Réessayer" sur
    // /admin/devis/[id]). En mode "manual" (plan gratuit, pas d'API), aucun
    // appel réseau n'est effectué : l'admin crée le devis à la main depuis le
    // bloc "Pennylane manuel" (bouton "Copier pour Pennylane").
    // Désactivé quand l'intégration API v2 est configurée : ce flux appelle
    // sa propre recherche/création de client (createOrFindCustomer, en
    // "company_customer") indépendamment de syncCustomerForQuoteRequest
    // ci-dessus, et écrirait ensuite dans la même colonne pennylaneCustomerId
    // — créant un second client Pennylane et écrasant l'identifiant que la v2
    // vient de résoudre. pennylaneCustomerId doit rester "commun aux deux
    // intégrations, jamais dupliqué" (voir schema.prisma) : tant que le flux
    // v1 n'a pas été adapté pour réutiliser cet identifiant, il ne doit pas
    // tourner en parallèle de la v2.
    if (quoteRequestId && pennylaneMode === "api" && !isPennylaneV2Configured()) {
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
          rearDiffuser: data.rearDiffuser,
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
