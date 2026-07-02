/**
 * Rate limiting en mémoire, partagé par les routes API de formulaires.
 *
 * Limite : `max` requêtes par fenêtre de `windowMs` par IP.
 * Note : sur un hébergement serverless (Vercel), la Map n'est pas partagée
 * entre instances — c'est une protection best-effort contre le spam naïf,
 * pas une garantie stricte. Suffisant pour un site vitrine.
 */
const BUCKETS = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(ip: string, max = 3, windowMs = 60_000): boolean {
  const now = Date.now()
  // Purge opportuniste des entrées expirées pour éviter une croissance illimitée
  if (BUCKETS.size > 1000) {
    for (const [key, entry] of BUCKETS) {
      if (now > entry.resetAt) BUCKETS.delete(key)
    }
  }
  const entry = BUCKETS.get(ip)
  if (!entry || now > entry.resetAt) {
    BUCKETS.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}

export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}
