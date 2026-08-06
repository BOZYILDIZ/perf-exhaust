/**
 * Génération de fichier .ics (RFC 5545) — fait main, aucune dépendance
 * externe, aucune API tierce (Google/Apple/Outlook). Le client ouvre le
 * fichier joint à l'email avec l'application de calendrier de son choix.
 */

function toIcsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

/** Échappe les caractères spéciaux du format iCalendar (virgule, point-virgule, retour à la ligne, antislash). */
function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/** Découpe les lignes trop longues à 75 octets avec un retour à la ligne + espace, comme l'exige RFC 5545. */
function foldLine(line: string): string {
  if (line.length <= 75) return line
  let result = ''
  let rest = line
  while (rest.length > 75) {
    result += rest.slice(0, 75) + '\r\n '
    rest = rest.slice(75)
  }
  return result + rest
}

export interface IcsEventInput {
  uid: string
  startAt: Date
  endAt: Date
  summary: string
  description: string
  location: string
}

export function buildAppointmentIcs(event: IcsEventInput): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    "PRODID:-//PERF'EXHAUST//Agenda//FR",
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}@perfexhaust.fr`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(event.startAt)}`,
    `DTEND:${toIcsUtc(event.endAt)}`,
    `SUMMARY:${escapeIcsText(event.summary)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    `LOCATION:${escapeIcsText(event.location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(foldLine).join('\r\n') + '\r\n'
}
