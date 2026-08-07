"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import AppointmentSchedulePicker, { type DurationOption, type ScheduledSlot } from "./AppointmentSchedulePicker";

export type { DurationOption };

export interface ScheduleAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "create" : planifie une nouvelle demande. "reschedule" : modifie la date/heure/durée d'un rendez-vous existant. */
  mode: "create" | "reschedule";
  quoteRequestId?: string;
  appointmentId?: string;
  /** Date/heure/durée actuelles — affichées comme "Ancien" en mode reschedule, jamais en mode create. */
  current?: { startAt: string; durationMinutes: number };
  durationOptions: DurationOption[];
  defaultDurationMinutes: number;
  onScheduled: () => void;
}

function frDateTime(iso: string): string {
  const label = new Date(iso).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long", year: "numeric" });
  const time = new Date(iso).toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });
  return `${label.charAt(0).toUpperCase() + label.slice(1)} — ${time}`;
}

export default function ScheduleAppointmentModal({
  open, onOpenChange, mode, quoteRequestId, appointmentId, current, durationOptions, defaultDurationMinutes, onScheduled,
}: ScheduleAppointmentModalProps) {
  const [selection, setSelection] = useState<ScheduledSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noChangeNotice, setNoChangeNotice] = useState(false);

  const confirm = async () => {
    if (!selection) return;
    setSubmitting(true);
    setError(null);
    setNoChangeNotice(false);
    try {
      const url = mode === "create" ? "/api/admin/appointments" : `/api/admin/appointments/${appointmentId}/reschedule`;
      const body = mode === "create"
        ? { quoteRequestId, startAt: selection.startAt, durationMinutes: selection.durationMinutes }
        : { startAt: selection.startAt, durationMinutes: selection.durationMinutes };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible de planifier ce rendez-vous.");
      if (mode === "reschedule" && data.changed === false) {
        setNoChangeNotice(true);
        setSubmitting(false);
        return;
      }
      onOpenChange(false);
      onScheduled();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau — réessayez.");
      setSubmitting(false);
    }
  };

  const newEndAt = selection ? new Date(new Date(selection.startAt).getTime() + selection.durationMinutes * 60000).toISOString() : null;
  const isSameAsCurrent = Boolean(
    current && selection &&
    new Date(current.startAt).getTime() === new Date(selection.startAt).getTime() &&
    current.durationMinutes === selection.durationMinutes
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 z-50" />
        <Dialog.Content
          className="fixed z-50 flex flex-col bg-[#0d0d0d] border border-[#1e1e1e] inset-x-0 bottom-0 max-h-[92vh] rounded-t-2xl sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-none sm:max-h-[85vh] sm:w-full sm:max-w-md"
        >
          <div className="flex items-center justify-between p-5 pb-4 flex-shrink-0 border-b border-[#1e1e1e]">
            <Dialog.Title className="text-white font-bold text-sm tracking-widest uppercase">
              {mode === "create" ? "Valider et planifier" : "Modifier le rendez-vous"}
            </Dialog.Title>
            <Dialog.Close className="text-gray-500 hover:text-white transition-colors p-1 -m-1" aria-label="Fermer">
              <X size={20} />
            </Dialog.Close>
          </div>

          <div className="p-5 overflow-y-auto flex-1 space-y-5">
            {mode === "reschedule" && current && (
              <div className="px-4 py-3 border border-gray-800 bg-white/[0.02] text-sm">
                <p className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1">Ancien</p>
                <p className="text-gray-300">{frDateTime(current.startAt)}</p>
              </div>
            )}

            <AppointmentSchedulePicker
              durationOptions={durationOptions}
              defaultDurationMinutes={current?.durationMinutes ?? defaultDurationMinutes}
              excludeAppointmentId={mode === "reschedule" ? appointmentId : undefined}
              onChange={setSelection}
            />

            {mode === "reschedule" && selection && newEndAt && (
              <div className={`px-4 py-3 border text-sm ${isSameAsCurrent ? "border-gray-800 bg-white/[0.02]" : "border-brand-500/30 bg-brand-500/5"}`}>
                <p className={`text-xs uppercase tracking-wider font-bold mb-1 ${isSameAsCurrent ? "text-gray-500" : "text-brand-400"}`}>Nouveau</p>
                <p className="text-white">{frDateTime(selection.startAt)}</p>
                {isSameAsCurrent && <p className="text-gray-600 text-xs mt-1">Identique à l&apos;horaire actuel — aucun email ne sera envoyé.</p>}
              </div>
            )}

            {noChangeNotice && (
              <p className="text-sm text-gray-400 px-4 py-2.5 border border-gray-700 bg-white/[0.02] flex items-start gap-2">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5 text-gray-500" /> Aucun changement détecté — le rendez-vous reste à l&apos;horaire actuel, aucun email n&apos;a été envoyé.
              </p>
            )}

            {error && (
              <p className="text-sm text-red-400 px-4 py-2.5 border border-red-500/25 bg-red-500/5 flex items-start gap-2">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" /> {error}
              </p>
            )}
          </div>

          <div className="p-5 pt-4 flex-shrink-0 border-t border-[#1e1e1e] flex flex-col sm:flex-row sm:justify-end gap-3" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
            <Dialog.Close asChild>
              <button type="button" className="w-full sm:w-auto px-5 py-3 text-xs font-bold tracking-widest uppercase text-gray-400 hover:text-white transition-colors">
                Annuler
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={confirm}
              disabled={!selection || submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold tracking-widest uppercase text-white disabled:opacity-50 transition-transform active:scale-95"
              style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
              Confirmer
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
