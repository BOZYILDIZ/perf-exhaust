/**
 * Contenu HTML des emails liés aux rendez-vous — fonctions pures (aucun
 * accès réseau/DB, aucun envoi). L'envoi effectif (Resend) reste centralisé
 * dans src/lib/email.ts, qui appelle ces builders.
 */
import { formatParisDate, formatParisTime } from './timezone'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export interface AppointmentEmailContext {
  customerFirstName: string
  vehicle: string
  startAt: Date
  endAt: Date
  durationMinutes: number
  workshopAddress: string
  workshopPhone: string
  /** null = pas de lien affiché (ex: notification interne à l'atelier). */
  cancellationUrl: string | null
}

function shell(title: string, bodyHtml: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#ffffff;padding:32px">
      <img src="https://perfexhaust.fr/brand/logo-light.png" alt="PERF'EXHAUST" width="160" style="display:block;margin-bottom:20px" />
      <h2 style="color:#1266ea">${title}</h2>
      ${bodyHtml}
      <hr style="border-color:#333;margin:24px 0"/>
      <p style="color:#aaa;font-size:12px">PERF'EXHAUST — Échappements sur mesure</p>
    </div>
  `
}

function detailsBlock(ctx: AppointmentEmailContext): string {
  return `
    <table style="width:100%;margin:16px 0;border-collapse:collapse">
      <tr><td style="color:#888;padding:4px 0;width:120px">Date</td><td style="color:#fff;font-weight:bold">${escapeHtml(formatParisDate(ctx.startAt))}</td></tr>
      <tr><td style="color:#888;padding:4px 0">Heure</td><td style="color:#fff;font-weight:bold">${escapeHtml(formatParisTime(ctx.startAt))}</td></tr>
      <tr><td style="color:#888;padding:4px 0">Durée</td><td style="color:#fff">${ctx.durationMinutes} minutes</td></tr>
      <tr><td style="color:#888;padding:4px 0">Véhicule</td><td style="color:#fff">${escapeHtml(ctx.vehicle)}</td></tr>
      <tr><td style="color:#888;padding:4px 0">Adresse atelier</td><td style="color:#fff">${escapeHtml(ctx.workshopAddress)}</td></tr>
      <tr><td style="color:#888;padding:4px 0">Téléphone</td><td style="color:#fff">${escapeHtml(ctx.workshopPhone)}</td></tr>
    </table>
  `
}

function cancellationNotice(ctx: AppointmentEmailContext): string {
  if (!ctx.cancellationUrl) return ''
  return `
    <p style="color:#ccc;font-size:14px;margin-top:20px">Un empêchement ? Vous pouvez annuler votre rendez-vous en ligne jusqu'à 48 heures avant l'horaire prévu.</p>
    <p style="margin:16px 0">
      <a href="${ctx.cancellationUrl}" style="background:#1266ea;color:#fff;padding:12px 24px;text-decoration:none;font-weight:bold;display:inline-block">Annuler mon rendez-vous</a>
    </p>
    <p style="color:#888;font-size:13px">À moins de 48 heures du rendez-vous, merci de contacter directement l'atelier au ${escapeHtml(ctx.workshopPhone)}.</p>
  `
}

export function buildAppointmentConfirmationEmailHtml(ctx: AppointmentEmailContext): string {
  return shell(
    'Votre rendez-vous est confirmé ✓',
    `
      <p>Bonjour ${escapeHtml(ctx.customerFirstName)},</p>
      <p>Votre rendez-vous a été confirmé.</p>
      ${detailsBlock(ctx)}
      <p style="color:#ccc;font-size:14px">Merci de nous prévenir en cas d'empêchement.</p>
      ${cancellationNotice(ctx)}
    `
  )
}

export function buildAppointmentModifiedEmailHtml(ctx: AppointmentEmailContext): string {
  return shell(
    'Votre rendez-vous a été déplacé',
    `
      <p>Bonjour ${escapeHtml(ctx.customerFirstName)},</p>
      <p>Votre rendez-vous a été déplacé — voici le nouveau créneau :</p>
      ${detailsBlock(ctx)}
      <p style="color:#ccc;font-size:14px">Merci de nous prévenir en cas d'empêchement.</p>
      ${cancellationNotice(ctx)}
    `
  )
}

export function buildAppointmentCancelledByWorkshopEmailHtml(ctx: AppointmentEmailContext): string {
  return shell(
    'Votre rendez-vous a été annulé',
    `
      <p>Bonjour ${escapeHtml(ctx.customerFirstName)},</p>
      <p>Votre rendez-vous du ${escapeHtml(formatParisDate(ctx.startAt))} à ${escapeHtml(formatParisTime(ctx.startAt))} a été annulé par l'atelier.</p>
      <p style="color:#ccc;font-size:14px">N'hésitez pas à nous contacter au ${escapeHtml(ctx.workshopPhone)} pour convenir d'un nouveau créneau.</p>
    `
  )
}

export function buildAppointmentCancelledByCustomerEmailHtml(ctx: AppointmentEmailContext): string {
  return shell(
    'Votre rendez-vous a bien été annulé',
    `
      <p>Bonjour ${escapeHtml(ctx.customerFirstName)},</p>
      <p>Votre rendez-vous du ${escapeHtml(formatParisDate(ctx.startAt))} à ${escapeHtml(formatParisTime(ctx.startAt))} a bien été annulé, comme demandé.</p>
      <p style="color:#ccc;font-size:14px">Besoin d'un nouveau rendez-vous ? Vous pouvez soumettre une nouvelle demande de devis à tout moment depuis notre site.</p>
      <p style="color:#888;font-size:13px">Pour toute question, contactez l'atelier au ${escapeHtml(ctx.workshopPhone)}.</p>
    `
  )
}

/**
 * Rappel 24h/1h avant le rendez-vous — jamais de lien d'annulation (le token
 * brut de la confirmation initiale n'est plus disponible, et en régénérer un
 * invaliderait silencieusement l'ancien lien déjà envoyé au client, voir
 * src/lib/agenda/reminders.ts/automation-runner.ts).
 */
export function buildAppointmentReminderEmailHtml(ctx: AppointmentEmailContext, kind: '24h' | '1h'): string {
  return shell(
    kind === '24h' ? 'Votre rendez-vous est demain' : 'Votre rendez-vous est dans 1 heure',
    `
      <p>Bonjour ${escapeHtml(ctx.customerFirstName)},</p>
      <p>${kind === '24h'
        ? 'Petit rappel : vous avez rendez-vous demain chez nous.'
        : 'Petit rappel : votre rendez-vous est dans environ 1 heure.'}</p>
      ${detailsBlock(ctx)}
      <p style="color:#888;font-size:13px">Un empêchement ? Contactez-nous au ${escapeHtml(ctx.workshopPhone)}.</p>
    `
  )
}

/** Notification interne à l'atelier quand un client annule lui-même en ligne. */
export function buildAppointmentCancelledNotificationToShopHtml(ctx: AppointmentEmailContext & { customerFullName: string; reason: string | null }): string {
  return shell(
    "Un client a annulé son rendez-vous",
    `
      <p><strong>${escapeHtml(ctx.customerFullName)}</strong> a annulé son rendez-vous du ${escapeHtml(formatParisDate(ctx.startAt))} à ${escapeHtml(formatParisTime(ctx.startAt))} (${escapeHtml(ctx.vehicle)}).</p>
      ${ctx.reason ? `<p style="color:#ccc;font-size:14px"><strong>Motif indiqué :</strong> ${escapeHtml(ctx.reason)}</p>` : ''}
      <p style="color:#888;font-size:13px">Le créneau a été automatiquement libéré dans l'agenda.</p>
    `
  )
}
