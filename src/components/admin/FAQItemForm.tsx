"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Plus } from "lucide-react";

export interface FAQItemFormValues {
  question: string;
  answer: string;
  category: string;
  status: "draft" | "published";
  sortOrder: number;
}

export const EMPTY_FAQ: FAQItemFormValues = {
  question: "", answer: "", category: "", status: "draft", sortOrder: 0,
};

const label = "block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2";
const input = "w-full bg-transparent border border-gray-800 text-white text-sm px-4 py-2.5 focus:outline-none focus:border-brand-500 transition-colors placeholder-gray-700";
const area = input + " resize-y";
const sectionTitle = "text-white font-bold text-sm tracking-widest uppercase mb-4 pb-2 border-b border-[#1e1e1e]";

function Field({ children, span = false }: { children: React.ReactNode; span?: boolean }) {
  return <div className={span ? "sm:col-span-2" : ""}>{children}</div>;
}

export default function FAQItemForm({
  initial,
  faqId,
}: {
  initial: FAQItemFormValues;
  faqId?: string;
}) {
  const router = useRouter();
  const [v, setV] = useState<FAQItemFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const set = <K extends keyof FAQItemFormValues>(key: K, value: FAQItemFormValues[K]) =>
    setV((prev) => ({ ...prev, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      const payload = { ...v, sortOrder: Number(v.sortOrder) || 0 };
      const res = await fetch(faqId ? `/api/admin/faq/${faqId}` : "/api/admin/faq", {
        method: faqId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enregistrement impossible");
      setMsg({ type: "ok", text: faqId ? "Question mise à jour." : "Question créée." });
      router.refresh();
      if (!faqId) router.push("/admin/faq");
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-10 pb-24">
      <section>
        <h2 className={sectionTitle}>Contenu</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field span>
            <label htmlFor="fq-question" className={label}>Question *</label>
            <input id="fq-question" value={v.question} onChange={(e) => set("question", e.target.value)} className={input} required />
          </Field>
          <Field span>
            <label htmlFor="fq-answer" className={label}>Réponse *</label>
            <textarea id="fq-answer" value={v.answer} onChange={(e) => set("answer", e.target.value)} className={area} rows={5} required />
          </Field>
          <Field>
            <label htmlFor="fq-category" className={label}>Catégorie <span className="text-gray-600 normal-case">(optionnel)</span></label>
            <input id="fq-category" value={v.category} onChange={(e) => set("category", e.target.value)} className={input} placeholder="Ex : Tarifs, Délais..." />
          </Field>
          <Field>
            <label htmlFor="fq-order" className={label}>Ordre d&apos;affichage</label>
            <input id="fq-order" type="number" min={0} value={v.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} className={input} />
          </Field>
          <Field>
            <label className={label}>Statut</label>
            <div className="flex gap-2">
              {(["draft", "published"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("status", s)}
                  aria-pressed={v.status === s}
                  className={[
                    "flex-1 px-4 py-2.5 text-xs font-bold tracking-wider uppercase border transition-colors",
                    v.status === s
                      ? s === "published"
                        ? "bg-green-500/15 text-green-400 border-green-500/40"
                        : "bg-yellow-500/15 text-yellow-400 border-yellow-500/40"
                      : "bg-transparent text-gray-500 border-gray-800 hover:text-white",
                  ].join(" ")}
                >
                  {s === "published" ? "Publiée" : "Brouillon"}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </section>

      <section>
        <h2 className={sectionTitle}>Aperçu du rendu public</h2>
        <div className="border border-white/10 overflow-hidden max-w-lg" style={{ background: "#080808" }}>
          <div className="w-full flex items-center justify-between p-5 text-left gap-4">
            <span className="font-medium text-white leading-snug pr-4">{v.question || "Votre question apparaîtra ici"}</span>
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center border border-white/20 text-brand-400">
              <Plus size={12} />
            </span>
          </div>
          <div className="px-5 pb-5 border-t border-white/5">
            <p className="text-white/60 leading-relaxed pt-4 text-sm">{v.answer || "Votre réponse apparaîtra ici."}</p>
          </div>
        </div>
      </section>

      {msg && (
        <p
          role="status"
          className={`text-sm px-4 py-2.5 border ${
            msg.type === "ok" ? "text-green-400 border-green-500/25 bg-green-500/5" : "text-red-400 border-red-500/25 bg-red-500/5"
          }`}
        >
          {msg.text}
        </p>
      )}

      <div className="fixed bottom-0 left-0 right-0 sm:sticky sm:bottom-4 p-4 sm:p-0 flex justify-end border-t sm:border-0 border-[#1e1e1e] bg-[#0a0a0a] sm:bg-transparent">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold tracking-widest uppercase text-white disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
        >
          {saving ? <><Loader2 size={15} className="animate-spin" /> Enregistrement...</> : <><Save size={14} /> Enregistrer</>}
        </button>
      </div>
    </form>
  );
}
