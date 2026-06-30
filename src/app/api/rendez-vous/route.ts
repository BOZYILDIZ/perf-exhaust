import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendAppointmentToShop, sendConfirmationToClient } from "@/lib/email";

const schema = z.object({
  nom: z.string().min(2),
  prenom: z.string().min(2),
  telephone: z.string().min(10),
  email: z.string().email(),
  marque: z.string().min(2),
  modele: z.string().min(1),
  annee: z.string().min(4),
  motorisation: z.string().optional(),
  typeProjet: z.string().min(1),
  sonoritePreference: z.string().min(1),
  description: z.string().min(10),
  creneauSouhaite: z.string().optional(),
  rgpd: z.boolean(),
});

const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = RATE_LIMIT.get(ip);
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Trop de requêtes. Attendez une minute." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.issues }, { status: 400 });
    }

    const data = parsed.data;
    if (!data.rgpd) {
      return NextResponse.json({ error: "Consentement RGPD requis" }, { status: 400 });
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
