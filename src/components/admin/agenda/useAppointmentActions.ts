"use client";

import { useState } from "react";
import type { WorkshopStatus } from "@/lib/agenda/workshop-status";

/**
 * Actions communes sur un rendez-vous (terminer/absent/annuler/atelier) —
 * partagées entre AppointmentSection.tsx (fiche devis) et
 * AppointmentDetailPanel.tsx (panneau agenda) pour ne pas dupliquer les
 * mêmes appels fetch. Fonctionne identiquement pour un rendez-vous manuel
 * (les routes atelier n'ont besoin que de l'id du rendez-vous).
 */
export function useAppointmentActions(appointmentId: string, onDone: () => void) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastCompleteResult, setLastCompleteResult] = useState<{ notified: boolean; alreadyNotified: boolean; inProgress: boolean; notifyError: string | null } | null>(null);

  const run = async (action: string, url: string, body?: unknown) => {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        ...(body !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action impossible.");
      onDone();
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau.");
      return null;
    } finally {
      setBusy(null);
    }
  };

  return {
    busy,
    error,
    lastCompleteResult,
    clearError: () => setError(null),
    complete: () => run("complete", `/api/admin/appointments/${appointmentId}/complete`),
    noShow: () => run("no-show", `/api/admin/appointments/${appointmentId}/no-show`),
    cancel: () => {
      if (!window.confirm("Annuler ce rendez-vous ? Le client sera notifié.")) return;
      run("cancel", `/api/admin/appointments/${appointmentId}/cancel`);
    },
    // Actions atelier — le seul geste "sensible" (donc confirmé) est la
    // correction manuelle, qui peut faire reculer un statut déjà avancé.
    // Les 4 progressions normales n'ont pas besoin de confirmation : elles
    // n'avancent jamais que d'une étape, sans risque de perte de données.
    vehicleArrived: () => run("vehicle-arrived", `/api/admin/appointments/${appointmentId}/vehicle-arrived`),
    startIntervention: () => run("start-intervention", `/api/admin/appointments/${appointmentId}/start-intervention`),
    completeIntervention: async (notifyClient: boolean) => {
      const data = await run("complete-intervention", `/api/admin/appointments/${appointmentId}/complete-intervention`, { notifyClient });
      if (data) setLastCompleteResult({ notified: data.notified, alreadyNotified: data.alreadyNotified, inProgress: data.inProgress, notifyError: data.notifyError });
    },
    retryNotification: async () => {
      const data = await run("retry-notification", `/api/admin/appointments/${appointmentId}/retry-vehicle-ready-notification`);
      if (data) setLastCompleteResult({ notified: data.notified, alreadyNotified: data.alreadyNotified, inProgress: data.inProgress, notifyError: data.notifyError });
    },
    vehicleReturned: () => run("vehicle-returned", `/api/admin/appointments/${appointmentId}/vehicle-returned`),
    correctWorkshopStatus: (workshopStatus: WorkshopStatus | null) => {
      if (!window.confirm("Corriger le statut atelier de ce rendez-vous ?")) return;
      run("correct-workshop-status", `/api/admin/appointments/${appointmentId}/correct-workshop-status`, { workshopStatus });
    },
    createRealisation: (): Promise<{ id: string; slug: string; alreadyExisted: boolean } | null> =>
      run("create-realisation", `/api/admin/appointments/${appointmentId}/create-realisation`, {}),
  };
}
