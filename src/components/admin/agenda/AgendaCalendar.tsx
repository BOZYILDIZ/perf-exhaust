"use client";

import Link from "next/link";
import { Clock, Car, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import type { AgendaView } from "@/lib/agenda/calendar-range";

export interface AgendaAppointment {
  id: string;
  quoteRequestId: string;
  customerName: string;
  vehicle: string;
  startAt: string;
  endAt: string;
  status: string;
}

export interface AgendaCalendarProps {
  view: AgendaView;
  dateStr: string;
  label: string;
  appointments: AgendaAppointment[];
  /** Liens de navigation pré-calculés côté serveur (pas de fetch client, juste des <Link>). */
  links: { day: string; week: string; month: string; prev: string; next: string; today: string };
}

const STATUS_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  PENDING: { bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.3)", text: "#cbd5e1" },
  CONFIRMED: { bg: "rgba(18,102,234,0.1)", border: "rgba(18,102,234,0.35)", text: "#5b9cf5" },
  COMPLETED: { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.35)", text: "#4ade80" },
  CANCELLED: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", text: "#f87171" },
  NO_SHOW: { bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.35)", text: "#fb923c" },
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente", CONFIRMED: "Confirmé", COMPLETED: "Terminé", CANCELLED: "Annulé", NO_SHOW: "Absent",
};

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });
}

function dateKeyOf(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

function AppointmentCard({ appt }: { appt: AgendaAppointment }) {
  const style = STATUS_STYLES[appt.status] ?? STATUS_STYLES.PENDING;
  return (
    <Link
      href={`/admin/devis/${appt.quoteRequestId}`}
      className="block p-3 border transition-transform hover:-translate-y-0.5"
      style={{ background: style.bg, borderColor: style.border }}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: style.text }}>
          <Clock size={12} /> {timeOf(appt.startAt)}–{timeOf(appt.endAt)}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: style.text }}>
          {STATUS_LABELS[appt.status] ?? appt.status}
        </span>
      </div>
      <div className="text-white text-sm font-medium truncate">{appt.customerName}</div>
      <div className="text-gray-500 text-xs flex items-center gap-1.5 truncate">
        <Car size={11} /> {appt.vehicle}
      </div>
    </Link>
  );
}

function ViewSwitcher({ view, links }: { view: AgendaView; links: AgendaCalendarProps["links"] }) {
  const tabs: { key: AgendaView; label: string; href: string }[] = [
    { key: "day", label: "Jour", href: links.day },
    { key: "week", label: "Semaine", href: links.week },
    { key: "month", label: "Mois", href: links.month },
  ];
  return (
    <div className="flex gap-2" role="group" aria-label="Vue de l'agenda">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={`px-3 py-2 text-xs font-bold tracking-wider uppercase border transition-colors ${
            view === t.key ? "bg-brand-500 text-white border-brand-500" : "bg-transparent text-gray-500 border-gray-800 hover:text-white hover:border-gray-600"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

export default function AgendaCalendar({ view, appointments, label, links }: AgendaCalendarProps) {
  const byDay = new Map<string, AgendaAppointment[]>();
  for (const a of appointments) {
    const key = dateKeyOf(a.startAt);
    const arr = byDay.get(key);
    if (arr) arr.push(a);
    else byDay.set(key, [a]);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <ViewSwitcher view={view} links={links} />
        <div className="flex items-center gap-3">
          <Link href={links.prev} className="p-2 text-gray-400 hover:text-white transition-colors" aria-label="Période précédente">
            <ChevronLeft size={18} />
          </Link>
          <Link href={links.today} className="text-xs font-bold tracking-wider uppercase text-brand-400 hover:text-brand-300 transition-colors">
            Aujourd&apos;hui
          </Link>
          <Link href={links.next} className="p-2 text-gray-400 hover:text-white transition-colors" aria-label="Période suivante">
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>

      <h2 className="text-white font-bold text-lg capitalize mb-6" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>{label}</h2>

      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600">
          <CalendarDays size={32} className="mb-3 opacity-50" />
          <p className="text-sm">Aucun rendez-vous sur cette période.</p>
        </div>
      ) : view === "month" ? (
        <MonthGrid byDay={byDay} />
      ) : view === "week" ? (
        <WeekColumns byDay={byDay} />
      ) : (
        <div className="space-y-3 max-w-xl">
          {(byDay.values().next().value ?? []).map((a) => <AppointmentCard key={a.id} appt={a} />)}
        </div>
      )}
    </div>
  );
}

function WeekColumns({ byDay }: { byDay: Map<string, AgendaAppointment[]> }) {
  const sortedDays = Array.from(byDay.entries()).sort(([a], [b]) => (a < b ? -1 : 1));
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      {sortedDays.map(([day, appts]) => (
        <div key={day}>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 pb-2 border-b border-[#1e1e1e]">
            {new Date(`${day}T12:00:00Z`).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", weekday: "short", day: "numeric", month: "short" })}
          </p>
          <div className="space-y-2">
            {appts.sort((a, b) => (a.startAt < b.startAt ? -1 : 1)).map((a) => <AppointmentCard key={a.id} appt={a} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function MonthGrid({ byDay }: { byDay: Map<string, AgendaAppointment[]> }) {
  const sortedDays = Array.from(byDay.entries()).sort(([a], [b]) => (a < b ? -1 : 1));
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedDays.map(([day, appts]) => (
        <div key={day} className="p-3 border" style={{ borderColor: "#1e1e1e", background: "#0f0f0f" }}>
          <p className="text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
            {new Date(`${day}T12:00:00Z`).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long" })}
          </p>
          <div className="space-y-2">
            {appts.sort((a, b) => (a.startAt < b.startAt ? -1 : 1)).map((a) => <AppointmentCard key={a.id} appt={a} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
