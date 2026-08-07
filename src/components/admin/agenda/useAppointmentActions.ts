"use client";

import { useState } from "react";

/**
 * Actions communes sur un rendez-vous (terminer/absent/annuler) — partagées
 * entre AppointmentSection.tsx (fiche devis) et AppointmentDetailPanel.tsx
 * (panneau agenda) pour ne pas dupliquer les mêmes trois appels fetch.
 */
export function useAppointmentActions(appointmentId: string, onDone: () => void) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: string, url: string) => {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action impossible.");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau.");
    } finally {
      setBusy(null);
    }
  };

  return {
    busy,
    error,
    clearError: () => setError(null),
    complete: () => run("complete", `/api/admin/appointments/${appointmentId}/complete`),
    noShow: () => run("no-show", `/api/admin/appointments/${appointmentId}/no-show`),
    cancel: () => {
      if (!window.confirm("Annuler ce rendez-vous ? Le client sera notifié.")) return;
      run("cancel", `/api/admin/appointments/${appointmentId}/cancel`);
    },
  };
}
