import { isDbConfigured } from "@/lib/db";
import { listAppointmentsInRange } from "@/lib/agenda/appointments";
import { listAgendaBlocksInRange, AGENDA_BLOCK_CATEGORIES } from "@/lib/agenda/blocks";
import { getAgendaSettings } from "@/lib/agenda/settings";
import { computeCalendarRange, computeGridHourBounds, shiftDate, todayParisDateString, type AgendaView } from "@/lib/agenda/calendar-range";
import AgendaCalendar from "@/components/admin/agenda/AgendaCalendar";

export const dynamic = "force-dynamic";

function isView(v: string | undefined): v is AgendaView {
  return v === "day" || v === "week" || v === "month";
}

function buildHref(view: AgendaView, dateStr: string): string {
  return `/admin/agenda?view=${view}&date=${dateStr}`;
}

const BLOCK_CATEGORY_LABELS: Record<string, string> = {
  pause: "Pause",
  reunion: "Réunion",
  conge: "Congé",
  livraison: "Livraison",
  fermeture: "Fermeture exceptionnelle",
  deplacement: "Déplacement",
  maintenance: "Maintenance",
  autre: "Autre",
};

export default async function AdminAgendaPage({ searchParams }: { searchParams: Promise<{ view?: string; date?: string }> }) {
  const params = await searchParams;
  const view: AgendaView = isView(params.view) ? params.view : "week";
  const dateStr = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : todayParisDateString();

  const range = computeCalendarRange(view, dateStr);

  const [appointments, blocks, agendaSettings] = isDbConfigured()
    ? await Promise.all([
        listAppointmentsInRange(range.from, range.to),
        listAgendaBlocksInRange(range.from, range.to),
        getAgendaSettings(),
      ])
    : [[], [], null];

  const links = {
    day: buildHref("day", dateStr),
    week: buildHref("week", dateStr),
    month: buildHref("month", dateStr),
    prev: buildHref(view, shiftDate(view, dateStr, -1)),
    next: buildHref(view, shiftDate(view, dateStr, 1)),
    today: buildHref(view, todayParisDateString()),
  };

  const durationOptions = agendaSettings
    ? [
        { label: "30 min", minutes: 30 },
        { label: "1 heure", minutes: 60 },
        { label: "2 heures", minutes: 120 },
        { label: "3 heures", minutes: 180 },
        { label: "Demi-journée", minutes: agendaSettings.halfDayDurationMinutes },
        { label: "Journée", minutes: agendaSettings.fullDayDurationMinutes },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-2 print:hidden" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
        Agenda atelier
      </h1>
      <p className="text-gray-500 text-sm mb-8 print:hidden">
        Cliquez, glissez-déposez ou redimensionnez un rendez-vous — la fiche complète s&apos;ouvre sans quitter l&apos;agenda.
      </p>

      {!isDbConfigured() || !agendaSettings ? (
        <p className="text-gray-400 text-sm p-5 border border-brand-500/30 bg-brand-500/5 max-w-2xl">
          Base de données non configurée — l&apos;agenda nécessite `DATABASE_URL`.
        </p>
      ) : (
        <AgendaCalendar
          view={view}
          dateStr={dateStr}
          label={range.label}
          links={links}
          gridHourBounds={computeGridHourBounds(agendaSettings.weeklyHours)}
          durationOptions={durationOptions}
          blockCategories={AGENDA_BLOCK_CATEGORIES.map((c) => ({ value: c, label: BLOCK_CATEGORY_LABELS[c] ?? c }))}
          appointments={appointments.map((a) => ({
            id: a.id,
            quoteRequestId: a.quoteRequestId,
            customerName: a.customerName,
            vehicle: a.vehicle,
            startAt: a.startAt.toISOString(),
            endAt: a.endAt.toISOString(),
            status: a.status,
          }))}
          blocks={blocks.map((b) => ({
            id: b.id,
            startAt: b.startAt.toISOString(),
            endAt: b.endAt.toISOString(),
            category: b.category,
            label: b.label,
          }))}
        />
      )}
    </div>
  );
}
