import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const FROM_EMAIL = 'PERF\'EXHAUST <noreply@perfexhaust.fr>'
const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL || 'contact@perfexhaust.fr'

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
  await resend.emails.send({
    from: FROM_EMAIL,
    to: BUSINESS_EMAIL,
    subject: `Nouvelle demande de devis — ${data.prenom} ${data.nom} — ${data.marque} ${data.modele}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1266ea;border-bottom:2px solid #1266ea;padding-bottom:8px">Nouvelle demande de devis</h2>
        <h3>Informations client</h3>
        <p><strong>Nom:</strong> ${data.prenom} ${data.nom}</p>
        <p><strong>Téléphone:</strong> ${data.telephone}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <h3>Véhicule</h3>
        <p><strong>Véhicule:</strong> ${data.marque} ${data.modele} (${data.annee})</p>
        ${data.motorisation ? `<p><strong>Motorisation:</strong> ${data.motorisation}</p>` : ''}
        <h3>Projet</h3>
        <p><strong>Type de projet:</strong> ${data.typeProjet}</p>
        <p><strong>Sonorité souhaitée:</strong> ${data.sonoritePreference}</p>
        ${data.creneauSouhaite ? `<p><strong>Créneau souhaité:</strong> ${data.creneauSouhaite}</p>` : ''}
        <p><strong>Description:</strong></p>
        <p style="background:#f5f5f5;padding:12px;border-radius:4px">${data.description}</p>
      </div>
    `,
  })
  return { success: true }
}

export async function sendConfirmationToClient(data: AppointmentData) {
  if (!resend) {
    console.log('[EMAIL MOCK] Confirmation to client:', data.email)
    return { success: true, mock: true }
  }
  await resend.emails.send({
    from: FROM_EMAIL,
    to: data.email,
    subject: 'Votre demande de devis PERF\'EXHAUST — Confirmation',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#ffffff;padding:32px">
        <h2 style="color:#1266ea">Demande reçue ✓</h2>
        <p>Bonjour ${data.prenom},</p>
        <p>Votre demande de devis pour votre <strong>${data.marque} ${data.modele}</strong> a bien été reçue.</p>
        <p>Notre équipe va analyser votre projet et vous recontactera dans les <strong>24 à 48h</strong> pour vous transmettre un devis personnalisé.</p>
        <hr style="border-color:#333;margin:24px 0"/>
        <p style="color:#aaa;font-size:14px">PERF'EXHAUST — Rountzenheim-Auenheim, Alsace<br/>Échappements sur mesure · Soudure inox · Sonorité personnalisée</p>
      </div>
    `,
  })
  return { success: true }
}
