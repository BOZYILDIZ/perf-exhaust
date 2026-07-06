import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendAppointmentToShop, sendConfirmationToClient } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isDbConfigured, getDb } from "@/lib/db";

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
    if (isDbConfigured()) {
      try {
        await getDb().quoteRequest.create({
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
          },
        });
      } catch (dbError) {
        console.error("[API/rendez-vous] Échec de l'enregistrement en base (email envoyé normalement) :", dbError);
      }
    }

    await Promise.all([
      sendAppointmentToShop(data),
      sendConfirmationToClient(data),
    ]);

    return NextResponse.json({ success: true, message: "Demande envoyée avec succès" });
  } catch (error) {
    console.error("[API/rendez-vous] Error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
