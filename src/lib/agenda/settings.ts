import 'server-only'
import { getDb, isDbConfigured } from '@/lib/db'
import type { WeeklyHours } from './types'
import { addDays } from './calendar-range'

const SETTINGS_ID = 'singleton'

export interface AgendaSettingsData {
  weeklyHours: WeeklyHours
  defaultDurationMinutes: number
  halfDayDurationMinutes: number
  fullDayDurationMinutes: number
  bufferMinutes: number
}

/**
 * Horaires par défaut tant qu'aucune ligne n'existe — lundi à vendredi
 * 08h00-12h00 / 13h30-18h00 (l'écart est la pause déjeuner), samedi/dimanche
 * désactivés. Correspond à l'exemple donné dans la mission.
 */
export const DEFAULT_WEEKLY_HOURS: WeeklyHours = {
  mon: { enabled: true, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '13:30', afternoonEnd: '18:00' },
  tue: { enabled: true, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '13:30', afternoonEnd: '18:00' },
  wed: { enabled: true, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '13:30', afternoonEnd: '18:00' },
  thu: { enabled: true, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '13:30', afternoonEnd: '18:00' },
  fri: { enabled: true, morningStart: '08:00', morningEnd: '12:00', afternoonStart: '13:30', afternoonEnd: '18:00' },
  sat: { enabled: false, morningStart: '', morningEnd: '', afternoonStart: '', afternoonEnd: '' },
  sun: { enabled: false, morningStart: '', morningEnd: '', afternoonStart: '', afternoonEnd: '' },
}

export const DEFAULT_AGENDA_SETTINGS: AgendaSettingsData = {
  weeklyHours: DEFAULT_WEEKLY_HOURS,
  defaultDurationMinutes: 60,
  halfDayDurationMinutes: 240,
  fullDayDurationMinutes: 480,
  bufferMinutes: 15,
}

/** Paramètres agenda — DB si configurée et une ligne existe, sinon repli sur les valeurs par défaut ci-dessus (même pattern que settings-repo.ts). */
export async function getAgendaSettings(): Promise<AgendaSettingsData> {
  if (!isDbConfigured()) return DEFAULT_AGENDA_SETTINGS
  try {
    const row = await getDb().agendaSettings.findUnique({ where: { id: SETTINGS_ID } })
    if (!row) return DEFAULT_AGENDA_SETTINGS
    const weeklyHours = row.weeklyHours as unknown as WeeklyHours
    return {
      weeklyHours: weeklyHours && Object.keys(weeklyHours).length > 0 ? weeklyHours : DEFAULT_WEEKLY_HOURS,
      defaultDurationMinutes: row.defaultDurationMinutes,
      halfDayDurationMinutes: row.halfDayDurationMinutes,
      fullDayDurationMinutes: row.fullDayDurationMinutes,
      bufferMinutes: row.bufferMinutes,
    }
  } catch (error) {
    console.error('[agenda/settings] Lecture AgendaSettings échouée, repli sur les valeurs par défaut:', error)
    return DEFAULT_AGENDA_SETTINGS
  }
}

export async function saveAgendaSettings(data: AgendaSettingsData): Promise<void> {
  await getDb().agendaSettings.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      weeklyHours: data.weeklyHours as object,
      defaultDurationMinutes: data.defaultDurationMinutes,
      halfDayDurationMinutes: data.halfDayDurationMinutes,
      fullDayDurationMinutes: data.fullDayDurationMinutes,
      bufferMinutes: data.bufferMinutes,
    },
    update: {
      weeklyHours: data.weeklyHours as object,
      defaultDurationMinutes: data.defaultDurationMinutes,
      halfDayDurationMinutes: data.halfDayDurationMinutes,
      fullDayDurationMinutes: data.fullDayDurationMinutes,
      bufferMinutes: data.bufferMinutes,
    },
  })
}

export interface WorkshopClosureData {
  id: string
  label: string
  startDate: string
  endDate: string
  notes: string
}

/** Fermetures exceptionnelles — toutes, triées par date de début. Chaque ligne représente une PLAGE (startDate..endDate inclus), jamais un jour isolé. */
export async function listWorkshopClosures(): Promise<WorkshopClosureData[]> {
  if (!isDbConfigured()) return []
  return getDb().workshopClosure.findMany({
    orderBy: { startDate: 'asc' },
    select: { id: true, label: true, startDate: true, endDate: true, notes: true },
  })
}

/**
 * Développe chaque plage de fermeture en l'ensemble des dates ("AAAA-MM-JJ")
 * qu'elle couvre — le moteur de disponibilités (availability.ts) continue de
 * vérifier une simple appartenance à un Set par jour, exactement comme avant
 * la Phase 5 : aucune modification du moteur pur, seule cette fonction de
 * lecture change. Une plage de plusieurs semaines ne crée qu'une poignée de
 * milliers d'entrées Set au plus — négligeable en mémoire, jamais persisté
 * jour par jour en base (une seule ligne WorkshopClosure par période).
 */
export async function getWorkshopClosureDates(): Promise<Set<string>> {
  if (!isDbConfigured()) return new Set()
  const rows = await getDb().workshopClosure.findMany({ select: { startDate: true, endDate: true } })
  const dates = new Set<string>()
  for (const { startDate, endDate } of rows) {
    let cursor = startDate
    // Garde-fou : une plage mal saisie (endDate < startDate) ne doit jamais
    // boucler indéfiniment — n'ajoute alors que le premier jour.
    let guard = 0
    while (cursor <= endDate && guard < 5000) {
      dates.add(cursor)
      cursor = addDays(cursor, 1)
      guard += 1
    }
  }
  return dates
}

export interface WorkshopClosureInput {
  label: string
  startDate: string
  endDate: string
  notes?: string
}

export async function addWorkshopClosure(input: WorkshopClosureInput): Promise<WorkshopClosureData> {
  return getDb().workshopClosure.create({
    data: { label: input.label, startDate: input.startDate, endDate: input.endDate, notes: input.notes ?? '' },
    select: { id: true, label: true, startDate: true, endDate: true, notes: true },
  })
}

export async function updateWorkshopClosure(id: string, input: WorkshopClosureInput): Promise<WorkshopClosureData> {
  return getDb().workshopClosure.update({
    where: { id },
    data: { label: input.label, startDate: input.startDate, endDate: input.endDate, notes: input.notes ?? '' },
    select: { id: true, label: true, startDate: true, endDate: true, notes: true },
  })
}

export async function removeWorkshopClosure(id: string): Promise<void> {
  await getDb().workshopClosure.delete({ where: { id } })
}
