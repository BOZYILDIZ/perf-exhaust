/**
 * Conversions Europe/Paris — aucune dépendance externe (Intl natif), gère
 * automatiquement le changement heure d'été/heure d'hiver puisque Intl
 * connaît les vraies dates de transition françaises pour chaque année.
 *
 * Contexte : les horaires atelier sont saisis en heure murale française
 * ("08:00"), mais tout est stocké en UTC (Prisma DateTime). Le serveur
 * (Vercel) tourne en UTC — sans cette conversion explicite, une heure
 * "08:00" saisie serait stockée comme 08:00 UTC (= 09:00 ou 10:00 heure de
 * Paris selon la saison), ce qui décale silencieusement tout l'agenda.
 */

const PARIS_TZ = 'Europe/Paris'

function parisOffsetMinutes(utcInstant: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: PARIS_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
  const parts = dtf.formatToParts(utcInstant)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  // Intl peut renvoyer "24" pour minuit avec hour12:false — normalisé à 0.
  const hour = get('hour') % 24
  const asIfUtc = Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'))
  return Math.round((asIfUtc - utcInstant.getTime()) / 60000)
}

/** Convertit une date ("AAAA-MM-JJ") + heure murale Paris ("HH:MM") en instant UTC réel. */
export function parisWallTimeToUtc(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [hh, mm] = timeStr.split(':').map(Number)
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm))
  const offsetMin = parisOffsetMinutes(guess)
  // Paris = UTC + offsetMin  ⇒  UTC = heure murale − offsetMin
  return new Date(guess.getTime() - offsetMin * 60000)
}

/** Date ("AAAA-MM-JJ") du jour civil Paris pour un instant UTC donné. */
export function parisDateString(utcInstant: Date): string {
  const dtf = new Intl.DateTimeFormat('en-CA', { timeZone: PARIS_TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
  return dtf.format(utcInstant) // en-CA => "AAAA-MM-JJ"
}

const WEEKDAY_FROM_INTL: Record<string, import('./types').WeekdayKey> = {
  Mon: 'mon', Tue: 'tue', Wed: 'wed', Thu: 'thu', Fri: 'fri', Sat: 'sat', Sun: 'sun',
}

/** Jour de la semaine (calendrier Paris) pour un instant UTC donné. */
export function parisWeekday(utcInstant: Date): import('./types').WeekdayKey {
  const short = new Intl.DateTimeFormat('en-US', { timeZone: PARIS_TZ, weekday: 'short' }).format(utcInstant)
  return WEEKDAY_FROM_INTL[short] ?? 'mon'
}

/** Formatage d'affichage — toujours Europe/Paris, jamais le fuseau du serveur. */
export function formatParisDate(utcInstant: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: PARIS_TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(utcInstant)
}

export function formatParisTime(utcInstant: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: PARIS_TZ, hour: '2-digit', minute: '2-digit' }).format(utcInstant)
}

export function formatParisDateTime(utcInstant: Date): string {
  return `${formatParisDate(utcInstant)} à ${formatParisTime(utcInstant)}`
}
