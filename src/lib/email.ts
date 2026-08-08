import { Resend } from 'resend'
import { getSiteSettings } from '@/lib/settings-repo'
import { rearDiffuserLabel } from '@/lib/quote-request-options'
import { buildAppointmentIcs } from '@/lib/agenda/ics'
import type { VehiclePhoto } from '@/lib/vehicle-photo-slots'
import {
  buildAppointmentConfirmationEmailHtml,
  buildAppointmentModifiedEmailHtml,
  buildAppointmentCancelledByWorkshopEmailHtml,
  buildAppointmentCancelledByCustomerEmailHtml,
  buildAppointmentCancelledNotificationToShopHtml,
  type AppointmentEmailContext,
} from '@/lib/agenda/email-templates'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

if (!process.env.RESEND_API_KEY && process.env.NODE_ENV === 'production') {
  console.warn(
    '[PERF\'EXHAUST] RESEND_API_KEY absente en production — les emails sont en mode mock, aucun message ne sera réellement envoyé.'
  )
}

const FROM_EMAIL = 'PERF\'EXHAUST <noreply@perfexhaust.fr>'
const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL || 'contact@perfexhaust.fr'

/** Neutralise le HTML dans les valeurs saisies par l'utilisateur avant interpolation dans les emails. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export interface AppointmentData {
  nom: string
  prenom: string
  telephone: string
  email: string
  /** Absente sur les demandes créées avant la collecte de l'adresse (2026-08-07) — jamais de repli, le bloc adresse est simplement omis de l'email dans ce cas (voir sendAppointmentToShop). */
  billingAddress?: string | null
  billingPostalCode?: string | null
  billingCity?: string | null
  marque: string
  modele: string
  annee: string
  motorisation?: string
  rearDiffuser: string
  typeProjet: string
  sonoritePreference: string
  description: string
  creneauSouhaite?: string
  /** Métadonnées uniquement (URL Vercel Blob, jamais le fichier) — ne jamais joindre en pièce jointe, voir sendAppointmentToShop. Jamais transmises à Pennylane. */
  photos?: VehiclePhoto[]
}

export async function sendAppointmentToShop(data: AppointmentData) {
  if (!resend) {
    console.log('[EMAIL MOCK] Appointment to shop:', data)
    return { success: true, mock: true }
  }
  const e = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, typeof v === 'string' ? escapeHtml(v) : v])
  ) as AppointmentData
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: BUSINESS_EMAIL,
    subject: `Nouvelle demande de devis — ${data.prenom} ${data.nom} — ${data.marque} ${data.modele}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <img src="https://perfexhaust.fr/brand/logo-horizontal.png" alt="PERF'EXHAUST" width="220" style="display:block;margin-bottom:16px" />
        <h2 style="color:#1266ea;border-bottom:2px solid #1266ea;padding-bottom:8px">Nouvelle demande de devis</h2>
        <h3>Informations client</h3>
        <p><strong>Nom:</strong> ${e.prenom} ${e.nom}</p>
        <p><strong>Téléphone:</strong> ${e.telephone}</p>
        <p><strong>Email:</strong> ${e.email}</p>
        ${data.billingAddress && data.billingPostalCode && data.billingCity
          ? `<h3>Adresse de facturation</h3>
        <p>${e.billingAddress}<br/>${e.billingPostalCode} ${e.billingCity}<br/>France</p>`
          : ''}
        <h3>Véhicule</h3>
        <p><strong>Véhicule:</strong> ${e.marque} ${e.modele} (${e.annee})</p>
        ${e.motorisation ? `<p><strong>Motorisation:</strong> ${e.motorisation}</p>` : ''}
        <p><strong>Diffuseur arrière:</strong> ${escapeHtml(rearDiffuserLabel(data.rearDiffuser))}</p>
        <h3>Projet</h3>
        <p><strong>Type de projet:</strong> ${e.typeProjet}</p>
        <p><strong>Sonorité souhaitée:</strong> ${e.sonoritePreference}</p>
        ${e.creneauSouhaite ? `<p><strong>Créneau souhaité:</strong> ${e.creneauSouhaite}</p>` : ''}
        <p><strong>Description:</strong></p>
        <p style="background:#f5f5f5;padding:12px;border-radius:4px">${e.description}</p>
        ${data.photos && data.photos.length > 0
          ? `<p style="color:#1266ea"><strong>Le client a joint ${data.photos.length} photo${data.photos.length > 1 ? 's' : ''}.</strong><br/>Consultez-les depuis le panel administrateur.</p>`
          : ''}
      </div>
    `,
  })
  if (error) throw new Error(`Resend (devis atelier): ${error.message}`)
  return { success: true }
}

export async function sendConfirmationToClient(data: AppointmentData) {
  if (!resend) {
    console.log('[EMAIL MOCK] Confirmation to client:', data.email)
    return { success: true, mock: true }
  }
  const settings = await getSiteSettings()
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: data.email,
    subject: 'Votre demande de devis PERF\'EXHAUST — Confirmation',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#ffffff;padding:32px">
        <img src="https://perfexhaust.fr/brand/logo-light.png" alt="PERF'EXHAUST" width="160" style="display:block;margin-bottom:20px" />
        <h2 style="color:#1266ea">Demande reçue ✓</h2>
        <p>Bonjour ${escapeHtml(data.prenom)},</p>
        <p>Votre demande de devis pour votre <strong>${escapeHtml(data.marque)} ${escapeHtml(data.modele)}</strong> a bien été reçue.</p>
        <p>Notre équipe va analyser votre projet et vous recontactera dans les <strong>24 à 48h</strong> pour vous transmettre un devis personnalisé.</p>
        <hr style="border-color:#333;margin:24px 0"/>
        <p style="color:#aaa;font-size:14px">${escapeHtml(settings.businessName)} — ${escapeHtml(settings.city)}, Alsace · ${escapeHtml(settings.phone)}<br/>Échappements sur mesure · Soudure inox · Sonorité personnalisée</p>
      </div>
    `,
  })
  if (error) throw new Error(`Resend (confirmation client): ${error.message}`)
  return { success: true }
}

export interface AppointmentEmailInput {
  customerEmail: string
  customerFirstName: string
  vehicle: string
  startAt: Date
  endAt: Date
  durationMinutes: number
  appointmentId: string
  /** null = pas de lien d'annulation dans l'email (ex: rendez-vous créé sans configuration agenda encore complète). */
  cancellationUrl: string | null
}

async function buildIcsAttachment(input: AppointmentEmailInput) {
  const ics = buildAppointmentIcs({
    uid: input.appointmentId,
    startAt: input.startAt,
    endAt: input.endAt,
    summary: `Rendez-vous PERF'EXHAUST — ${input.vehicle}`,
    description: `Rendez-vous atelier PERF'EXHAUST pour ${input.vehicle}.`,
    location: '', // renseigné par le contexte email (adresse déjà dans le corps du message)
  })
  return { filename: 'rendez-vous-perfexhaust.ics', content: ics, contentType: 'text/calendar; charset=utf-8; method=PUBLISH' }
}

async function emailContext(input: AppointmentEmailInput): Promise<AppointmentEmailContext> {
  const settings = await getSiteSettings()
  return {
    customerFirstName: input.customerFirstName,
    vehicle: input.vehicle,
    startAt: input.startAt,
    endAt: input.endAt,
    durationMinutes: input.durationMinutes,
    workshopAddress: `${settings.address}, ${settings.postalCode} ${settings.city}`,
    workshopPhone: settings.phone,
    cancellationUrl: input.cancellationUrl,
  }
}

/** Envoyée par createAppointment (src/lib/agenda/appointments.ts) — best-effort, ne bloque jamais la création du rendez-vous en cas d'échec (voir appelant). */
export async function sendAppointmentConfirmationEmail(input: AppointmentEmailInput) {
  const ctx = await emailContext(input)
  if (!resend) {
    console.log('[EMAIL MOCK] Appointment confirmation:', input.customerEmail, input.startAt.toISOString())
    return { success: true, mock: true }
  }
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: input.customerEmail,
    subject: "Votre rendez-vous PERF'EXHAUST est confirmé",
    html: buildAppointmentConfirmationEmailHtml(ctx),
    attachments: [await buildIcsAttachment(input)],
  })
  if (error) throw new Error(`Resend (confirmation rendez-vous): ${error.message}`)
  return { success: true }
}

/** Envoyée par rescheduleAppointment — nouveau créneau, nouveau lien d'annulation (l'ancien token est déjà invalidé côté appelant). */
export async function sendAppointmentModifiedEmail(input: AppointmentEmailInput) {
  const ctx = await emailContext(input)
  if (!resend) {
    console.log('[EMAIL MOCK] Appointment modified:', input.customerEmail, input.startAt.toISOString())
    return { success: true, mock: true }
  }
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: input.customerEmail,
    subject: "Votre rendez-vous PERF'EXHAUST a été déplacé",
    html: buildAppointmentModifiedEmailHtml(ctx),
    attachments: [await buildIcsAttachment(input)],
  })
  if (error) throw new Error(`Resend (modification rendez-vous): ${error.message}`)
  return { success: true }
}

/** Annulation initiée par l'atelier (admin) — voir sendAppointmentCancelledByCustomerEmail pour l'annulation initiée par le client. */
export async function sendAppointmentCancelledByWorkshopEmail(input: Omit<AppointmentEmailInput, 'cancellationUrl'>) {
  const ctx = await emailContext({ ...input, cancellationUrl: null })
  if (!resend) {
    console.log('[EMAIL MOCK] Appointment cancelled by workshop:', input.customerEmail)
    return { success: true, mock: true }
  }
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: input.customerEmail,
    subject: "Votre rendez-vous PERF'EXHAUST a été annulé",
    html: buildAppointmentCancelledByWorkshopEmailHtml(ctx),
  })
  if (error) throw new Error(`Resend (annulation atelier): ${error.message}`)
  return { success: true }
}

/** Confirmation envoyée au CLIENT après une annulation qu'il a lui-même demandée (page publique sécurisée, étape 7). */
export async function sendAppointmentCancelledByCustomerEmail(input: Omit<AppointmentEmailInput, 'cancellationUrl'>) {
  const ctx = await emailContext({ ...input, cancellationUrl: null })
  if (!resend) {
    console.log('[EMAIL MOCK] Appointment cancelled by customer (client email):', input.customerEmail)
    return { success: true, mock: true }
  }
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: input.customerEmail,
    subject: "Votre rendez-vous PERF'EXHAUST a été annulé",
    html: buildAppointmentCancelledByCustomerEmailHtml(ctx),
  })
  if (error) throw new Error(`Resend (annulation client, email client): ${error.message}`)
  return { success: true }
}

/** Notification interne à l'atelier (BUSINESS_EMAIL) quand un client annule lui-même en ligne. */
export async function sendAppointmentCancelledNotificationToShop(
  input: Omit<AppointmentEmailInput, 'cancellationUrl' | 'customerEmail'> & { customerFullName: string; reason: string | null }
) {
  const ctx = await emailContext({ ...input, cancellationUrl: null, customerEmail: BUSINESS_EMAIL })
  if (!resend) {
    console.log('[EMAIL MOCK] Appointment cancelled by customer (shop notification):', input.customerFullName)
    return { success: true, mock: true }
  }
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: BUSINESS_EMAIL,
    subject: `Rendez-vous annulé par le client — ${input.customerFullName}`,
    html: buildAppointmentCancelledNotificationToShopHtml({ ...ctx, customerFullName: input.customerFullName, reason: input.reason }),
  })
  if (error) throw new Error(`Resend (annulation client, notification atelier): ${error.message}`)
  return { success: true }
}
