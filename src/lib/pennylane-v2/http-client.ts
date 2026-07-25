import 'server-only'
import { getPennylaneV2BaseUrl, getPennylaneV2TimeoutMs, getPennylaneV2Token } from './config'
import { PennylaneApiError, PennylaneTimeoutError } from './errors'
import type { PennylaneErrorBody, PennylanePaginatedResponse } from './types'

/**
 * Client HTTP centralisé pour Pennylane API v2 — seul point d'entrée réseau
 * de toute l'intégration. Authentification, timeout, tentatives sur erreurs
 * temporaires, typage, et journalisation sans donnée sensible (jamais le
 * token, jamais le corps de la requête/réponse dans les logs).
 *
 * Tous les appels sont effectués côté serveur uniquement (`import 'server-only'`
 * plus haut fait échouer le build si un composant client tentait de l'importer).
 */

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT'
  body?: unknown
  /** Uniquement pour les requêtes GET (idempotentes) — jamais pour POST/PUT afin d'éviter une double création. */
  retryOnTransientError?: boolean
}

const MAX_RETRY_ATTEMPTS = 2

function loggablePath(path: string): string {
  // Ne journalise jamais les paramètres de requête (peuvent contenir des
  // données personnelles du client, ex: filter[emails][in][]=...).
  return path.split('?')[0]
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function parseErrorBody(res: Response): Promise<PennylaneErrorBody | null> {
  try {
    return (await res.json()) as PennylaneErrorBody
  } catch {
    return null
  }
}

async function performRequest(path: string, init: RequestOptions): Promise<Response> {
  const controller = new AbortController()
  const timeoutMs = getPennylaneV2TimeoutMs()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const started = Date.now()
  try {
    const res = await fetch(`${getPennylaneV2BaseUrl()}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${getPennylaneV2Token()}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
    })
    console.log(`[pennylane-v2] ${init.method ?? 'GET'} ${loggablePath(path)} → ${res.status} (${Date.now() - started}ms)`)
    return res
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.error(`[pennylane-v2] ${init.method ?? 'GET'} ${loggablePath(path)} → timeout après ${timeoutMs}ms`)
      throw new PennylaneTimeoutError()
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Requête Pennylane typée. Sur 429/5xx pour une requête GET marquée
 * `retryOnTransientError`, réessaie jusqu'à `MAX_RETRY_ATTEMPTS` fois en
 * respectant l'en-tête `retry-after` (secondes) si présent. Ne réessaie
 * jamais automatiquement les POST/PUT (non idempotents) — voir customers.ts,
 * qui laisse toute nouvelle tentative à une action explicite de l'admin
 * (bouton "Relancer la synchronisation"), protégée par la recherche
 * préalable qui empêche un doublon même en cas de nouvel essai manuel.
 */
export async function pennylaneV2Request<T>(path: string, init: RequestOptions = {}): Promise<T> {
  let attempt = 0
  for (;;) {
    const res = await performRequest(path, init)
    if (res.ok) {
      if (res.status === 204) return undefined as T
      return (await res.json()) as T
    }

    const body = await parseErrorBody(res)
    const canRetry = init.retryOnTransientError && (res.status === 429 || res.status >= 500) && attempt < MAX_RETRY_ATTEMPTS
    if (canRetry) {
      const retryAfterHeader = res.headers.get('retry-after')
      const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : 500 * 2 ** attempt
      attempt += 1
      console.warn(`[pennylane-v2] ${loggablePath(path)} → ${res.status}, nouvelle tentative dans ${retryAfterMs}ms (essai ${attempt}/${MAX_RETRY_ATTEMPTS})`)
      await wait(retryAfterMs)
      continue
    }
    throw new PennylaneApiError(res.status, body)
  }
}

export interface PaginationParams {
  filter?: string
  sort?: string
  limit?: number
  cursor?: string
}

function buildQuery(params: PaginationParams): string {
  const qs = new URLSearchParams()
  if (params.filter) qs.set('filter', params.filter)
  if (params.sort) qs.set('sort', params.sort)
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.cursor) qs.set('cursor', params.cursor)
  const s = qs.toString()
  return s ? `?${s}` : ''
}

/**
 * Parcourt toutes les pages d'un endpoint liste Pennylane (pagination par
 * curseur) jusqu'à épuisement ou `maxPages` atteint. `filter`/`sort` sont
 * ré-envoyés à chaque page — le curseur seul ne conserve pas ces critères
 * (confirmé par la documentation officielle : "cursor does not store filter
 * state").
 */
export async function fetchAllPennylanePages<T>(
  path: string,
  params: PaginationParams,
  maxPages: number
): Promise<{ items: T[]; truncated: boolean }> {
  const items: T[] = []
  let cursor: string | undefined
  let page = 0
  let truncated = false

  for (;;) {
    page += 1
    const data = await pennylaneV2Request<PennylanePaginatedResponse<T>>(
      `${path}${buildQuery({ ...params, cursor })}`,
      { retryOnTransientError: true }
    )
    items.push(...data.items)
    const hasMore = data.has_more ?? data.meta?.has_more ?? false
    const nextCursor = data.next_cursor ?? data.meta?.next_cursor ?? null
    if (!hasMore || !nextCursor) break
    if (page >= maxPages) {
      truncated = true
      console.warn(`[pennylane-v2] Pagination arrêtée après ${maxPages} pages sur ${loggablePath(path)} — résultats potentiellement incomplets.`)
      break
    }
    cursor = nextCursor
  }
  return { items, truncated }
}
