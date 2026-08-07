import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured } from "@/lib/db";
import { createAgendaBlock, listAgendaBlocksInRange, AGENDA_BLOCK_CATEGORIES, AgendaBlockConflictError } from "@/lib/agenda/blocks";

function guardOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.nextUrl.host;
  } catch {
    return false;
  }
}

const createSchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  category: z.enum(AGENDA_BLOCK_CATEGORIES),
  label: z.string().min(1).max(120),
  notes: z.string().max(2000).optional(),
});

/** Blocs atelier (pause/réunion/congé...) sur une fenêtre — pour l'agenda admin. */
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });

  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  if (!from || !to) return NextResponse.json({ error: "Paramètres from/to requis" }, { status: 400 });

  const blocks = await listAgendaBlocksInRange(new Date(from), new Date(to));
  return NextResponse.json({ blocks });
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!guardOrigin(req)) return NextResponse.json({ error: "Origine invalide" }, { status: 403 });
    if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });

    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ error: `${first.path.join(".")} : ${first.message}` }, { status: 400 });
    }

    const block = await createAgendaBlock({
      startAt: new Date(parsed.data.startAt),
      endAt: new Date(parsed.data.endAt),
      category: parsed.data.category,
      label: parsed.data.label,
      notes: parsed.data.notes,
    });
    return NextResponse.json({ success: true, block });
  } catch (error) {
    if (error instanceof AgendaBlockConflictError) return NextResponse.json({ error: error.message }, { status: 409 });
    if (error instanceof Error && error.message.includes("après le début")) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("[API/admin/agenda-blocks POST]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
