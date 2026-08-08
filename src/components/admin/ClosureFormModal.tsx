"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, AlertCircle, AlertTriangle } from "lucide-react";

export interface WorkshopClosureData {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  notes: string;
}

export interface ClosureFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Présent = modification d'une fermeture existante ; absent = création. */
  closure?: WorkshopClosureData | null;
  onSaved: (closure: WorkshopClosureData) => void;
}

interface ConflictAppointment {
  id: string;
  customerName: string;
  vehicle: string;
  startAt: string;
}

const inputStyle = "w-full bg-transparent border border-gray-800 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-brand-500 transition-colors";
const labelStyle = "block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2";

function frDateShort(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/**
 * Formulaire d'ajout/modification d'une fermeture — une vraie plage de
 * dates (startDate/endDate inclus), jamais une fermeture par jour. Vérifie
 * en direct (debounce) s'il existe déjà des rendez-vous actifs dans la
 * plage saisie et affiche un avertissement — ne bloque jamais la
 * création/modification, l'admin décide (déplacer ou annuler ensuite).
 */
export default function ClosureFormModal({ open, onOpenChange, closure, onSaved }: ClosureFormModalProps) {
  const [label, setLabel] = useState(closure?.label ?? "");
  const [startDate, setStartDate] = useState(closure?.startDate ?? "");
  const [endDate, setEndDate] = useState(closure?.endDate ?? "");
  const [notes, setNotes] = useState(closure?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ConflictAppointment[] | null>(null);
  const [checking, setChecking] = useState(false);

  const validRange = Boolean(startDate && endDate && endDate >= startDate);

  useEffect(() => {
    // Pas de setState synchrone ici si la plage est invalide — le rendu
    // masque déjà le bandeau de conflits via `validRange` (voir JSX),
    // aucun besoin de réinitialiser `conflicts` explicitement.
    if (!validRange) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      (async () => {
        setChecking(true);
        try {
          const res = await fetch(`/api/admin/agenda-closures/check?startDate=${startDate}&endDate=${endDate}`);
          const data = await res.json();
          if (!cancelled) setConflicts(data.appointments ?? []);
        } catch {
          if (!cancelled) setConflicts(null);
        } finally {
          if (!cancelled) setChecking(false);
        }
      })();
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [startDate, endDate, validRange]);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const url = closure ? `/api/admin/agenda-closures/${closure.id}` : "/api/admin/agenda-closures";
      const method = closure ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, startDate, endDate, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible d'enregistrer cette fermeture.");
      onSaved(data.closure);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau — réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = Boolean(label.trim() && startDate && endDate && endDate >= startDate);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 z-50" />
        <Dialog.Content
          className="fixed z-50 flex flex-col bg-[#0d0d0d] border border-[#1e1e1e] inset-x-0 bottom-0 max-h-[92vh] rounded-t-2xl sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-none sm:max-h-[85vh] sm:w-full sm:max-w-md"
        >
          <div className="flex items-center justify-between p-5 pb-4 flex-shrink-0 border-b border-[#1e1e1e]">
            <Dialog.Title className="text-white font-bold text-sm tracking-widest uppercase">
              {closure ? "Modifier la fermeture" : "Ajouter une fermeture"}
            </Dialog.Title>
            <Dialog.Close className="text-gray-500 hover:text-white transition-colors p-1 -m-1" aria-label="Fermer">
              <X size={20} />
            </Dialog.Close>
          </div>

          <div className="p-5 overflow-y-auto flex-1 space-y-4">
            <div>
              <label htmlFor="closure-label" className={labelStyle}>Nom / motif *</label>
              <input
                id="closure-label" value={label} onChange={(e) => setLabel(e.target.value)}
                className={inputStyle} placeholder="ex : Congés d'été, Jour férié, Formation, Travaux"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="closure-start" className={labelStyle}>Date de début *</label>
                <input id="closure-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputStyle} />
              </div>
              <div>
                <label htmlFor="closure-end" className={labelStyle}>Date de fin *</label>
                <input id="closure-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate || undefined} className={inputStyle} />
              </div>
            </div>
            <div>
              <label htmlFor="closure-notes" className={labelStyle}>Notes (optionnel)</label>
              <textarea id="closure-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${inputStyle} resize-y`} />
            </div>

            {checking && validRange && (
              <p className="text-gray-500 text-xs flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Vérification des rendez-vous existants...</p>
            )}
            {!checking && validRange && conflicts && conflicts.length > 0 && (
              <div className="px-4 py-3 border border-orange-500/30 bg-orange-500/5 text-sm">
                <p className="text-orange-400 font-bold flex items-center gap-2 mb-2">
                  <AlertTriangle size={15} />
                  {conflicts.length} rendez-vous existant{conflicts.length > 1 ? "s" : ""} se trouve{conflicts.length > 1 ? "nt" : ""} dans cette période de fermeture.
                </p>
                <ul className="space-y-1 text-gray-400 text-xs">
                  {conflicts.slice(0, 5).map((c) => (
                    <li key={c.id}>{frDateShort(c.startAt)} — {c.customerName} ({c.vehicle})</li>
                  ))}
                  {conflicts.length > 5 && <li>+ {conflicts.length - 5} autre(s)</li>}
                </ul>
                <p className="text-gray-500 text-xs mt-2">Ils ne seront ni annulés ni déplacés automatiquement — à traiter manuellement depuis l&apos;agenda après confirmation.</p>
              </div>
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
              onClick={submit}
              disabled={!canSubmit || submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold tracking-widest uppercase text-white disabled:opacity-50 transition-transform active:scale-95"
              style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
              {closure ? "Enregistrer" : "Créer la fermeture"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
