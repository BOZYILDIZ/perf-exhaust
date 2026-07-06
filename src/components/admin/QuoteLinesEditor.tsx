"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Save, CheckCircle, AlertCircle } from "lucide-react";

export interface QuoteLineValue {
  id?: string;
  description: string;
  quantity: number;
  /** Prix unitaire HT en centimes — évite les erreurs d'arrondi flottant. */
  unitPriceCents: number;
  vatRate: number;
}

const DEFAULT_LINE: QuoteLineValue = {
  description: "Échappement sur mesure — prix à confirmer après diagnostic",
  quantity: 1,
  unitPriceCents: 0,
  vatRate: 20,
};

const VAT_RATES = [20, 10, 5.5, 2.1, 0];

const label = "block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2";
const input = "w-full bg-transparent border border-gray-800 text-white text-sm px-3 py-2 focus:outline-none focus:border-brand-500 transition-colors";

function euros(cents: number): string {
  return (cents / 100).toFixed(2);
}

function lineTotals(line: QuoteLineValue) {
  const ht = line.quantity * line.unitPriceCents;
  const ttc = ht * (1 + line.vatRate / 100);
  return { ht: ht / 100, ttc: ttc / 100 };
}

export default function QuoteLinesEditor({
  quoteRequestId,
  initialLines,
  onSaved,
}: {
  quoteRequestId: string;
  initialLines: QuoteLineValue[];
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [lines, setLines] = useState<QuoteLineValue[]>(initialLines.length > 0 ? initialLines : [DEFAULT_LINE]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const update = <K extends keyof QuoteLineValue>(i: number, key: K, value: QuoteLineValue[K]) => {
    setLines((prev) => prev.map((l, j) => (j === i ? { ...l, [key]: value } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, { description: "", quantity: 1, unitPriceCents: 0, vatRate: 20 }]);
  const removeLine = (i: number) => setLines((prev) => prev.filter((_, j) => j !== i));

  const totals = lines.reduce(
    (acc, l) => {
      const t = lineTotals(l);
      return { ht: acc.ht + t.ht, ttc: acc.ttc + t.ttc };
    },
    { ht: 0, ttc: 0 }
  );

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/quote-requests/${quoteRequestId}/lines`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lines.map((l, i) => ({
            description: l.description,
            quantity: l.quantity,
            unitPriceCents: l.unitPriceCents,
            vatRate: l.vatRate,
            sortOrder: i,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enregistrement impossible");
      setMsg({ type: "ok", text: "Lignes enregistrées." });
      router.refresh();
      onSaved?.();
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Erreur" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="space-y-3">
        {lines.map((line, i) => {
          const t = lineTotals(line);
          return (
            <div key={line.id ?? i} className="p-3 border border-[#1e1e1e] grid grid-cols-1 sm:grid-cols-[1fr_80px_120px_90px_auto] gap-2 items-end" style={{ background: "#0d0d0d" }}>
              <div>
                <label className={label}>Description</label>
                <input
                  value={line.description}
                  onChange={(e) => update(i, "description", e.target.value)}
                  className={input}
                  placeholder="Ex : Ligne complète inox 304L"
                />
              </div>
              <div>
                <label className={label}>Qté</label>
                <input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) => update(i, "quantity", Number(e.target.value) || 1)}
                  className={input}
                />
              </div>
              <div>
                <label className={label}>Prix HT (€)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={euros(line.unitPriceCents)}
                  onChange={(e) => update(i, "unitPriceCents", Math.round(Number(e.target.value) * 100) || 0)}
                  className={input}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className={label}>TVA</label>
                <select
                  value={line.vatRate}
                  onChange={(e) => update(i, "vatRate", Number(e.target.value))}
                  className={input}
                  style={{ background: "#0d0d0d" }}
                >
                  {VAT_RATES.map((r) => (
                    <option key={r} value={r} style={{ background: "#0d0d0d" }}>{r}%</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end sm:gap-1">
                <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                  {t.ht.toFixed(2)} € HT<br />{t.ttc.toFixed(2)} € TTC
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  disabled={lines.length === 1}
                  className="p-2 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-30"
                  aria-label={`Supprimer la ligne ${i + 1}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addLine}
        className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold tracking-wider uppercase border border-gray-800 text-gray-400 hover:border-brand-500 hover:text-white transition-colors"
      >
        <Plus size={13} /> Ajouter une ligne
      </button>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 p-4 border border-[#1e1e1e]" style={{ background: "#0f0f0f" }}>
        <div className="text-sm">
          <span className="text-gray-500">Total HT : </span>
          <span className="text-white font-bold">{totals.ht.toFixed(2)} €</span>
          <span className="text-gray-500 ml-4">Total TTC : </span>
          <span className="text-white font-bold">{totals.ttc.toFixed(2)} €</span>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-widest uppercase text-white disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
        >
          {saving ? <><Loader2 size={14} className="animate-spin" /> Enregistrement...</> : <><Save size={13} /> Enregistrer les lignes</>}
        </button>
      </div>

      {msg && (
        <p
          role="status"
          className={`mt-3 text-sm px-4 py-2.5 border flex items-center gap-2 ${
            msg.type === "ok" ? "text-green-400 border-green-500/25 bg-green-500/5" : "text-red-400 border-red-500/25 bg-red-500/5"
          }`}
        >
          {msg.type === "ok" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {msg.text}
        </p>
      )}
    </div>
  );
}
