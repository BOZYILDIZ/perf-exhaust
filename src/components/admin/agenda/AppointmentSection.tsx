"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Loader2, AlertCircle, CheckCircle2, XCircle, UserX, CalendarClock } from "lucide-react";
import ScheduleAppointmentModal, { type DurationOption } from "./ScheduleAppointmentModal";
import { useAppointmentActions } from "./useAppointmentActions";

export interface AppointmentData {
  id: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  status: string;
  notes: string;
  cancelledBy: string | null;
}

export interface AppointmentSectionProps {
  quoteRequestId: string;
  appointment: AppointmentData | null;
  durationOptions: DurationOption[];
  defaultDurationMinutes: number;
}

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmé",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
  NO_SHOW: "Absent",
};

// Palette Phase 2 (remappée) : vert=confirmé, bleu=terminé, orange=en
// attente, rouge=absent, gris=annulé — décision produit explicite, distincte
// de la palette précédente (confirmé était bleu, terminé était vert).
export const APPOINTMENT_STATUS_STYLES: Record<string, string> = {
  PENDING: "text-orange-400 bg-orange-500/10",
  CONFIRMED: "text-green-400 bg-green-500/10",
  COMPLETED: "text-blue-400 bg-blue-500/10",
  CANCELLED: "text-gray-400 bg-white/5",
  NO_SHOW: "text-red-400 bg-red-500/10",
};

/** Couleur hexadécimale équivalente (pour le rendu direct dans la grille horaire, hors classes Tailwind). */
export const APPOINTMENT_STATUS_HEX: Record<string, { bg: string; border: string; text: string }> = {
  PENDING: { bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.4)", text: "#fb923c" },
  CONFIRMED: { bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.4)", text: "#4ade80" },
  COMPLETED: { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.4)", text: "#60a5fa" },
  CANCELLED: { bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.3)", text: "#94a3b8" },
  NO_SHOW: { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.4)", text: "#f87171" },
};

/** Bloc atelier (pause/réunion/congé...) — violet, catégorie distincte des statuts de rendez-vous. */
export const AGENDA_BLOCK_HEX = { bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.4)", text: "#c084fc" };

function frDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

export default function AppointmentSection({ quoteRequestId, appointment, durationOptions, defaultDurationMinutes }: AppointmentSectionProps) {
  const router = useRouter();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const actions = useAppointmentActions(appointment?.id ?? "", () => router.refresh());

  return (
    <section>
      <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4 pb-2 border-b border-[#1e1e1e]">Rendez-vous atelier</h2>

      {!appointment ? (
        <div>
          <p className="text-gray-600 text-sm mb-4">Aucun rendez-vous planifié pour cette demande.</p>
          <button
            type="button"
            onClick={() => setScheduleOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-widest uppercase text-white transition-transform active:scale-95"
            style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
          >
            <Calendar size={14} /> Valider et planifier le rendez-vous
          </button>
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className={`text-xs font-bold px-2.5 py-1 uppercase tracking-wider ${APPOINTMENT_STATUS_STYLES[appointment.status] ?? "text-gray-400 bg-white/5"}`}>
              {APPOINTMENT_STATUS_LABELS[appointment.status] ?? appointment.status}
            </span>
            {appointment.status === "CANCELLED" && appointment.cancelledBy === "CUSTOMER" && (
              <span className="text-xs text-gray-500">Annulé par le client</span>
            )}
            {appointment.status === "CANCELLED" && appointment.cancelledBy === "WORKSHOP" && (
              <span className="text-xs text-gray-500">Annulé par l&apos;atelier</span>
            )}
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-gray-300 text-sm mb-4">
            <span className="inline-flex items-center gap-1.5"><Calendar size={13} className="text-brand-400" /> {frDateTime(appointment.startAt)}</span>
            <span className="inline-flex items-center gap-1.5"><Clock size={13} className="text-brand-400" /> {appointment.durationMinutes} min</span>
          </div>

          {actions.error && (
            <p className="text-sm px-4 py-2.5 border flex items-center gap-2 mb-4 max-w-xl text-red-400 border-red-500/25 bg-red-500/5">
              <AlertCircle size={15} /> {actions.error}
            </p>
          )}

          {(appointment.status === "PENDING" || appointment.status === "CONFIRMED") && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setRescheduleOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-widest uppercase text-gray-300 border border-gray-700 hover:border-gray-500 transition-colors"
              >
                <CalendarClock size={13} /> Modifier
              </button>
              <button
                type="button"
                disabled={actions.busy !== null}
                onClick={actions.complete}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-widest uppercase text-green-400 border border-green-500/30 hover:border-green-400 disabled:opacity-40 transition-colors"
              >
                {actions.busy === "complete" ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Marquer terminé
              </button>
              <button
                type="button"
                disabled={actions.busy !== null}
                onClick={actions.noShow}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-widest uppercase text-orange-400 border border-orange-500/30 hover:border-orange-400 disabled:opacity-40 transition-colors"
              >
                {actions.busy === "no-show" ? <Loader2 size={13} className="animate-spin" /> : <UserX size={13} />} Marquer absent
              </button>
              <button
                type="button"
                disabled={actions.busy !== null}
                onClick={actions.cancel}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-widest uppercase text-red-400 border border-red-500/30 hover:border-red-400 disabled:opacity-40 transition-colors ml-auto"
              >
                {actions.busy === "cancel" ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />} Annuler
              </button>
            </div>
          )}

          <ScheduleAppointmentModal
            key={String(rescheduleOpen)}
            open={rescheduleOpen}
            onOpenChange={setRescheduleOpen}
            mode="reschedule"
            appointmentId={appointment.id}
            current={{ startAt: appointment.startAt, durationMinutes: appointment.durationMinutes }}
            durationOptions={durationOptions}
            defaultDurationMinutes={appointment.durationMinutes}
            onScheduled={() => router.refresh()}
          />
        </div>
      )}

      <ScheduleAppointmentModal
        key={String(scheduleOpen)}
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        mode="create"
        quoteRequestId={quoteRequestId}
        durationOptions={durationOptions}
        defaultDurationMinutes={defaultDurationMinutes}
        onScheduled={() => router.refresh()}
      />
    </section>
  );
}
