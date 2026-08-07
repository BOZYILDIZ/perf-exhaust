import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured } from "@/lib/db";
import { updateAgendaBlock, deleteAgendaBlock, AGENDA_BLOCK_CATEGORIES, AgendaBlockConflictError, AgendaBlockNotFoundError } from "@/lib/agenda/blocks";

type Ctx = { params: Promise<{ id: string }> };

function guardOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.nextUrl.host;
  } catch {
    return false;
  }
}

const updateSchema = z.object({
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  category: z.enum(AGENDA_BLOCK_CATEGORIES).optional(),
  label: z.string().min(1).max(120).optional(),
  notes: z.string().max(2000).optional(),
});

/** Modifie un bloc — utilisé pour le déplacement/redimensionnement par glisser-déposer, comme /appointments/[id]/reschedule pour les rendez-vous. */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });

    const { id } = await ctx.params;
    const parsed = updateSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

    const block = await updateAgendaBlock(id, {
      startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : undefined,
      endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : undefined,
      category: parsed.data.category,
      label: parsed.data.label,
      notes: parsed.data.notes,
    });
    return NextResponse.json({ success: true, block });
  } catch (error) {
    if (error instanceof AgendaBlockConflictError) return NextResponse.json({ error: error.message }, { status: 409 });
    if (error instanceof AgendaBlockNotFoundError) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("[API/admin/agenda-blocks/[id] PATCH]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });

    const { id } = await ctx.params;
    await deleteAgendaBlock(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AgendaBlockNotFoundError) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("[API/admin/agenda-blocks/[id] DELETE]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
