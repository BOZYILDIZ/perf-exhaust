import 'server-only'
import { pennylaneV2Request, fetchAllPennylanePages } from './http-client'
import { buildFilter } from './filter'
import { normalizeEmail, normalizePhoneFR } from './normalize'
import {
  PENNYLANE_V2_PHONE_SEARCH_MAX_PAGES,
  PENNYLANE_V2_PHONE_SEARCH_PAGE_SIZE,
} from './config'
import type {
  PennylaneCustomer,
  CreateIndividualCustomerInput,
  CreateCompanyCustomerInput,
} from './types'

/**
 * Recherche par e-mail — stratégie principale de déduplication. Utilise le
 * champ `emails` (filtrable avec l'opérateur `in`, confirmé par la
 * référence API `GET /customers`). L'email est normalisé (minuscules,
 * espaces retirés) avant l'envoi ; Pennylane peut néanmoins stocker l'email
 * avec une casse différente — la comparaison de correspondance exacte reste
 * faite normalisée des deux côtés dans sync.ts.
 */
export async function searchCustomersByEmail(email: string): Promise<PennylaneCustomer[]> {
  const normalized = normalizeEmail(email)
  const filter = buildFilter([{ field: 'emails', operator: 'in', value: [normalized] }])
  const { items } = await fetchAllPennylanePages<PennylaneCustomer>('/customers', { filter, limit: 100 }, 3)
  return items
}

/**
 * Recherche par téléphone — l'API v2 ne documente AUCUN champ `phone`
 * filtrable côté serveur pour `GET /customers` (vérifié : ni dans la
 * référence de l'endpoint, ni dans le guide de filtrage dédié). La seule
 * façon de rechercher par téléphone est donc de parcourir la liste des
 * clients et comparer côté serveur PERF'EXHAUST, normalisé. Ce parcours est
 * borné (`PENNYLANE_V2_PHONE_SEARCH_MAX_PAGES` pages de
 * `PENNYLANE_V2_PHONE_SEARCH_PAGE_SIZE`) pour ne jamais consommer un volume
 * de requêtes disproportionné — si la limite est atteinte avant d'avoir
 * parcouru tout le fichier client, la recherche est signalée incomplète
 * (voir `truncated`) plutôt que de silencieusement manquer un client plus
 * loin dans la liste. Voir docs/MAINTENANCE.md § "Limites connues de l'API".
 */
export async function searchCustomersByPhone(
  phone: string
): Promise<{ matches: PennylaneCustomer[]; truncated: boolean }> {
  const normalizedTarget = normalizePhoneFR(phone)
  const { items, truncated } = await fetchAllPennylanePages<PennylaneCustomer>(
    '/customers',
    { limit: PENNYLANE_V2_PHONE_SEARCH_PAGE_SIZE },
    PENNYLANE_V2_PHONE_SEARCH_MAX_PAGES
  )
  const matches = items.filter((c) => c.phone && normalizePhoneFR(c.phone) === normalizedTarget)
  return { matches, truncated }
}

export async function getCustomer(id: number): Promise<PennylaneCustomer> {
  return pennylaneV2Request<PennylaneCustomer>(`/customers/${id}`, { retryOnTransientError: true })
}

/**
 * Création — jamais réessayée automatiquement (POST non idempotent). En cas
 * d'échec, l'appelant (sync.ts) enregistre l'erreur ; une nouvelle tentative
 * ne peut venir que d'une action explicite de l'admin, qui repasse par la
 * recherche complète avant toute création — aucun risque de doublon même en
 * cas de nouvel essai manuel après un échec partiel.
 */
export async function createIndividualCustomer(input: CreateIndividualCustomerInput): Promise<PennylaneCustomer> {
  return pennylaneV2Request<PennylaneCustomer>('/individual_customers', { method: 'POST', body: input })
}

/** Non utilisée par le flux actuel (le formulaire ne collecte pas d'informations société) — prête pour une évolution future du formulaire. */
export async function createCompanyCustomer(input: CreateCompanyCustomerInput): Promise<PennylaneCustomer> {
  return pennylaneV2Request<PennylaneCustomer>('/company_customers', { method: 'POST', body: input })
}
