import { isDbConfigured } from "@/lib/db";
import { listAppointmentsInRange } from "@/lib/agenda/appointments";
import { computeCalendarRange, shiftDate, todayParisDateString, type AgendaView } from "@/lib/agenda/calendar-range";
import AgendaCalendar from "@/components/admin/agenda/AgendaCalendar";

export const dynamic = "force-dynamic";

function isView(v: string | undefined): v is AgendaView {
  return v === "day" || v === "week" || v === "month";
}

function buildHref(view: AgendaView, dateStr: string): string {
  return `/admin/agenda?view=${view}&date=${dateStr}`;
}

export default async function AdminAgendaPage({ searchParams }: { searchParams: Promise<{ view?: string; date?: string }> }) {
  const params = await searchParams;
  const view: AgendaView = isView(params.view) ? params.view : "week";
  const dateStr = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : todayParisDateString();

  const range = computeCalendarRange(view, dateStr);

  const appointments = isDbConfigured() ? await listAppointmentsInRange(range.from, range.to) : [];

  const links = {
    day: buildHref("day", dateStr),
    week: buildHref("week", dateStr),
    month: buildHref("month", dateStr),
    prev: buildHref(view, shiftDate(view, dateStr, -1)),
    next: buildHref(view, shiftDate(view, dateStr, 1)),
    today: buildHref(view, todayParisDateString()),
  };

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
        Agenda atelier
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        Tous les rendez-vous planifiés — cliquez sur un rendez-vous pour ouvrir la demande associée.
      </p>

      {!isDbConfigured() ? (
        <p className="text-gray-400 text-sm p-5 border border-brand-500/30 bg-brand-500/5 max-w-2xl">
          Base de données non configurée — l&apos;agenda nécessite `DATABASE_URL`.
        </p>
      ) : (
        <AgendaCalendar
          view={view}
          dateStr={dateStr}
          label={range.label}
          links={links}
          appointments={appointments.map((a) => ({
            id: a.id,
            quoteRequestId: a.quoteRequestId,
            customerName: a.customerName,
            vehicle: a.vehicle,
            startAt: a.startAt.toISOString(),
            endAt: a.endAt.toISOString(),
            status: a.status,
          }))}
        />
      )}
    </div>
  );
}
