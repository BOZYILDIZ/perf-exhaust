"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils";
import { Loader2, Save } from "lucide-react";

export interface ServiceFormValues {
  title: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  icon: string;
  status: "draft" | "published";
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
}

export const EMPTY_SERVICE: ServiceFormValues = {
  title: "", slug: "", shortDescription: "", longDescription: "",
  icon: "wrench", status: "draft", sortOrder: 0, seoTitle: "", seoDescription: "",
};

const ICONS = ["wrench", "zap", "volume-2", "flame", "tool", "music", "star"];

const label = "block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2";
const input = "w-full bg-transparent border border-gray-800 text-white text-sm px-4 py-2.5 focus:outline-none focus:border-brand-500 transition-colors placeholder-gray-700";
const area = input + " resize-y";
const sectionTitle = "text-white font-bold text-sm tracking-widest uppercase mb-4 pb-2 border-b border-[#1e1e1e]";

function Field({ children, span = false }: { children: React.ReactNode; span?: boolean }) {
  return <div className={span ? "sm:col-span-2" : ""}>{children}</div>;
}

export default function ServiceForm({
  initial,
  serviceId,
}: {
  initial: ServiceFormValues;
  serviceId?: string;
}) {
  const router = useRouter();
  const [v, setV] = useState<ServiceFormValues>(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(serviceId));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const set = <K extends keyof ServiceFormValues>(key: K, value: ServiceFormValues[K]) =>
    setV((prev) => ({ ...prev, [key]: value }));

  const onTitleChange = (val: string) => {
    set("title", val);
    if (!slugTouched) set("slug", slugify(val));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      const payload = { ...v, sortOrder: Number(v.sortOrder) || 0 };
      const res = await fetch(serviceId ? `/api/admin/services/${serviceId}` : "/api/admin/services", {
        method: serviceId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enregistrement impossible");
      setMsg({ type: "ok", text: serviceId ? "Service mis à jour." : "Service créé." });
      router.refresh();
      if (!serviceId && data.id) router.push(`/admin/services/${data.id}/edit`);
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-10 pb-24">
      <section>
        <h2 className={sectionTitle}>Statut & identifiant</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  {s === "published" ? "Publié" : "Brouillon"}
                </button>
              ))}
            </div>
          </Field>
          <Field>
            <label htmlFor="sv-slug" className={label}>Slug *</label>
            <input
              id="sv-slug"
              value={v.slug}
              onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }}
              className={input}
              required
            />
          </Field>
        </div>
      </section>

      <section>
        <h2 className={sectionTitle}>Contenu</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field span>
            <label htmlFor="sv-title" className={label}>Titre *</label>
            <input id="sv-title" value={v.title} onChange={(e) => onTitleChange(e.target.value)} className={input} required />
          </Field>
          <Field span>
            <label htmlFor="sv-short" className={label}>Description courte *</label>
            <textarea id="sv-short" value={v.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} className={area} rows={2} required />
          </Field>
          <Field span>
            <label htmlFor="sv-long" className={label}>Description détaillée</label>
            <textarea id="sv-long" value={v.longDescription} onChange={(e) => set("longDescription", e.target.value)} className={area} rows={4} />
          </Field>
          <Field>
            <label htmlFor="sv-icon" className={label}>Icône</label>
            <select
              id="sv-icon"
              value={v.icon}
              onChange={(e) => set("icon", e.target.value)}
              className={input}
              style={{ background: "#0d0d0d" }}
            >
              {ICONS.map((i) => <option key={i} value={i} style={{ background: "#0d0d0d" }}>{i}</option>)}
            </select>
          </Field>
          <Field>
            <label htmlFor="sv-order" className={label}>Ordre d&apos;affichage</label>
            <input id="sv-order" type="number" min={0} value={v.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} className={input} />
          </Field>
        </div>
      </section>

      <section>
        <h2 className={sectionTitle}>SEO</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field>
            <label htmlFor="sv-seotitle" className={label}>
              Meta title <span className="text-gray-600 normal-case">(vide = auto)</span>
              <span className={`float-right tabular-nums ${(v.seoTitle || v.title).length > 60 ? "text-red-400" : "text-gray-600"}`}>
                {(v.seoTitle || v.title).length}/60
              </span>
            </label>
            <input id="sv-seotitle" value={v.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} className={input} maxLength={120} />
          </Field>
          <Field span>
            <label htmlFor="sv-seodesc" className={label}>
              Meta description <span className="text-gray-600 normal-case">(vide = description courte)</span>
              <span className={`float-right tabular-nums ${(v.seoDescription || v.shortDescription).length > 160 ? "text-red-400" : "text-gray-600"}`}>
                {(v.seoDescription || v.shortDescription).length}/160
              </span>
            </label>
            <textarea id="sv-seodesc" value={v.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} className={area} rows={2} maxLength={300} />
          </Field>
        </div>

        <div className="mt-4 p-4 border border-white/10 bg-white/[0.02]">
          <p className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-3">Aperçu Google</p>
          <div className="max-w-xl">
            <p className="text-xs text-gray-500 truncate">perfexhaust.fr › services</p>
            <p className="text-[#8ab4f8] text-lg leading-snug truncate" style={{ fontFamily: "arial, sans-serif" }}>
              {(v.seoTitle || v.title || "Titre du service").slice(0, 60)}
            </p>
            <p className="text-gray-400 text-sm leading-snug" style={{ fontFamily: "arial, sans-serif" }}>
              {(v.seoDescription || v.shortDescription || "La meta description apparaîtra ici.").slice(0, 160)}
            </p>
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
