import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { cancelAppointmentByCustomer } from "@/lib/agenda/customer-cancellation";

type Ctx = { params: Promise<{ token: string }> };

const bodySchema = z.object({ reason: z.string().max(500).optional() });

const MESSAGES: Record<string, string> = {
  invalid: "Ce lien d'annulation est invalide ou a expiré.",
  already_cancelled: "Ce rendez-vous a déjà été annulé.",
  already_completed: "Ce rendez-vous est déjà terminé — l'annulation n'est plus possible.",
  too_late: "L'annulation en ligne n'est plus disponible à moins de 48 heures du rendez-vous. Merci d'appeler directement l'atelier.",
};

/**
 * Annulation client — route publique, sans authentification (par design :
 * la sécurité repose sur le token opaque, jamais sur une session). Toute
 * mutation passe uniquement par ce POST (jamais par le simple chargement de
 * la page). Revalide tout côté serveur (voir customer-cancellation.ts) —
 * aucune confiance dans un état déjà affiché côté client.
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    if (!checkRateLimit(getClientIp(req))) {
      return NextResponse.json({ error: "Trop de tentatives. Réessayez dans une minute." }, { status: 429 });
    }

    const { token } = await ctx.params;
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 400 });

    const result = await cancelAppointmentByCustomer(token, parsed.data.reason ?? null);
    if (!result.success) {
      return NextResponse.json({ error: MESSAGES[result.status] ?? "Annulation impossible." }, { status: 409 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    // Jamais de détail technique/stack trace exposé au public.
    console.error("[API/rendez-vous/annuler]", error);
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}
