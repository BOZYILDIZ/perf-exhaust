import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isDbConfigured } from "@/lib/db";
import { listAppointmentsInRange } from "@/lib/agenda/appointments";
import { listAgendaBlocksInRange } from "@/lib/agenda/blocks";
import { computeCalendarRange, type AgendaView } from "@/lib/agenda/calendar-range";
import { buildMultiEventIcs } from "@/lib/agenda/ics";

function isView(v: string | null): v is AgendaView {
  return v === "day" || v === "week" || v === "month";
}

/**
 * Export .ics du planning (jour/semaine/mois) — un seul fichier, format
 * universel : s'importe tel quel dans Google Calendar, Apple Calendar ou
 * Outlook (glisser-déposer ou "Importer" dans chacun), sans OAuth ni clé API
 * d'aucun des trois. Les rendez-vous annulés ne sont pas exportés (plus
 * réellement au planning) ; PENDING/CONFIRMED/COMPLETED le sont.
 */
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });

  const dateParam = req.nextUrl.searchParams.get("date");
  const viewParam = req.nextUrl.searchParams.get("view");
  const dateStr = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : new Date().toISOString().slice(0, 10);
  const view: AgendaView = isView(viewParam) ? viewParam : "week";

  const range = computeCalendarRange(view === "month" ? "month" : view, dateStr);
  const [appointments, blocks] = await Promise.all([
    listAppointmentsInRange(range.from, range.to),
    listAgendaBlocksInRange(range.from, range.to),
  ]);

  const events = [
    ...appointments
      .filter((a) => a.status !== "CANCELLED" && a.status !== "NO_SHOW")
      .map((a) => ({
        uid: a.id,
        startAt: a.startAt,
        endAt: a.endAt,
        summary: `${a.customerName} — ${a.vehicle}`,
        description: `Rendez-vous PERF'EXHAUST — ${a.vehicle}`,
        location: "",
      })),
    ...blocks.map((b) => ({
      uid: `block-${b.id}`,
      startAt: b.startAt,
      endAt: b.endAt,
      summary: b.label,
      description: b.notes || b.category,
      location: "",
    })),
  ];

  const ics = buildMultiEventIcs(events);
  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="agenda-perfexhaust-${dateStr}.ics"`,
    },
  });
}
