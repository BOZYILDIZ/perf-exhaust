"use client";

import { useState } from "react";
import { Car, ArrowRight, Loader2, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { WORKSHOP_STATUS_LABELS, WORKSHOP_STATUS_ORDER, type WorkshopStatus } from "@/lib/agenda/workshop-status";
import { useAppointmentActions } from "./useAppointmentActions";

export interface WorkshopActionsPanelProps {
  appointmentId: string;
  workshopStatus: string | null;
  licensePlate: string | null;
  vehicle: string;
  customerEmail: string | null;
  vehicleReadyNotifiedAt: string | null;
  onChanged: () => void;
}

const WORKSHOP_STATUS_STYLES: Record<string, string> = {
  VEHICULE_ARRIVE: "text-purple-300 bg-purple-500/10 border-purple-500/30",
  EN_INTERVENTION: "text-blue-300 bg-blue-500/10 border-blue-500/30",
  TERMINE: "text-green-400 bg-green-500/10 border-green-500/30",
  RESTITUE: "text-gray-300 bg-white/5 border-gray-700",
};

const CORRECTION_OPTIONS: { value: WorkshopStatus | null; label: string }[] = [
  { value: null, label: "Pas encore arrivé" },
  { value: "VEHICULE_ARRIVE", label: WORKSHOP_STATUS_LABELS.VEHICULE_ARRIVE },
  { value: "EN_INTERVENTION", label: WORKSHOP_STATUS_LABELS.EN_INTERVENTION },
  { value: "TERMINE", label: WORKSHOP_STATUS_LABELS.TERMINE },
  { value: "RESTITUE", label: WORKSHOP_STATUS_LABELS.RESTITUE },
];

/**
 * Workflow atelier — utilisé identiquement dans AppointmentSection.tsx (fiche
 * devis) et AppointmentDetailPanel.tsx (panneau agenda), pour un rendez-vous
 * manuel ou lié à une demande (l'API ne distingue pas les deux, voir
 * src/lib/agenda/workshop-actions.ts). Un seul gros bouton met en avant
 * l'étape suivante logique ; la correction manuelle reste disponible mais
 * volontairement discrète (repliée) pour ne jamais être confondue avec le
 * flux normal.
 */
export default function WorkshopActionsPanel({
  appointmentId, workshopStatus, licensePlate, vehicle, customerEmail, vehicleReadyNotifiedAt, onChanged,
}: WorkshopActionsPanelProps) {
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const actions = useAppointmentActions(appointmentId, onChanged);
  const current = (workshopStatus as WorkshopStatus | null) ?? null;

  const statusLabel = current ? WORKSHOP_STATUS_LABELS[current] : "Planifié";
  const statusStyle = current ? WORKSHOP_STATUS_STYLES[current] : "text-gray-400 bg-white/5 border-gray-700";

  return (
    <div className="p-4 border" style={{ borderColor: "#1e1e1e", background: "#0d0d0d" }}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span className={`text-xs font-bold px-2.5 py-1 uppercase tracking-wider border ${statusStyle}`}>
          {statusLabel}
        </span>
        {licensePlate && (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] font-mono font-black text-base tracking-wider text-black bg-white rounded-[3px]"
            aria-label={`Immatriculation ${licensePlate}`}
          >
            <Car size={14} className="flex-shrink-0" /> {licensePlate.toUpperCase()}
          </span>
        )}
      </div>

      {actions.error && (
        <p className="text-sm px-3 py-2 border flex items-center gap-2 mb-3 text-red-400 border-red-500/25 bg-red-500/5">
          <AlertCircle size={14} /> {actions.error}
        </p>
      )}

      {actions.lastCompleteResult && (
        <p className="text-sm px-3 py-2 border flex items-center gap-2 mb-3 text-gray-300 border-gray-700 bg-white/5">
          {actions.lastCompleteResult.notified && <><CheckCircle2 size={14} className="text-green-400 flex-shrink-0" /> Client notifié par email.</>}
          {actions.lastCompleteResult.alreadyNotified && <><Info size={14} className="text-gray-500 flex-shrink-0" /> Client déjà notifié précédemment — aucun nouvel envoi.</>}
          {actions.lastCompleteResult.notifyError && <><AlertCircle size={14} className="text-red-400 flex-shrink-0" /> Échec de l&apos;envoi — contactez le client autrement.</>}
        </p>
      )}

      {/* Gros bouton contextuel — une seule action mise en avant à la fois. */}
      {current === null && (
        <button
          type="button"
          disabled={actions.busy !== null}
          onClick={actions.vehicleArrived}
          className="w-full min-h-[56px] flex items-center justify-center gap-2 text-sm font-bold tracking-widest uppercase text-white disabled:opacity-60 transition-transform active:scale-[0.99]"
          style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
        >
          {actions.busy === "vehicle-arrived" ? <Loader2 size={16} className="animate-spin" /> : <Car size={16} />} Véhicule arrivé
        </button>
      )}
      {current === "VEHICULE_ARRIVE" && (
        <button
          type="button"
          disabled={actions.busy !== null}
          onClick={actions.startIntervention}
          className="w-full min-h-[56px] flex items-center justify-center gap-2 text-sm font-bold tracking-widest uppercase text-white disabled:opacity-60 transition-transform active:scale-[0.99]"
          style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
        >
          {actions.busy === "start-intervention" ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />} Démarrer l&apos;intervention
        </button>
      )}
      {current === "EN_INTERVENTION" && (
        <button
          type="button"
          disabled={actions.busy !== null}
          onClick={() => actions.completeIntervention(Boolean(customerEmail) && !vehicleReadyNotifiedAt)}
          className="w-full min-h-[56px] flex items-center justify-center gap-2 text-sm font-bold tracking-widest uppercase text-white disabled:opacity-60 transition-transform active:scale-[0.99]"
          style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
        >
          {actions.busy === "complete-intervention" ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          {customerEmail && !vehicleReadyNotifiedAt ? "Terminer et notifier le client" : "Terminer l'intervention"}
        </button>
      )}
      {current === "TERMINE" && (
        <button
          type="button"
          disabled={actions.busy !== null}
          onClick={actions.vehicleReturned}
          className="w-full min-h-[56px] flex items-center justify-center gap-2 text-sm font-bold tracking-widest uppercase text-white disabled:opacity-60 transition-transform active:scale-[0.99]"
          style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
        >
          {actions.busy === "vehicle-returned" ? <Loader2 size={16} className="animate-spin" /> : <Car size={16} />} Véhicule restitué
        </button>
      )}
      {current === "RESTITUE" && (
        <p className="text-gray-500 text-sm flex items-center gap-2 py-2">
          <CheckCircle2 size={15} className="text-green-400" /> Véhicule restitué au client.
        </p>
      )}

      {/* Correction manuelle — discrète, jamais confondue avec le flux normal. */}
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setCorrectionOpen((v) => !v)}
          className="text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2 min-h-[44px] px-1 -mx-1"
        >
          Corriger le statut atelier
        </button>
        {correctionOpen && (
          <div className="flex flex-wrap gap-2 mt-2">
            {CORRECTION_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                disabled={actions.busy !== null || opt.value === current}
                onClick={() => actions.correctWorkshopStatus(opt.value)}
                className="px-3 py-2 min-h-[44px] text-xs font-bold uppercase tracking-wider text-gray-300 border border-gray-700 hover:border-gray-500 disabled:opacity-30 transition-colors"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-gray-700 text-[11px] mt-3">
        {vehicle} · {WORKSHOP_STATUS_ORDER.length} étapes atelier (arrivé → intervention → terminé → restitué)
      </p>
    </div>
  );
}
