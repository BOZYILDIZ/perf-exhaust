import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured, getDb } from "@/lib/db";

function guardOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.nextUrl.host;
  } catch {
    return false;
  }
}

const bodySchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(500),
    auth: z.string().min(1).max(500),
  }),
  userAgent: z.string().max(300).optional(),
  deviceLabel: z.string().max(100).optional(),
});

/**
 * Enregistre (ou réactive) l'abonnement push de CET appareil — jamais celui
 * d'un autre. `endpoint` est unique par appareil/navigateur (voir
 * schema.prisma § PushSubscription) : un upsert par endpoint ne touche
 * donc jamais les lignes des autres appareils admin déjà abonnés.
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ error: `${first.path.join(".")} : ${first.message}` }, { status: 400 });
    }
    const { endpoint, keys, userAgent, deviceLabel } = parsed.data;

    await getDb().pushSubscription.upsert({
      where: { endpoint },
      create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent, deviceLabel, enabled: true },
      update: { p256dh: keys.p256dh, auth: keys.auth, userAgent, deviceLabel, enabled: true, lastError: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/admin/push/subscribe]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
