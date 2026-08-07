"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, AlertCircle } from "lucide-react";

export interface BlockCategoryOption {
  value: string;
  label: string;
}

export interface CreateBlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: BlockCategoryOption[];
  defaultDateStr: string;
  onCreated: () => void;
}

/** Convertit une date locale ("AAAA-MM-JJ") + heure ("HH:MM") saisies dans le fuseau du navigateur en Date — suffisant ici car c'est un formulaire d'admin utilisé depuis la France ; le serveur revalide de toute façon la disponibilité réelle. */
function localToDate(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00`);
}

export default function CreateBlockModal({ open, onOpenChange, categories, defaultDateStr, onCreated }: CreateBlockModalProps) {
  const [category, setCategory] = useState(categories[0]?.value ?? "pause");
  const [label, setLabel] = useState(categories[0]?.label ?? "");
  const [date, setDate] = useState(defaultDateStr);
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const startAt = localToDate(date, startTime);
      const endAt = localToDate(date, endTime);
      if (endAt.getTime() <= startAt.getTime()) throw new Error("L'heure de fin doit être après le début.");
      const res = await fetch("/api/admin/agenda-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startAt: startAt.toISOString(), endAt: endAt.toISOString(), category, label: label || category, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Création impossible.");
      onOpenChange(false);
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-6" style={{ background: "#0d0d0d", border: "1px solid #1e1e1e" }}>
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-white font-bold text-sm tracking-widest uppercase">Bloc atelier</Dialog.Title>
            <Dialog.Close className="text-gray-500 hover:text-white transition-colors" aria-label="Fermer"><X size={18} /></Dialog.Close>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2">Catégorie</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); const c = categories.find((c2) => c2.value === e.target.value); if (c && !label) setLabel(c.label); }}
                className="w-full bg-gray-950 border border-gray-800 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-brand-500"
              >
                {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2">Titre</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} className="w-full bg-transparent border border-gray-800 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-brand-500" placeholder="ex : Pause déjeuner" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-transparent border border-gray-800 text-white text-sm px-2 py-2.5 focus:outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2">Début</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full bg-transparent border border-gray-800 text-white text-sm px-2 py-2.5 focus:outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2">Fin</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full bg-transparent border border-gray-800 text-white text-sm px-2 py-2.5 focus:outline-none focus:border-brand-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2">Notes (optionnel)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full bg-transparent border border-gray-800 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-brand-500 resize-y" />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 px-4 py-2.5 border border-red-500/25 bg-red-500/5 flex items-start gap-2 mt-4">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" /> {error}
            </p>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Dialog.Close asChild>
              <button type="button" className="px-5 py-2.5 text-xs font-bold tracking-widest uppercase text-gray-400 hover:text-white transition-colors">Annuler</button>
            </Dialog.Close>
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold tracking-widest uppercase text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : null} Créer le bloc
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
