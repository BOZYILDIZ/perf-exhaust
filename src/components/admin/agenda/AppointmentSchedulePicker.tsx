"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, AlertCircle, ChevronDown } from "lucide-react";

export interface DurationOption {
  label: string;
  minutes: number;
}

export interface ScheduledSlot {
  startAt: string;
  durationMinutes: number;
}

export interface AppointmentSchedulePickerProps {
  durationOptions: DurationOption[];
  defaultDurationMinutes: number;
  /** Exclut ce rendez-vous de ses propres conflits — pour une modification de date/heure (son créneau actuel doit rester proposable). */
  excludeAppointmentId?: string;
  /** Fenêtre de recherche, en jours à partir d'aujourd'hui — 60 jours par défaut, largement suffisant pour une prise de rendez-vous atelier. */
  windowDays?: number;
  /** Appelé à chaque changement de sélection complète (null si la sélection n'est pas encore valide/complète). */
  onChange: (slot: ScheduledSlot | null) => void;
}

interface Slot {
  startAt: string;
  endAt: string;
}

const CUSTOM_DURATION_KEY = -1;

function parisDateKey(iso: string): string {
  // "AAAA-MM-JJ" en fuseau Paris — clé de regroupement stable, jamais l'heure locale du navigateur.
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${day}`;
}

function frDateLabel(iso: string): string {
  const label = new Date(iso).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function frTimeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });
}

const selectStyle = "w-full bg-gray-950 border border-gray-800 text-white text-sm px-3 py-3 focus:outline-none focus:border-brand-500 transition-colors appearance-none disabled:opacity-40 disabled:cursor-not-allowed";
const labelStyle = "block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2";

/**
 * Sélecteur compact de créneau — durée puis date puis heure, jamais plus
 * d'une poignée d'options visibles à la fois (contrairement à l'ancien
 * affichage "toutes les semaines, tous les créneaux en boutons"). Réutilisé
 * par ScheduleAppointmentModal (création depuis une demande + modification
 * de date/heure) et CreateManualAppointmentModal (RDV manuel) — un seul
 * appel à /api/admin/appointments/availability, aucune logique dupliquée.
 */
export default function AppointmentSchedulePicker({
  durationOptions,
  defaultDurationMinutes,
  excludeAppointmentId,
  windowDays = 60,
  onChange,
}: AppointmentSchedulePickerProps) {
  const [durationChoice, setDurationChoice] = useState<number>(defaultDurationMinutes);
  const [customMinutes, setCustomMinutes] = useState("60");
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string>("");
  const [selectedStartAt, setSelectedStartAt] = useState<string>("");

  const durationMinutes = durationChoice === CUSTOM_DURATION_KEY ? Math.max(1, Number(customMinutes) || 0) : durationChoice;

  useEffect(() => {
    if (durationMinutes <= 0) return;
    let cancelled = false;
    const from = new Date();
    const to = new Date(from.getTime() + windowDays * 24 * 3600000);
    (async () => {
      setLoading(true);
      setLoadError(null);
      setSelectedDateKey("");
      setSelectedStartAt("");
      try {
        const params = new URLSearchParams({
          from: from.toISOString(),
          to: to.toISOString(),
          durationMinutes: String(durationMinutes),
        });
        if (excludeAppointmentId) params.set("excludeAppointmentId", excludeAppointmentId);
        const res = await fetch(`/api/admin/appointments/availability?${params.toString()}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || "Impossible de récupérer les créneaux disponibles.");
        setSlots(data.slots ?? []);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Erreur réseau — réessayez.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [durationMinutes, excludeAppointmentId, windowDays]);

  const datesWithSlots = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of slots ?? []) {
      const key = parisDateKey(s.startAt);
      const arr = map.get(key);
      if (arr) arr.push(s);
      else map.set(key, [s]);
    }
    return Array.from(map.entries()).sort(([a], [b]) => (a < b ? -1 : 1));
  }, [slots]);

  const timesForSelectedDate = useMemo(
    () => datesWithSlots.find(([key]) => key === selectedDateKey)?.[1] ?? [],
    [datesWithSlots, selectedDateKey]
  );

  useEffect(() => {
    if (selectedStartAt) onChange({ startAt: selectedStartAt, durationMinutes });
    else onChange(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStartAt, durationMinutes]);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="sched-duration" className={labelStyle}>Durée</label>
        <div className="relative">
          <select
            id="sched-duration"
            value={durationChoice}
            onChange={(e) => setDurationChoice(Number(e.target.value))}
            className={`${selectStyle} pr-10`}
          >
            {durationOptions.map((opt) => (
              <option key={opt.minutes} value={opt.minutes}>{opt.label}</option>
            ))}
            <option value={CUSTOM_DURATION_KEY}>Personnalisée</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" aria-hidden="true" />
        </div>
        {durationChoice === CUSTOM_DURATION_KEY && (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              className="w-24 bg-transparent border border-gray-800 text-white text-sm px-3 py-3 focus:outline-none focus:border-brand-500"
              aria-label="Durée personnalisée en minutes"
            />
            <span className="text-gray-500 text-xs">minutes</span>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="sched-date" className={labelStyle}>Date</label>
        <div className="relative">
          <select
            id="sched-date"
            value={selectedDateKey}
            onChange={(e) => { setSelectedDateKey(e.target.value); setSelectedStartAt(""); }}
            disabled={loading || datesWithSlots.length === 0}
            className={`${selectStyle} pr-10`}
          >
            <option value="">{loading ? "Chargement..." : "Choisir une date"}</option>
            {datesWithSlots.map(([key, daySlots]) => (
              <option key={key} value={key}>{frDateLabel(daySlots[0].startAt)}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" aria-hidden="true" />
        </div>
        {!loading && datesWithSlots.length === 0 && !loadError && (
          <p className="text-gray-600 text-xs mt-2">Aucun créneau disponible dans les {windowDays} prochains jours pour cette durée.</p>
        )}
      </div>

      <div>
        <label htmlFor="sched-time" className={labelStyle}>Heure</label>
        <div className="relative">
          <select
            id="sched-time"
            value={selectedStartAt}
            onChange={(e) => setSelectedStartAt(e.target.value)}
            disabled={!selectedDateKey || timesForSelectedDate.length === 0}
            className={`${selectStyle} pr-10`}
          >
            <option value="">Choisir une heure</option>
            {timesForSelectedDate.map((s) => (
              <option key={s.startAt} value={s.startAt}>{frTimeLabel(s.startAt)}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" aria-hidden="true" />
        </div>
      </div>

      {loading && (
        <p className="text-gray-500 text-xs flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Recherche des créneaux disponibles...</p>
      )}
      {loadError && (
        <p className="text-sm text-red-400 px-4 py-2.5 border border-red-500/25 bg-red-500/5 flex items-start gap-2">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" /> {loadError}
        </p>
      )}
    </div>
  );
}
