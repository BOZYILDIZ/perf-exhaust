import { parisWallTimeToUtc, parisDateString } from './timezone'

export type AgendaView = 'day' | 'week' | 'month'

export interface CalendarRange {
  from: Date
  to: Date
  /** Libellé lisible de la période (ex: "Semaine du 10 au 16 août 2026"). */
  label: string
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Lundi de la semaine (calendrier Paris) contenant `dateStr`. */
function mondayOf(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const jsDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay() // 0=dimanche..6=samedi
  const diffToMonday = jsDay === 0 ? 6 : jsDay - 1
  return addDays(dateStr, -diffToMonday)
}

function firstOfMonth(dateStr: string): string {
  return `${dateStr.slice(0, 7)}-01`
}

function firstOfNextMonth(dateStr: string): string {
  const [y, m] = dateStr.split('-').map(Number)
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
  return `${next}-01`
}

const MONTH_LABELS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

function labelDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${d} ${MONTH_LABELS[m - 1]} ${y}`
}

/** Calcule la fenêtre [from, to) pour une vue/date données — `dateStr` = "AAAA-MM-JJ" (calendrier Paris). */
export function computeCalendarRange(view: AgendaView, dateStr: string): CalendarRange {
  if (view === 'day') {
    const to = addDays(dateStr, 1)
    return { from: parisWallTimeToUtc(dateStr, '00:00'), to: parisWallTimeToUtc(to, '00:00'), label: labelDate(dateStr) }
  }
  if (view === 'month') {
    const from = firstOfMonth(dateStr);
    const to = firstOfNextMonth(dateStr)
    const [y, m] = dateStr.split('-').map(Number)
    return { from: parisWallTimeToUtc(from, '00:00'), to: parisWallTimeToUtc(to, '00:00'), label: `${MONTH_LABELS[m - 1]} ${y}` }
  }
  const monday = mondayOf(dateStr)
  const nextMonday = addDays(monday, 7)
  const sunday = addDays(monday, 6)
  return {
    from: parisWallTimeToUtc(monday, '00:00'),
    to: parisWallTimeToUtc(nextMonday, '00:00'),
    label: `Semaine du ${labelDate(monday)} au ${labelDate(sunday)}`,
  }
}

/** Date ("AAAA-MM-JJ") à utiliser pour la navigation précédente/suivante. */
export function shiftDate(view: AgendaView, dateStr: string, direction: 1 | -1): string {
  if (view === 'day') return addDays(dateStr, direction)
  if (view === 'week') return addDays(dateStr, direction * 7)
  const [y, m] = dateStr.split('-').map(Number)
  const newMonth = m + direction
  if (newMonth < 1) return `${y - 1}-12-01`
  if (newMonth > 12) return `${y + 1}-01-01`
  return `${y}-${String(newMonth).padStart(2, '0')}-01`
}

export function todayParisDateString(): string {
  return parisDateString(new Date())
}

/** Bornes horaires (0-24) à afficher dans la grille horaire — dérivées des horaires configurés, avec un peu de marge. Repli 7h-19h si aucun jour actif. */
export function computeGridHourBounds(weeklyHours: import('./types').WeeklyHours): { startHour: number; endHour: number } {
  let minStart = 24
  let maxEnd = 0
  for (const day of Object.values(weeklyHours)) {
    if (!day.enabled) continue
    const candidates = [day.morningStart, day.afternoonStart].filter(Boolean)
    const endCandidates = [day.afternoonEnd || day.morningEnd, day.morningEnd].filter(Boolean)
    for (const t of candidates) minStart = Math.min(minStart, toHourFloat(t))
    for (const t of endCandidates) maxEnd = Math.max(maxEnd, toHourFloat(t))
  }
  if (minStart >= maxEnd) return { startHour: 7, endHour: 19 }
  return { startHour: Math.max(0, Math.floor(minStart) - 1), endHour: Math.min(24, Math.ceil(maxEnd) + 1) }
}

function toHourFloat(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h + m / 60
}
