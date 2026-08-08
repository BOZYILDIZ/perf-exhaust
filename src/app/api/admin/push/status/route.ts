import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured, getDb } from "@/lib/db";
import { isPushConfigured, getVapidPublicKey } from "@/lib/push/sendPushNotification";

/**
 * État des notifications push — jamais la clé privée (voir sendPushNotification.ts).
 * `endpoint` en query optionnel : permet au client de vérifier que SA propre
 * subscription (déjà connue localement via pushManager.getSubscription())
 * est toujours enregistrée et active côté serveur — utile après un nettoyage
 * automatique (404/410) qui a pu supprimer la ligne sans que ce navigateur
 * le sache encore.
 */
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const configured = isPushConfigured();
  const vapidPublicKey = configured ? getVapidPublicKey() : null;

  let thisDeviceSubscribed = false;
  const endpoint = req.nextUrl.searchParams.get("endpoint");
  if (endpoint && isDbConfigured()) {
    const existing = await getDb().pushSubscription.findUnique({ where: { endpoint }, select: { enabled: true } });
    thisDeviceSubscribed = existing?.enabled === true;
  }

  return NextResponse.json({ configured, vapidPublicKey, thisDeviceSubscribed });
}
