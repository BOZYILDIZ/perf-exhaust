"use client";

import { useState } from "react";
import { Loader2, Save, CheckCircle, AlertCircle, Trash2, Plus, Pencil, CalendarOff } from "lucide-react";
import type { WeeklyHours, WeekdayKey } from "@/lib/agenda/types";
import { WEEKDAY_KEYS } from "@/lib/agenda/types";
import ClosureFormModal, { type WorkshopClosureData } from "./ClosureFormModal";

export interface AgendaSettingsData {
  weeklyHours: WeeklyHours;
  defaultDurationMinutes: number;
  halfDayDurationMinutes: number;
  fullDayDurationMinutes: number;
  bufferMinutes: number;
}

export type { WorkshopClosureData };

function frDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("fr-FR", { timeZone: "UTC", day: "2-digit", month: "long", year: "numeric" });
}

const DAY_LABELS: Record<WeekdayKey, string> = {
  mon: "Lundi", tue: "Mardi", wed: "Mercredi", thu: "Jeudi", fri: "Vendredi", sat: "Samedi", sun: "Dimanche",
};

const inputStyle = "bg-transparent border border-gray-800 text-white text-sm px-3 py-2 focus:outline-none focus:border-brand-500 transition-colors w-full";
const label = "block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2";

export default function AgendaSettingsForm({ initial, initialClosures }: { initial: AgendaSettingsData; initialClosures: WorkshopClosureData[] }) {
  const [settings, setSettings] = useState<AgendaSettingsData>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [closures, setClosures] = useState<WorkshopClosureData[]>(initialClosures);
  const [closureModalOpen, setClosureModalOpen] = useState(false);
  const [editingClosure, setEditingClosure] = useState<WorkshopClosureData | null>(null);
  const [closureBusy, setClosureBusy] = useState(false);

  const setDay = (day: WeekdayKey, patch: Partial<WeeklyHours[WeekdayKey]>) => {
    setSettings((s) => ({ ...s, weeklyHours: { ...s.weeklyHours, [day]: { ...s.weeklyHours[day], ...patch } } }));
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/agenda-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enregistrement impossible");
      setMsg({ type: "ok", text: "Paramètres agenda enregistrés." });
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Erreur" });
    } finally {
      setSaving(false);
    }
  };

  const onClosureSaved = (closure: WorkshopClosureData) => {
    setClosures((c) => {
      const withoutEdited = c.filter((cl) => cl.id !== closure.id);
      return [...withoutEdited, closure].sort((a, b) => (a.startDate < b.startDate ? -1 : 1));
    });
    setEditingClosure(null);
  };

  const openCreateClosure = () => { setEditingClosure(null); setClosureModalOpen(true); };
  const openEditClosure = (c: WorkshopClosureData) => { setEditingClosure(c); setClosureModalOpen(true); };

  const removeClosure = async (id: string) => {
    setClosureBusy(true);
    try {
      const res = await fetch(`/api/admin/agenda-closures/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Suppression impossible");
      setClosures((c) => c.filter((cl) => cl.id !== id));
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Erreur" });
    } finally {
      setClosureBusy(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <section>
        <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4 pb-2 border-b border-[#1e1e1e]">Horaires par jour</h2>
        <div className="space-y-3">
          {WEEKDAY_KEYS.map((day) => {
            const d = settings.weeklyHours[day];
            return (
              <div key={day} className="flex flex-wrap items-center gap-3 p-3 border" style={{ borderColor: "#1e1e1e", background: "#0f0f0f" }}>
                <label className="flex items-center gap-2 text-sm text-white font-medium w-28 flex-shrink-0 cursor-pointer">
                  <input type="checkbox" checked={d.enabled} onChange={(e) => setDay(day, { enabled: e.target.checked })} className="accent-brand-500 w-4 h-4" />
                  {DAY_LABELS[day]}
                </label>
                {d.enabled && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <input type="time" value={d.morningStart} onChange={(e) => setDay(day, { morningStart: e.target.value })} className={`${inputStyle} w-28`} />
                    <span>–</span>
                    <input type="time" value={d.morningEnd} onChange={(e) => setDay(day, { morningEnd: e.target.value })} className={`${inputStyle} w-28`} />
                    <span className="mx-1 text-gray-700">|</span>
                    <input type="time" value={d.afternoonStart} onChange={(e) => setDay(day, { afternoonStart: e.target.value })} className={`${inputStyle} w-28`} />
                    <span>–</span>
                    <input type="time" value={d.afternoonEnd} onChange={(e) => setDay(day, { afternoonEnd: e.target.value })} className={`${inputStyle} w-28`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-gray-600 text-xs mt-3">L&apos;écart entre le créneau du matin et celui de l&apos;après-midi est la pause déjeuner. Laissez les deux champs de l&apos;après-midi vides pour une journée continue.</p>
      </section>

      <section>
        <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4 pb-2 border-b border-[#1e1e1e]">Durées</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className={label}>Durée par défaut (min)</label>
            <input type="number" min={1} value={settings.defaultDurationMinutes} onChange={(e) => setSettings((s) => ({ ...s, defaultDurationMinutes: Number(e.target.value) || 1 }))} className={inputStyle} />
          </div>
          <div>
            <label className={label}>Demi-journée (min)</label>
            <input type="number" min={1} value={settings.halfDayDurationMinutes} onChange={(e) => setSettings((s) => ({ ...s, halfDayDurationMinutes: Number(e.target.value) || 1 }))} className={inputStyle} />
          </div>
          <div>
            <label className={label}>Journée (min)</label>
            <input type="number" min={1} value={settings.fullDayDurationMinutes} onChange={(e) => setSettings((s) => ({ ...s, fullDayDurationMinutes: Number(e.target.value) || 1 }))} className={inputStyle} />
          </div>
          <div>
            <label className={label}>Tampon entre RDV (min)</label>
            <input type="number" min={0} value={settings.bufferMinutes} onChange={(e) => setSettings((s) => ({ ...s, bufferMinutes: Number(e.target.value) || 0 }))} className={inputStyle} />
          </div>
        </div>
      </section>

      {msg && (
        <p role="status" className={`text-sm px-4 py-2.5 border flex items-center gap-2 ${msg.type === "ok" ? "text-green-400 border-green-500/25 bg-green-500/5" : "text-red-400 border-red-500/25 bg-red-500/5"}`}>
          {msg.type === "ok" ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {msg.text}
        </p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold tracking-widest uppercase text-white disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
      >
        {saving ? <><Loader2 size={15} className="animate-spin" /> Enregistrement...</> : <><Save size={14} /> Enregistrer</>}
      </button>

      <section>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1e1e1e]">
          <h2 className="text-white font-bold text-sm tracking-widest uppercase">Fermetures et congés</h2>
          <button
            type="button"
            onClick={openCreateClosure}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-widest uppercase text-white"
            style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
          >
            <Plus size={13} /> Ajouter une fermeture
          </button>
        </div>
        <p className="text-gray-600 text-xs mb-4">
          Une plage de dates bloque tous les créneaux concernés, quels que soient les horaires habituels — ex. Congés d&apos;été, jour férié, formation, travaux, fermeture exceptionnelle.
        </p>
        {closures.length === 0 ? (
          <p className="text-gray-600 text-sm flex items-center gap-2"><CalendarOff size={15} /> Aucune fermeture programmée.</p>
        ) : (
          <ul className="space-y-2">
            {closures.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border" style={{ borderColor: "#1e1e1e", background: "#0f0f0f" }}>
                <div>
                  <p className="text-white text-sm font-bold">{c.label || "Fermeture"}</p>
                  <p className="text-gray-500 text-xs">
                    {c.startDate === c.endDate ? frDate(c.startDate) : `${frDate(c.startDate)} → ${frDate(c.endDate)}`}
                  </p>
                  {c.notes && <p className="text-gray-600 text-xs mt-1">{c.notes}</p>}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button type="button" onClick={() => openEditClosure(c)} disabled={closureBusy} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white disabled:opacity-40">
                    <Pencil size={13} /> Modifier
                  </button>
                  <button type="button" onClick={() => removeClosure(c.id)} disabled={closureBusy} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 disabled:opacity-40">
                    <Trash2 size={13} /> Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ClosureFormModal
        key={editingClosure?.id ?? "new"}
        open={closureModalOpen}
        onOpenChange={setClosureModalOpen}
        closure={editingClosure}
        onSaved={onClosureSaved}
      />
    </div>
  );
}
