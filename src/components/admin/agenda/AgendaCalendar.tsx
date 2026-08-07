"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Search, ChevronLeft, ChevronRight, CalendarDays, Printer, Download, Plus, X, AlertCircle,
} from "lucide-react";
import type { AgendaView } from "@/lib/agenda/calendar-range";
import { pixelsToMinutes, snapMinutes, applyMinutesDelta, columnIndexAtX, clampDuration } from "@/lib/agenda/drag-math";
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_HEX, AGENDA_BLOCK_HEX } from "./AppointmentSection";
import AppointmentDetailPanel from "./AppointmentDetailPanel";
import CreateBlockModal, { type BlockCategoryOption } from "./CreateBlockModal";
import type { DurationOption } from "./ScheduleAppointmentModal";

export interface AgendaAppointment {
  id: string;
  quoteRequestId: string;
  customerName: string;
  vehicle: string;
  startAt: string;
  endAt: string;
  status: string;
}

export interface AgendaBlockItem {
  id: string;
  startAt: string;
  endAt: string;
  category: string;
  label: string;
}

export interface AgendaCalendarProps {
  view: AgendaView;
  dateStr: string;
  label: string;
  appointments: AgendaAppointment[];
  blocks: AgendaBlockItem[];
  links: { day: string; week: string; month: string; prev: string; next: string; today: string };
  gridHourBounds: { startHour: number; endHour: number };
  durationOptions: DurationOption[];
  blockCategories: BlockCategoryOption[];
}

const HOUR_HEIGHT = 56; // px par heure dans la grille — voir drag-math.ts pour la conversion pixels <-> minutes
const FILTERS = [
  { key: "CONFIRMED", label: "Confirmés" },
  { key: "COMPLETED", label: "Terminés" },
  { key: "CANCELLED", label: "Annulés" },
  { key: "NO_SHOW", label: "Absents" },
  { key: "BLOCK", label: "Bloc atelier" },
] as const;

function dateKeyOf(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}
function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });
}
function hourLabel(h: number): string {
  return `${String(h % 24).padStart(2, "0")}:00`;
}
/** Minutes écoulées depuis le début de la grille (heure locale Paris) pour un instant donné. */
function minutesFromGridStart(iso: string, startHour: number): number {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return (hour - startHour) * 60 + minute;
}

type DragKind = "appointment" | "block";
type DragMode = "move" | "resize";
interface DragState {
  kind: DragKind;
  id: string;
  mode: DragMode;
  startClientY: number;
  startClientX: number;
  originalStartAt: string;
  originalDurationMinutes: number;
  columnIndex: number; // colonne d'origine (vue semaine) ; toujours 0 en vue jour
  currentDeltaMinutes: number;
  currentColumnIndex: number;
  moved: boolean; // dépasse le seuil de clic -> vrai glisser-déposer
}

export default function AgendaCalendar({ view, dateStr, label, appointments, blocks, links, gridHourBounds, durationOptions, blockCategories }: AgendaCalendarProps) {
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [createBlockOpen, setCreateBlockOpen] = useState(false);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<HTMLDivElement[]>([]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const toggleFilter = (key: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filteredAppointments = useMemo(() => {
    const q = query.trim().toLowerCase();
    return appointments.filter((a) => {
      if (activeFilters.size > 0) {
        const statusFilters = Array.from(activeFilters).filter((f) => f !== "BLOCK");
        if (statusFilters.length > 0 && !statusFilters.includes(a.status)) return false;
        if (statusFilters.length === 0 && activeFilters.has("BLOCK")) return false; // "Bloc atelier" seul coché : masquer tous les rendez-vous
      }
      if (!q) return true;
      return [a.customerName, a.vehicle, a.quoteRequestId].some((v) => v.toLowerCase().includes(q));
    });
  }, [appointments, query, activeFilters]);

  const showBlocks = activeFilters.size === 0 || activeFilters.has("BLOCK");
  const filteredBlocks = useMemo(() => {
    if (!showBlocks) return [];
    const q = query.trim().toLowerCase();
    if (!q) return blocks;
    return blocks.filter((b) => b.label.toLowerCase().includes(q) || b.category.toLowerCase().includes(q));
  }, [blocks, query, showBlocks]);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, AgendaAppointment[]>();
    for (const a of filteredAppointments) {
      const key = dateKeyOf(a.startAt);
      const arr = map.get(key);
      if (arr) arr.push(a); else map.set(key, [a]);
    }
    return map;
  }, [filteredAppointments]);

  const blocksByDay = useMemo(() => {
    const map = new Map<string, AgendaBlockItem[]>();
    for (const b of filteredBlocks) {
      const key = dateKeyOf(b.startAt);
      const arr = map.get(key);
      if (arr) arr.push(b); else map.set(key, [b]);
    }
    return map;
  }, [filteredBlocks]);

  const days = useMemo(() => {
    if (view === "day") return [dateStr];
    if (view === "week") {
      const [y, m, d] = dateStr.split("-").map(Number);
      const base = new Date(Date.UTC(y, m - 1, d));
      const jsDay = base.getUTCDay();
      const monday = new Date(base);
      monday.setUTCDate(base.getUTCDate() - (jsDay === 0 ? 6 : jsDay - 1));
      return Array.from({ length: 7 }, (_, i) => {
        const d2 = new Date(monday);
        d2.setUTCDate(monday.getUTCDate() + i);
        return d2.toISOString().slice(0, 10);
      });
    }
    return [];
  }, [view, dateStr]);

  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = gridHourBounds.startHour; h < gridHourBounds.endHour; h++) arr.push(h);
    return arr;
  }, [gridHourBounds]);
  const gridHeight = hours.length * HOUR_HEIGHT;

  const commit = async (kind: DragKind, id: string, startAt: Date, durationMinutes: number) => {
    try {
      const url = kind === "appointment" ? `/api/admin/appointments/${id}/reschedule` : `/api/admin/agenda-blocks/${id}`;
      const method = kind === "appointment" ? "POST" : "PATCH";
      const endAt = new Date(startAt.getTime() + durationMinutes * 60000);
      const body = kind === "appointment"
        ? { startAt: startAt.toISOString(), durationMinutes }
        : { startAt: startAt.toISOString(), endAt: endAt.toISOString() };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action impossible.");
      refresh();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Erreur réseau.");
    }
  };

  const onPointerMoveWindow = (e: PointerEvent) => {
    setDrag((prev) => {
      if (!prev) return prev;
      const deltaYRaw = e.clientY - prev.startClientY;
      const deltaXRaw = e.clientX - prev.startClientX;
      const moved = prev.moved || Math.abs(deltaYRaw) > 4 || Math.abs(deltaXRaw) > 4;
      const deltaMinutes = snapMinutes(pixelsToMinutes(deltaYRaw, HOUR_HEIGHT));
      let columnIndex = prev.currentColumnIndex;
      if (prev.mode === "move" && view === "week" && columnRefs.current.length > 0) {
        const bounds = columnRefs.current.map((el) => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right }; });
        const idx = columnIndexAtX(e.clientX, bounds);
        if (idx !== -1) columnIndex = idx;
      }
      return { ...prev, currentDeltaMinutes: deltaMinutes, currentColumnIndex: columnIndex, moved };
    });
  };

  const onPointerUpWindow = () => {
    setDrag((prev) => {
      if (!prev) return null;
      window.removeEventListener("pointermove", onPointerMoveWindow);
      window.removeEventListener("pointerup", onPointerUpWindow);
      if (!prev.moved) {
        // Pas un glisser — un simple clic : ouvre la fiche détaillée (rendez-vous uniquement).
        if (prev.kind === "appointment") setDetailId(prev.id);
        return null;
      }
      const dayShiftDays = prev.mode === "move" ? prev.currentColumnIndex - prev.columnIndex : 0;
      const originalStart = new Date(prev.originalStartAt);
      let newStart = applyMinutesDelta(originalStart, prev.mode === "move" ? prev.currentDeltaMinutes : 0);
      if (dayShiftDays !== 0) newStart = new Date(newStart.getTime() + dayShiftDays * 24 * 3600000);
      const newDuration = prev.mode === "resize" ? clampDuration(prev.originalDurationMinutes + prev.currentDeltaMinutes) : prev.originalDurationMinutes;
      void commit(prev.kind, prev.id, newStart, newDuration);
      return null;
    });
  };

  const startDrag = (e: React.PointerEvent, kind: DragKind, id: string, startAt: string, durationMinutes: number, columnIndex: number, mode: DragMode) => {
    e.stopPropagation();
    setDrag({
      kind, id, mode,
      startClientY: e.clientY, startClientX: e.clientX,
      originalStartAt: startAt, originalDurationMinutes: durationMinutes,
      columnIndex, currentDeltaMinutes: 0, currentColumnIndex: columnIndex, moved: false,
    });
    window.addEventListener("pointermove", onPointerMoveWindow);
    window.addEventListener("pointerup", onPointerUpWindow);
  };

  const exportUrl = `/api/admin/appointments/export-ics?date=${dateStr}&view=${view}`;

  return (
    <div>
      {/* Barre du haut : vues, navigation, recherche, actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 print:hidden">
        <div className="flex gap-2">
          {([["day", "Jour", links.day], ["week", "Semaine", links.week], ["month", "Mois", links.month]] as const).map(([k, l, href]) => (
            <Link key={k} href={href} className={`px-3 py-2 text-xs font-bold tracking-wider uppercase border transition-colors ${view === k ? "bg-brand-500 text-white border-brand-500" : "bg-transparent text-gray-500 border-gray-800 hover:text-white hover:border-gray-600"}`}>
              {l}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link href={links.prev} className="p-2 text-gray-400 hover:text-white transition-colors" aria-label="Période précédente"><ChevronLeft size={18} /></Link>
          <Link href={links.today} className="text-xs font-bold tracking-wider uppercase text-brand-400 hover:text-brand-300 transition-colors">Aujourd&apos;hui</Link>
          <Link href={links.next} className="p-2 text-gray-400 hover:text-white transition-colors" aria-label="Période suivante"><ChevronRight size={18} /></Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:hidden">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher (nom, véhicule...)"
            aria-label="Rechercher dans l'agenda"
            className="w-full bg-transparent border border-gray-800 text-white text-sm pl-9 pr-4 py-2.5 focus:outline-none focus:border-brand-500 transition-colors placeholder-gray-700"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => toggleFilter(f.key)}
              aria-pressed={activeFilters.has(f.key)}
              className={`px-2.5 py-1.5 text-[11px] font-bold tracking-wider uppercase border transition-colors ${activeFilters.has(f.key) ? "bg-brand-500 text-white border-brand-500" : "bg-transparent text-gray-500 border-gray-800 hover:text-white hover:border-gray-600"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setCreateBlockOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
            <Plus size={13} /> Bloc atelier
          </button>
          <a href={exportUrl} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-300 border border-gray-700 hover:border-gray-500 transition-colors">
            <Download size={13} /> Exporter .ics
          </a>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-300 border border-gray-700 hover:border-gray-500 transition-colors">
            <Printer size={13} /> Imprimer
          </button>
        </div>
      </div>

      <h2 className="text-white font-bold text-lg capitalize mb-4 print:mb-6" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>{label}</h2>

      {errorMsg && (
        <p className="text-sm px-4 py-2.5 border flex items-center gap-2 mb-4 max-w-xl text-red-400 border-red-500/25 bg-red-500/5 print:hidden">
          <AlertCircle size={15} /> {errorMsg}
          <button type="button" onClick={() => setErrorMsg(null)} className="ml-auto text-red-300 hover:text-white"><X size={14} /></button>
        </p>
      )}

      {view === "month" ? (
        <MonthGrid appointmentsByDay={appointmentsByDay} blocksByDay={blocksByDay} onOpenAppointment={setDetailId} />
      ) : filteredAppointments.length === 0 && filteredBlocks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600 print:hidden">
          <CalendarDays size={32} className="mb-3 opacity-50" />
          <p className="text-sm">Aucun rendez-vous ni bloc sur cette période.</p>
        </div>
      ) : (
        <div className="border overflow-x-auto" style={{ borderColor: "#1e1e1e" }} ref={gridRef}>
          <div className="flex min-w-[640px]">
            {/* Colonne des heures */}
            <div className="w-14 flex-shrink-0 border-r" style={{ borderColor: "#1e1e1e" }}>
              <div className="h-8" />
              {hours.map((h) => (
                <div key={h} style={{ height: HOUR_HEIGHT }} className="text-gray-600 text-[10px] pr-2 text-right -mt-1.5">{hourLabel(h)}</div>
              ))}
            </div>
            {/* Colonnes jour(s) */}
            {days.map((day, dayIdx) => {
              const dayAppts = appointmentsByDay.get(day) ?? [];
              const dayBlocks = blocksByDay.get(day) ?? [];
              return (
                <div
                  key={day}
                  ref={(el) => { if (el) columnRefs.current[dayIdx] = el; }}
                  className="flex-1 min-w-[110px] border-r relative"
                  style={{ borderColor: "#1e1e1e" }}
                >
                  <div className="h-8 flex items-center justify-center text-gray-400 text-xs font-bold uppercase tracking-wider border-b" style={{ borderColor: "#1e1e1e" }}>
                    {new Date(`${day}T12:00:00Z`).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", weekday: "short", day: "numeric" })}
                  </div>
                  <div className="relative" style={{ height: gridHeight }}>
                    {hours.map((h, i) => (
                      <div key={h} className="absolute left-0 right-0 border-t" style={{ top: i * HOUR_HEIGHT, borderColor: "#161616" }} />
                    ))}
                    {dayBlocks.map((b) => {
                      const top = Math.max(0, minutesFromGridStart(b.startAt, gridHourBounds.startHour) / 60) * HOUR_HEIGHT;
                      const durMin = (new Date(b.endAt).getTime() - new Date(b.startAt).getTime()) / 60000;
                      const height = Math.max(20, (durMin / 60) * HOUR_HEIGHT);
                      const isDragging = drag?.kind === "block" && drag.id === b.id;
                      return (
                        <div
                          key={b.id}
                          onPointerDown={(e) => startDrag(e, "block", b.id, b.startAt, durMin, dayIdx, "move")}
                          className="absolute left-0.5 right-0.5 px-1.5 py-0.5 overflow-hidden cursor-grab active:cursor-grabbing select-none"
                          style={{
                            top: isDragging && drag.mode === "move" ? top + (drag.currentDeltaMinutes / 60) * HOUR_HEIGHT : top,
                            height: isDragging && drag.mode === "resize" ? Math.max(20, height + (drag.currentDeltaMinutes / 60) * HOUR_HEIGHT) : height,
                            background: AGENDA_BLOCK_HEX.bg, border: `1px solid ${AGENDA_BLOCK_HEX.border}`, color: AGENDA_BLOCK_HEX.text,
                            opacity: isDragging ? 0.85 : 1, zIndex: isDragging ? 20 : 1,
                          }}
                          title={b.label}
                        >
                          <div className="text-[10px] font-bold uppercase tracking-wider truncate">{b.label}</div>
                          <div
                            onPointerDown={(e) => startDrag(e, "block", b.id, b.startAt, durMin, dayIdx, "resize")}
                            className="absolute left-0 right-0 bottom-0 h-2 cursor-ns-resize"
                          />
                        </div>
                      );
                    })}
                    {dayAppts.map((a) => {
                      const top = Math.max(0, minutesFromGridStart(a.startAt, gridHourBounds.startHour) / 60) * HOUR_HEIGHT;
                      const durMin = (new Date(a.endAt).getTime() - new Date(a.startAt).getTime()) / 60000;
                      const height = Math.max(24, (durMin / 60) * HOUR_HEIGHT);
                      const colors = APPOINTMENT_STATUS_HEX[a.status] ?? APPOINTMENT_STATUS_HEX.PENDING;
                      const isDragging = drag?.kind === "appointment" && drag.id === a.id;
                      const canEdit = a.status === "PENDING" || a.status === "CONFIRMED";
                      return (
                        <div
                          key={a.id}
                          onPointerDown={(e) => canEdit ? startDrag(e, "appointment", a.id, a.startAt, durMin, dayIdx, "move") : setDetailId(a.id)}
                          className={`absolute left-0.5 right-0.5 px-1.5 py-0.5 overflow-hidden select-none ${canEdit ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
                          style={{
                            top: isDragging && drag.mode === "move" ? top + (drag.currentDeltaMinutes / 60) * HOUR_HEIGHT : top,
                            height: isDragging && drag.mode === "resize" ? Math.max(24, height + (drag.currentDeltaMinutes / 60) * HOUR_HEIGHT) : height,
                            background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text,
                            opacity: isDragging ? 0.85 : 1, zIndex: isDragging ? 20 : 2,
                          }}
                          title={`${a.customerName} — ${a.vehicle}`}
                        >
                          <div className="text-[10px] font-bold truncate">{timeOf(a.startAt)} {a.customerName}</div>
                          <div className="text-[9px] truncate opacity-80">{a.vehicle}</div>
                          {canEdit && (
                            <div
                              onPointerDown={(e) => startDrag(e, "appointment", a.id, a.startAt, durMin, dayIdx, "resize")}
                              className="absolute left-0 right-0 bottom-0 h-2 cursor-ns-resize"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-gray-700 text-[11px] mt-3 print:hidden">
        Statuts : {FILTERS.slice(0, 4).map((f) => (
          <span key={f.key} className="inline-flex items-center gap-1 mr-3">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: (APPOINTMENT_STATUS_HEX[f.key] ?? APPOINTMENT_STATUS_HEX.PENDING).text }} /> {APPOINTMENT_STATUS_LABELS[f.key] ?? f.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: AGENDA_BLOCK_HEX.text }} /> Bloc atelier</span>
      </p>

      {detailId && (
        <AppointmentDetailPanel
          key={`${detailId}-${refreshKey}`}
          appointmentId={detailId}
          onClose={() => setDetailId(null)}
          onChanged={refresh}
          durationOptions={durationOptions}
        />
      )}

      <CreateBlockModal
        key={String(createBlockOpen)}
        open={createBlockOpen}
        onOpenChange={setCreateBlockOpen}
        categories={blockCategories}
        defaultDateStr={dateStr}
        onCreated={refresh}
      />
    </div>
  );
}

function MonthGrid({ appointmentsByDay, blocksByDay, onOpenAppointment }: {
  appointmentsByDay: Map<string, AgendaAppointment[]>;
  blocksByDay: Map<string, AgendaBlockItem[]>;
  onOpenAppointment: (id: string) => void;
}) {
  const allDays = Array.from(new Set([...appointmentsByDay.keys(), ...blocksByDay.keys()])).sort();
  if (allDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-600">
        <CalendarDays size={32} className="mb-3 opacity-50" />
        <p className="text-sm">Aucun rendez-vous ni bloc ce mois-ci.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {allDays.map((day) => {
        const appts = appointmentsByDay.get(day) ?? [];
        const dayBlocks = blocksByDay.get(day) ?? [];
        return (
          <div key={day} className="p-3 border" style={{ borderColor: "#1e1e1e", background: "#0f0f0f" }}>
            <p className="text-gray-300 text-xs font-bold uppercase tracking-wider mb-2">
              {new Date(`${day}T12:00:00Z`).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long" })}
            </p>
            <div className="space-y-1.5">
              {appts.map((a) => {
                const colors = APPOINTMENT_STATUS_HEX[a.status] ?? APPOINTMENT_STATUS_HEX.PENDING;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onOpenAppointment(a.id)}
                    className="w-full text-left px-2 py-1.5 text-xs"
                    style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}
                  >
                    {timeOf(a.startAt)} — {a.customerName}
                  </button>
                );
              })}
              {dayBlocks.map((b) => (
                <div key={b.id} className="px-2 py-1.5 text-xs" style={{ background: AGENDA_BLOCK_HEX.bg, border: `1px solid ${AGENDA_BLOCK_HEX.border}`, color: AGENDA_BLOCK_HEX.text }}>
                  {timeOf(b.startAt)} — {b.label}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
