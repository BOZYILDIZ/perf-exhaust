import 'server-only'
import { getDb } from '@/lib/db'

export const AGENDA_BLOCK_CATEGORIES = ['pause', 'reunion', 'conge', 'livraison', 'fermeture', 'deplacement', 'maintenance', 'autre'] as const
export type AgendaBlockCategory = (typeof AGENDA_BLOCK_CATEGORIES)[number]

export class AgendaBlockConflictError extends Error {
  constructor() {
    super("Ce créneau chevauche un rendez-vous ou un bloc existant — choisissez une autre plage.")
    this.name = 'AgendaBlockConflictError'
  }
}

export class AgendaBlockNotFoundError extends Error {
  constructor() {
    super('Bloc introuvable.')
    this.name = 'AgendaBlockNotFoundError'
  }
}

async function overlapsAnything(startAt: Date, endAt: Date, excludeBlockId?: string): Promise<boolean> {
  const db = getDb()
  const [appts, blocks] = await Promise.all([
    db.appointment.findMany({
      where: { status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED'] }, startAt: { lt: endAt }, endAt: { gt: startAt } },
      select: { id: true },
    }),
    db.agendaBlock.findMany({
      where: { startAt: { lt: endAt }, endAt: { gt: startAt }, ...(excludeBlockId ? { id: { not: excludeBlockId } } : {}) },
      select: { id: true },
    }),
  ])
  return appts.length > 0 || blocks.length > 0
}

export interface CreateBlockInput {
  startAt: Date
  endAt: Date
  category: AgendaBlockCategory
  label: string
  notes?: string
}

/** Crée un bloc atelier (pause/réunion/congé...) — revalide qu'aucun rendez-vous ni bloc n'occupe déjà la plage, même logique anti-double-réservation que createAppointment. */
export async function createAgendaBlock(input: CreateBlockInput) {
  if (input.endAt.getTime() <= input.startAt.getTime()) throw new Error('La fin doit être après le début.')
  if (await overlapsAnything(input.startAt, input.endAt)) throw new AgendaBlockConflictError()
  const db = getDb()
  return db.agendaBlock.create({
    data: { startAt: input.startAt, endAt: input.endAt, category: input.category, label: input.label, notes: input.notes ?? '' },
  })
}

export async function updateAgendaBlock(id: string, input: Partial<CreateBlockInput>) {
  const db = getDb()
  const existing = await db.agendaBlock.findUnique({ where: { id } })
  if (!existing) throw new AgendaBlockNotFoundError()
  const startAt = input.startAt ?? existing.startAt
  const endAt = input.endAt ?? existing.endAt
  if (endAt.getTime() <= startAt.getTime()) throw new Error('La fin doit être après le début.')
  if ((input.startAt || input.endAt) && (await overlapsAnything(startAt, endAt, id))) throw new AgendaBlockConflictError()
  return db.agendaBlock.update({
    where: { id },
    data: {
      startAt, endAt,
      category: input.category ?? existing.category,
      label: input.label ?? existing.label,
      notes: input.notes ?? existing.notes,
    },
  })
}

export async function deleteAgendaBlock(id: string): Promise<void> {
  const db = getDb()
  const existing = await db.agendaBlock.findUnique({ where: { id } })
  if (!existing) throw new AgendaBlockNotFoundError()
  await db.agendaBlock.delete({ where: { id } })
}

export async function listAgendaBlocksInRange(from: Date, to: Date) {
  const db = getDb()
  return db.agendaBlock.findMany({ where: { startAt: { lt: to }, endAt: { gt: from } }, orderBy: { startAt: 'asc' } })
}
