"use client";

import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, AlertCircle, ChevronLeft, ChevronRight, Clock } from "lucide-react";

export interface DurationOption {
  label: string;
  minutes: number;
}

export interface AvailableSlot {
  startAt: string;
  endAt: string;
}

export interface ScheduleAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "create" : planifie une nouvelle demande. "reschedule" : déplace un rendez-vous existant. */
  mode: "create" | "reschedule";
  quoteRequestId: string;
  appointmentId?: string;
  durationOptions: DurationOption[];
  defaultDurationMinutes: number;
  onScheduled: () => void;
}

const CUSTOM_DURATION_KEY = -1;
const WEEK_MS = 7 * 24 * 3600 * 1000;

function isoDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function frDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long" });
}

function frTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });
}

export default function ScheduleAppointmentModal({
  open, onOpenChange, mode, quoteRequestId, appointmentId, durationOptions, defaultDurationMinutes, onScheduled,
}: ScheduleAppointmentModalProps) {
  const [durationChoice, setDurationChoice] = useState<number>(defaultDurationMinutes);
  const [customMinutes, setCustomMinutes] = useState("60");
  const [weekOffset, setWeekOffset] = useState(0);
  const [slots, setSlots] = useState<AvailableSlot[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const durationMinutes = durationChoice === CUSTOM_DURATION_KEY ? Math.max(1, Number(customMinutes) || 0) : durationChoice;

  // Pas d'effet de "réinitialisation à la fermeture" : le composant est
  // remonté à chaque ouverture (voir la prop `key` posée par les appelants),
  // donc useState(...) reprend naturellement ses valeurs initiales — pas de
  // setState synchrone dans un effet (évite le rendu en cascade).

  useEffect(() => {
    if (!open || durationMinutes <= 0) return;
    let cancelled = false;
    const now = new Date();
    const from = new Date(now.getTime() + weekOffset * WEEK_MS);
    const to = new Date(from.getTime() + WEEK_MS);
    // Enveloppé dans une fonction async : les mises à jour d'état se font
    // toutes après un point de suspension (await), jamais de façon
    // synchrone au corps de l'effet lui-même.
    (async () => {
      setLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const res = await fetch(`/api/admin/appointments/availability?from=${from.toISOString()}&to=${to.toISOString()}&durationMinutes=${durationMinutes}`);
        const data = await res.json();
        if (cancelled) return;
        setSlots(data.slots ?? []);
      } catch {
        if (!cancelled) setError("Impossible de récupérer les créneaux disponibles — réessayez.");
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, weekOffset, durationMinutes]);

  const slotsByDay = useMemo(() => {
    const map = new Map<string, AvailableSlot[]>();
    for (const s of slots ?? []) {
      const key = isoDateOnly(new Date(s.startAt));
      const arr = map.get(key);
      if (arr) arr.push(s);
      else map.set(key, [s]);
    }
    return Array.from(map.entries()).sort(([a], [b]) => (a < b ? -1 : 1));
  }, [slots]);

  const confirm = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    setError(null);
    try {
      const url = mode === "create" ? "/api/admin/appointments" : `/api/admin/appointments/${appointmentId}/reschedule`;
      const body = mode === "create"
        ? { quoteRequestId, startAt: selectedSlot.startAt, durationMinutes }
        : { startAt: selectedSlot.startAt, durationMinutes };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible de planifier ce rendez-vous.");
      onOpenChange(false);
      onScheduled();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau — réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 z-50" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
          style={{ background: "#0d0d0d", border: "1px solid #1e1e1e" }}
        >
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-white font-bold text-sm tracking-widest uppercase">
              {mode === "create" ? "Valider et planifier le rendez-vous" : "Déplacer le rendez-vous"}
            </Dialog.Title>
            <Dialog.Close className="text-gray-500 hover:text-white transition-colors" aria-label="Fermer">
              <X size={18} />
            </Dialog.Close>
          </div>

          <div className="mb-6">
            <p className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-3">Durée du rendez-vous</p>
            <div className="flex flex-wrap gap-2">
              {durationOptions.map((opt) => (
                <button
                  key={opt.minutes}
                  type="button"
                  onClick={() => setDurationChoice(opt.minutes)}
                  className={`px-3 py-2 text-xs font-bold tracking-wider uppercase border transition-colors ${
                    durationChoice === opt.minutes ? "bg-brand-500 text-white border-brand-500" : "bg-transparent text-gray-400 border-gray-800 hover:text-white hover:border-gray-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setDurationChoice(CUSTOM_DURATION_KEY)}
                className={`px-3 py-2 text-xs font-bold tracking-wider uppercase border transition-colors ${
                  durationChoice === CUSTOM_DURATION_KEY ? "bg-brand-500 text-white border-brand-500" : "bg-transparent text-gray-400 border-gray-800 hover:text-white hover:border-gray-600"
                }`}
              >
                Personnalisée
              </button>
            </div>
            {durationChoice === CUSTOM_DURATION_KEY && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="w-28 bg-transparent border border-gray-800 text-white text-sm px-3 py-2 focus:outline-none focus:border-brand-500"
                />
                <span className="text-gray-500 text-xs">minutes</span>
              </div>
            )}
          </div>

          <div className="mb-4 flex items-center justify-between">
            <p className="text-gray-500 text-xs uppercase tracking-wider font-bold">Créneaux disponibles</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setWeekOffset((w) => Math.max(0, w - 1))} disabled={weekOffset === 0} className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 transition-colors" aria-label="Semaine précédente">
                <ChevronLeft size={16} />
              </button>
              <button type="button" onClick={() => setWeekOffset((w) => w + 1)} className="p-1.5 text-gray-400 hover:text-white transition-colors" aria-label="Semaine suivante">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {loadingSlots ? (
            <div className="flex items-center justify-center py-10 text-gray-500">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : slotsByDay.length === 0 ? (
            <p className="text-gray-600 text-sm py-6 text-center">Aucun créneau disponible cette semaine pour cette durée — essayez la semaine suivante.</p>
          ) : (
            <div className="space-y-4 mb-6">
              {slotsByDay.map(([day, daySlots]) => (
                <div key={day}>
                  <p className="text-gray-300 text-sm font-medium capitalize mb-2">{frDateShort(daySlots[0].startAt)}</p>
                  <div className="flex flex-wrap gap-2">
                    {daySlots.map((s) => (
                      <button
                        key={s.startAt}
                        type="button"
                        onClick={() => setSelectedSlot(s)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold border transition-colors ${
                          selectedSlot?.startAt === s.startAt ? "bg-brand-500 text-white border-brand-500" : "bg-transparent text-gray-300 border-gray-800 hover:border-gray-600"
                        }`}
                      >
                        <Clock size={12} /> {frTime(s.startAt)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 px-4 py-2.5 border border-red-500/25 bg-red-500/5 flex items-start gap-2 mb-4">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" /> {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Dialog.Close asChild>
              <button type="button" className="px-5 py-2.5 text-xs font-bold tracking-widest uppercase text-gray-400 hover:text-white transition-colors">
                Annuler
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={confirm}
              disabled={!selectedSlot || submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold tracking-widest uppercase text-white disabled:opacity-50 transition-transform active:scale-95"
              style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
              Confirmer
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
