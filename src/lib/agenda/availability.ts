/**
 * Moteur de calcul des disponibilités — fonction pure, aucun accès
 * réseau/DB. Prend en entrée un instantané des données (horaires,
 * fermetures, rendez-vous existants) et renvoie les créneaux réellement
 * disponibles. Testable en isolation, sans mock — voir le fichier de tests.
 */
import { parisWallTimeToUtc, parisDateString, parisWeekday } from './timezone'
import type { DayHours, WeeklyHours, TimeSlot, ExistingAppointmentWindow } from './types'

/** Granularité de balayage des créneaux à l'intérieur d'un horaire — fine
 * pour proposer tout créneau réellement libre (ex: 08:00, 10:30, 14:00,
 * 16:15), pas seulement une grille alignée sur la durée depuis l'ouverture. */
const SLOT_GRANULARITY_MINUTES = 15

export interface ComputeAvailableSlotsParams {
  /** Début de la fenêtre de recherche (instant UTC). */
  from: Date
  /** Fin de la fenêtre de recherche, exclusive (instant UTC). */
  to: Date
  durationMinutes: number
  weeklyHours: WeeklyHours
  bufferMinutes: number
  /** Dates ("AAAA-MM-JJ") entièrement fermées — fermetures exceptionnelles. */
  closures: Set<string>
  /** Rendez-vous existants à respecter (déjà filtrés par l'appelant sur les statuts bloquants). */
  existingAppointments: ExistingAppointmentWindow[]
  /** Horloge de référence — un créneau ne peut jamais commencer dans le passé. Paramètre injecté pour rester testable (jamais Date.now() en dur). */
  now: Date
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/**
 * Créneaux d'un jour où chercher — le matin, l'après-midi, et (uniquement si
 * la durée demandée ne rentre dans aucun des deux seuls) une "journée
 * continue" matin→soir englobant la pause déjeuner. Un rendez-vous "journée
 * complète"/"demi-journée longue" occupe le véhicule sur la pause déjeuner
 * (personne d'autre n'y serait de toute façon réservé) ; un rendez-vous
 * court, lui, ne doit jamais être proposé pendant la pause — d'où la
 * condition : la journée continue n'est ajoutée que si nécessaire, pour ne
 * jamais produire deux fois le même créneau court.
 */
function shiftsOf(day: DayHours, durationMinutes: number): { start: string; end: string }[] {
  const shifts: { start: string; end: string }[] = []
  const hasMorning = Boolean(day.morningStart && day.morningEnd)
  const hasAfternoon = Boolean(day.afternoonStart && day.afternoonEnd)
  if (hasMorning) shifts.push({ start: day.morningStart, end: day.morningEnd })
  if (hasAfternoon) shifts.push({ start: day.afternoonStart, end: day.afternoonEnd })

  if (hasMorning && hasAfternoon) {
    const fitsMorning = toMinutes(day.morningEnd) - toMinutes(day.morningStart) >= durationMinutes
    const fitsAfternoon = toMinutes(day.afternoonEnd) - toMinutes(day.afternoonStart) >= durationMinutes
    if (!fitsMorning && !fitsAfternoon) {
      shifts.push({ start: day.morningStart, end: day.afternoonEnd })
    }
  }
  return shifts
}

/** Vrai si [start, end) chevauche un rendez-vous existant, marge tampon appliquée symétriquement de part et d'autre de CHAQUE rendez-vous existant. */
function overlapsExisting(start: Date, end: Date, existing: ExistingAppointmentWindow[], bufferMinutes: number): boolean {
  const bufferMs = bufferMinutes * 60000
  return existing.some((e) => {
    const expandedStart = e.startAt.getTime() - bufferMs
    const expandedEnd = e.endAt.getTime() + bufferMs
    return start.getTime() < expandedEnd && end.getTime() > expandedStart
  })
}

export function computeAvailableSlots(params: ComputeAvailableSlotsParams): TimeSlot[] {
  const { from, to, durationMinutes, weeklyHours, bufferMinutes, closures, existingAppointments, now } = params
  if (durationMinutes <= 0) return []

  const slots: TimeSlot[] = []
  const durationMs = durationMinutes * 60000
  const stepMs = SLOT_GRANULARITY_MINUTES * 60000

  // Parcours jour par jour, calendrier Paris (un jour "civil" Paris peut ne
  // pas correspondre à un jour UTC selon l'heure — on itère sur les dates
  // Paris rencontrées dans la fenêtre plutôt que sur les jours UTC).
  const seenDates = new Set<string>()
  for (let cursor = new Date(from); cursor.getTime() < to.getTime(); cursor = new Date(cursor.getTime() + 24 * 3600000)) {
    seenDates.add(parisDateString(cursor))
  }
  seenDates.add(parisDateString(to))

  const sortedDates = Array.from(seenDates).sort()

  for (const dateStr of sortedDates) {
    if (closures.has(dateStr)) continue

    const weekday = parisWeekday(parisWallTimeToUtc(dateStr, '12:00')) // midi = jamais ambigu autour d'une transition DST
    const dayHours = weeklyHours[weekday]
    if (!dayHours?.enabled) continue

    for (const shift of shiftsOf(dayHours, durationMinutes)) {
      const shiftStart = parisWallTimeToUtc(dateStr, shift.start)
      const shiftEnd = parisWallTimeToUtc(dateStr, shift.end)

      for (let candidateMs = shiftStart.getTime(); candidateMs + durationMs <= shiftEnd.getTime(); candidateMs += stepMs) {
        const slotStart = new Date(candidateMs)
        const slotEnd = new Date(candidateMs + durationMs)

        if (slotStart.getTime() < now.getTime()) continue
        if (slotStart.getTime() < from.getTime() || slotStart.getTime() >= to.getTime()) continue
        if (overlapsExisting(slotStart, slotEnd, existingAppointments, bufferMinutes)) continue

        slots.push({ startAt: slotStart, endAt: slotEnd })
      }
    }
  }

  return slots
}

/** Regroupe des créneaux par date ("AAAA-MM-JJ", calendrier Paris) — pour l'affichage "Lundi : 08:00, 10:30, 14:00". */
export function groupSlotsByParisDate(slots: TimeSlot[]): Map<string, TimeSlot[]> {
  const byDate = new Map<string, TimeSlot[]>()
  for (const slot of slots) {
    const key = parisDateString(slot.startAt)
    const arr = byDate.get(key)
    if (arr) arr.push(slot)
    else byDate.set(key, [slot])
  }
  return byDate
}
