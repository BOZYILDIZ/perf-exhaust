import { Resend } from 'resend'
import { getSiteSettings } from '@/lib/settings-repo'

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
  marque: string
  modele: string
  annee: string
  motorisation?: string
  typeProjet: string
  sonoritePreference: string
  description: string
  creneauSouhaite?: string
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
        <h3>Véhicule</h3>
        <p><strong>Véhicule:</strong> ${e.marque} ${e.modele} (${e.annee})</p>
        ${e.motorisation ? `<p><strong>Motorisation:</strong> ${e.motorisation}</p>` : ''}
        <h3>Projet</h3>
        <p><strong>Type de projet:</strong> ${e.typeProjet}</p>
        <p><strong>Sonorité souhaitée:</strong> ${e.sonoritePreference}</p>
        ${e.creneauSouhaite ? `<p><strong>Créneau souhaité:</strong> ${e.creneauSouhaite}</p>` : ''}
        <p><strong>Description:</strong></p>
        <p style="background:#f5f5f5;padding:12px;border-radius:4px">${e.description}</p>
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
