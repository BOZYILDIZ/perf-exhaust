import 'server-only'
import webpush, { WebPushError } from 'web-push'
import { getDb, isDbConfigured } from '@/lib/db'

const VAPID_PUBLIC_KEY = process.env.PUSH_VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.PUSH_VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.PUSH_VAPID_SUBJECT

const configured = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_SUBJECT)

if (configured) {
  webpush.setVapidDetails(VAPID_SUBJECT!, VAPID_PUBLIC_KEY!, VAPID_PRIVATE_KEY!)
} else if (process.env.NODE_ENV === 'production') {
  console.warn(
    "[push] PUSH_VAPID_PUBLIC_KEY/PRIVATE_KEY/SUBJECT absentes en production — notifications push désactivées (mode mock)."
  )
}

/** Lue par GET /api/admin/push/status — jamais la clé privée, uniquement un booléen. */
export function isPushConfigured(): boolean {
  return configured
}

/** Clé publique VAPID — sûre à exposer au client (voir schema.prisma § PushSubscription), jamais la privée. */
export function getVapidPublicKey(): string | null {
  return VAPID_PUBLIC_KEY ?? null
}

export interface PushPayload {
  title: string
  body: string
  /** Chemin absolu ouvert par le service worker au clic (voir public/admin/sw.js § notificationclick). */
  url: string
  data?: Record<string, unknown>
}

interface SubscriptionRow {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

/**
 * Envoie à UN abonnement. Sur 404/410 (endpoint mort confirmé par le
 * provider), supprime immédiatement la subscription et n'essaie jamais de
 * la réutiliser. Sur toute autre erreur, enregistre `lastError` mais laisse
 * la ligne intacte (peut être transitoire). Relève toujours l'erreur
 * d'origine à l'appelant — c'est sendPushToAllAdmins qui absorbe les échecs
 * pour rester best-effort.
 */
export async function sendPushToSubscription(sub: SubscriptionRow, payload: PushPayload): Promise<void> {
  if (!configured) return
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    )
    if (isDbConfigured()) {
      await getDb().pushSubscription.update({ where: { id: sub.id }, data: { lastUsedAt: new Date(), lastError: null } }).catch(() => {})
    }
  } catch (error) {
    await recordSendFailure(sub.id, error)
    throw error
  }
}

async function recordSendFailure(subscriptionId: string, error: unknown): Promise<void> {
  if (!isDbConfigured()) return
  const statusCode = error instanceof WebPushError ? error.statusCode : undefined
  if (statusCode === 404 || statusCode === 410) {
    await cleanupExpiredSubscription(subscriptionId)
    return
  }
  const message = error instanceof Error ? error.message : 'Erreur inconnue'
  await getDb().pushSubscription.update({ where: { id: subscriptionId }, data: { lastError: message } }).catch(() => {})
}

/** Endpoint mort (404/410) — supprimé plutôt que désactivé : rien à en faire, jamais réutilisable. */
export async function cleanupExpiredSubscription(subscriptionId: string): Promise<void> {
  if (!isDbConfigured()) return
  await getDb().pushSubscription.delete({ where: { id: subscriptionId } }).catch(() => {})
}

/**
 * Diffuse à tous les abonnements admin actifs (tous appareils confondus).
 * Ne lève JAMAIS — chaque échec individuel est loggé (sans le contenu du
 * payload) puis ignoré, voir POST /api/rendez-vous : une demande client
 * réussie ne doit jamais dépendre de la disponibilité du push.
 */
export async function sendPushToAllAdmins(payload: PushPayload): Promise<void> {
  if (!configured || !isDbConfigured()) return
  try {
    const subs = await getDb().pushSubscription.findMany({ where: { enabled: true } })
    await Promise.all(
      subs.map((sub) =>
        sendPushToSubscription(sub, payload).catch((error) => {
          console.error('[push] Échec d\'envoi vers un abonnement admin (subscription nettoyée si expirée) :', {
            subscriptionId: sub.id,
            statusCode: error instanceof WebPushError ? error.statusCode : undefined,
          })
        })
      )
    )
  } catch (error) {
    console.error('[push] Échec inattendu lors de la diffusion aux admins :', error)
  }
}
