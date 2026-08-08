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
});

/** Supprime proprement l'abonnement de CET appareil — jamais celui d'un autre. Idempotent (silencieux si déjà absent). */
export async function DELETE(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ error: `${first.path.join(".")} : ${first.message}` }, { status: 400 });
    }

    await getDb().pushSubscription.deleteMany({ where: { endpoint: parsed.data.endpoint } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API/admin/push/unsubscribe]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
