import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

/**
 * Authentification admin — première version volontairement simple :
 * un couple ADMIN_EMAIL / ADMIN_PASSWORD en variables d'environnement,
 * une session signée HMAC (ADMIN_SECRET) posée en cookie httpOnly.
 *
 * Le mot de passe n'est JAMAIS envoyé au client ni stocké : seule la
 * signature de session transite dans le cookie.
 */

export const ADMIN_COOKIE = 'pe_admin_session'
const SESSION_TTL_MS = 12 * 60 * 60 * 1000 // 12 h

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && process.env.ADMIN_SECRET)
}

function sign(payload: string): string {
  return createHmac('sha256', process.env.ADMIN_SECRET as string).update(payload).digest('hex')
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

export function verifyCredentials(email: string, password: string): boolean {
  if (!isAdminConfigured()) return false
  return (
    safeEqual(email, process.env.ADMIN_EMAIL as string) &&
    safeEqual(password, process.env.ADMIN_PASSWORD as string)
  )
}

/** Jeton de session : `<expiration>.<hmac(expiration)>`. */
export function createSessionToken(): string {
  const exp = String(Date.now() + SESSION_TTL_MS)
  return `${exp}.${sign(exp)}`
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token || !isAdminConfigured()) return false
  const [exp, sig] = token.split('.')
  if (!exp || !sig) return false
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false
  return safeEqual(sig, sign(exp))
}

/** Session valide pour la requête en cours (Server Components / route handlers). */
export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies()
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value)
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  }
}
