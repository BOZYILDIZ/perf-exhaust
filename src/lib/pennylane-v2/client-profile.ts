import 'server-only'
import { getDb } from '@/lib/db'
import { isPennylaneV2Configured } from './config'
import { getCustomer } from './customers'
import { customerDisplayName } from './types'
import { getCustomerFinancials, type CustomerFinancials } from './financials'
import { buildVehicleHistory, type VehicleHistoryEntry } from './vehicles'
import { computeClientBadge, type ClientBadge } from './badge'
import { buildClientTimeline, type TimelineEvent } from './timeline'

export interface ClientCard {
  nom: string
  email: string
  telephone: string
  /** Adresse de facturation RÉELLE du client (QuoteRequest.billingAddress), jamais celle de l'atelier — null si la demande a été créée avant le 2026-08-07 (afficher "Adresse non renseignée"). */
  billingAddress: string | null
  billingPostalCode: string | null
  billingCity: string | null
  vehicleCount: number
  quoteCount: number
  invoiceCount: number
  totalBilled: number
  lastInterventionDate: string | null
  lastSyncAt: string | null
}

export interface AppointmentSummary {
  id: string
  quoteRequestId: string
  startAt: string
  endAt: string
  durationMinutes: number
  status: string
  vehicle: string
}

export interface ClientProfile {
  configured: boolean
  /** null si le client n'a encore jamais été synchronisé avec Pennylane. */
  pennylaneCustomerId: number | null
  pennylaneCustomerName: string | null
  /** Date de création du client Pennylane (`created_at`, confirmé réel) — jamais disponible avant la première synchronisation réussie. */
  pennylaneCreatedAt: string | null
  requestCount: number
  vehicles: VehicleHistoryEntry[]
  badge: ClientBadge
  timeline: TimelineEvent[]
  card: ClientCard
  financials: CustomerFinancials
  /** Message d'erreur propre (jamais de stack trace) si la récupération du client Pennylane a échoué — n'empêche jamais l'affichage du reste du profil. */
  customerFetchError: string | null
  /** Rendez-vous atelier — indépendant de Pennylane (voir src/lib/agenda/), agrégé sur les mêmes demandes soeurs. */
  nextAppointment: AppointmentSummary | null
  appointmentHistory: AppointmentSummary[]
}

/**
 * Agrège le profil complet d'un client autour d'une demande — regroupe
 * toutes les demandes locales partageant le même `pennylaneCustomerId`
 * (aucune table Client dédiée, voir docs/MAINTENANCE.md § "Intégration
 * Pennylane API v2"). N'appelle Pennylane qu'au travers de
 * `getCustomerFinancials` (déjà mis en cache, voir cache.ts) et d'un seul
 * appel `getCustomer` pour le nom/la date de création — jamais plus d'appels
 * réseau que l'ancienne section Pennylane n'en faisait déjà.
 */
export async function getClientProfile(quoteRequestId: string): Promise<ClientProfile | null> {
  const db = getDb()
  const current = await db.quoteRequest.findUnique({
    where: { id: quoteRequestId },
    select: {
      id: true, nom: true, prenom: true, email: true, telephone: true,
      billingAddress: true, billingPostalCode: true, billingCity: true,
      marque: true, modele: true, annee: true, motorisation: true,
      createdAt: true, pennylaneCustomerId: true, pennylaneCustomerSyncedAt: true,
      pennylaneCustomerLastSyncAt: true,
    },
  })
  if (!current) return null

  const siblings = current.pennylaneCustomerId
    ? await db.quoteRequest.findMany({
        where: { pennylaneCustomerId: current.pennylaneCustomerId },
        select: {
          id: true, marque: true, modele: true, annee: true, motorisation: true,
          createdAt: true, pennylaneCustomerSyncedAt: true,
          appointment: { select: { id: true, startAt: true, endAt: true, durationMinutes: true, status: true, vehicle: true } },
        },
        orderBy: { createdAt: 'asc' },
      })
    : [{
        id: current.id, marque: current.marque, modele: current.modele, annee: current.annee, motorisation: current.motorisation,
        createdAt: current.createdAt, pennylaneCustomerSyncedAt: null,
        appointment: await db.appointment.findUnique({
          where: { quoteRequestId: current.id },
          select: { id: true, startAt: true, endAt: true, durationMinutes: true, status: true, vehicle: true },
        }),
      }]

  let pennylaneCustomerName: string | null = null
  let pennylaneCreatedAt: string | null = null
  let customerFetchError: string | null = null

  if (current.pennylaneCustomerId) {
    try {
      const customer = await getCustomer(Number(current.pennylaneCustomerId))
      pennylaneCustomerName = customerDisplayName(customer)
      pennylaneCreatedAt = customer.created_at ?? null
    } catch {
      // Erreur volontairement générique — jamais de détail technique/stack trace affiché à l'admin.
      customerFetchError = 'Client introuvable dans Pennylane (supprimé ou identifiant invalide).'
    }
  }

  const financials = await getCustomerFinancials(quoteRequestId)

  const vehicles = buildVehicleHistory(
    siblings.map((s) => ({ marque: s.marque, modele: s.modele, annee: s.annee, motorisation: s.motorisation }))
  )

  const hasPendingQuote = financials.quotesStats.pending > 0
  const hasUnpaidInvoice = financials.summary.hasUnpaid
  const badge = computeClientBadge({ requestCount: siblings.length, hasUnpaidInvoice, hasPendingQuote })

  const timeline = buildClientTimeline(
    siblings.map((s) => ({ id: s.id, createdAt: s.createdAt.toISOString(), pennylaneCustomerSyncedAt: s.pennylaneCustomerSyncedAt ? s.pennylaneCustomerSyncedAt.toISOString() : null })),
    financials.quotes,
    financials.invoices
  )

  const lastSyncAt = current.pennylaneCustomerLastSyncAt
    ? current.pennylaneCustomerLastSyncAt.toISOString()
    : (financials.fetchedAt ? financials.fetchedAt.toISOString() : null)

  const appointmentHistory: AppointmentSummary[] = siblings
    .filter((s): s is typeof s & { appointment: NonNullable<typeof s.appointment> } => Boolean(s.appointment))
    .map((s) => ({
      id: s.appointment.id,
      quoteRequestId: s.id,
      startAt: s.appointment.startAt.toISOString(),
      endAt: s.appointment.endAt.toISOString(),
      durationMinutes: s.appointment.durationMinutes,
      status: s.appointment.status,
      vehicle: s.appointment.vehicle,
    }))
    .sort((a, b) => (a.startAt < b.startAt ? 1 : -1)) // plus récent en premier

  const now = new Date().toISOString()
  const nextAppointment = appointmentHistory
    .filter((a) => (a.status === 'PENDING' || a.status === 'CONFIRMED') && a.startAt >= now)
    .sort((a, b) => (a.startAt < b.startAt ? -1 : 1))[0] ?? null

  const card: ClientCard = {
    nom: `${current.prenom} ${current.nom}`,
    email: current.email,
    telephone: current.telephone,
    billingAddress: current.billingAddress,
    billingPostalCode: current.billingPostalCode,
    billingCity: current.billingCity,
    vehicleCount: vehicles.length,
    quoteCount: financials.quotesStats.count,
    invoiceCount: financials.summary.count,
    totalBilled: financials.summary.totalBilled,
    lastInterventionDate: financials.summary.lastInvoiceDate,
    lastSyncAt,
  }

  return {
    configured: isPennylaneV2Configured(),
    pennylaneCustomerId: current.pennylaneCustomerId ? Number(current.pennylaneCustomerId) : null,
    pennylaneCustomerName,
    pennylaneCreatedAt,
    requestCount: siblings.length,
    vehicles,
    badge,
    timeline,
    card,
    financials,
    customerFetchError,
    nextAppointment,
    appointmentHistory,
  }
}
