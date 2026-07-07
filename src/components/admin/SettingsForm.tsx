"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, CheckCircle, AlertCircle } from "lucide-react";
import type { SiteSettingsData } from "@/lib/settings-repo";

const label = "block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2";
const input = "w-full bg-transparent border border-gray-800 text-white text-sm px-4 py-2.5 focus:outline-none focus:border-brand-500 transition-colors placeholder-gray-700";
const sectionTitle = "text-white font-bold text-sm tracking-widest uppercase mb-4 pb-2 border-b border-[#1e1e1e]";

function Field({ children, span = false }: { children: React.ReactNode; span?: boolean }) {
  return <div className={span ? "sm:col-span-2" : ""}>{children}</div>;
}

export default function SettingsForm({ initial }: { initial: SiteSettingsData }) {
  const router = useRouter();
  const [v, setV] = useState<SiteSettingsData>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const set = <K extends keyof SiteSettingsData>(key: K, value: SiteSettingsData[K]) =>
    setV((prev) => ({ ...prev, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enregistrement impossible");
      setMsg({ type: "ok", text: "Paramètres enregistrés — visibles sur le site public." });
      router.refresh();
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-10 pb-24">
      <section>
        <h2 className={sectionTitle}>Identité & coordonnées</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field span>
            <label htmlFor="st-name" className={label}>Nom de l&apos;entreprise *</label>
            <input id="st-name" value={v.businessName} onChange={(e) => set("businessName", e.target.value)} className={input} required />
          </Field>
          <Field>
            <label htmlFor="st-phone" className={label}>Téléphone *</label>
            <input id="st-phone" value={v.phone} onChange={(e) => set("phone", e.target.value)} className={input} placeholder="+33636523058" required />
          </Field>
          <Field>
            <label htmlFor="st-email" className={label}>Email *</label>
            <input id="st-email" type="email" value={v.email} onChange={(e) => set("email", e.target.value)} className={input} required />
          </Field>
          <Field span>
            <label htmlFor="st-address" className={label}>Adresse *</label>
            <input id="st-address" value={v.address} onChange={(e) => set("address", e.target.value)} className={input} required />
          </Field>
          <Field>
            <label htmlFor="st-postal" className={label}>Code postal *</label>
            <input id="st-postal" value={v.postalCode} onChange={(e) => set("postalCode", e.target.value)} className={input} required />
          </Field>
          <Field>
            <label htmlFor="st-city" className={label}>Ville *</label>
            <input id="st-city" value={v.city} onChange={(e) => set("city", e.target.value)} className={input} required />
          </Field>
          <Field span>
            <label htmlFor="st-hours" className={label}>Horaires *</label>
            <input id="st-hours" value={v.openingHours} onChange={(e) => set("openingHours", e.target.value)} className={input} required />
          </Field>
        </div>
      </section>

      <section>
        <h2 className={sectionTitle}>Réseaux & avis</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field>
            <label htmlFor="st-insta" className={label}>Instagram</label>
            <input id="st-insta" value={v.instagramUrl} onChange={(e) => set("instagramUrl", e.target.value)} className={input} placeholder="https://instagram.com/..." />
          </Field>
          <Field>
            <label htmlFor="st-tiktok" className={label}>TikTok</label>
            <input id="st-tiktok" value={v.tiktokUrl} onChange={(e) => set("tiktokUrl", e.target.value)} className={input} placeholder="https://tiktok.com/@..." />
          </Field>
          <Field span>
            <label htmlFor="st-reviews" className={label}>
              Lien avis Google <span className="text-gray-600 normal-case">(active le bouton « Voir les avis » sur le site)</span>
            </label>
            <input id="st-reviews" value={v.googleReviewsUrl} onChange={(e) => set("googleReviewsUrl", e.target.value)} className={input} placeholder="https://g.page/r/..." />
          </Field>
          <Field span>
            <label htmlFor="st-shiftech" className={label}>Lien partenaire SHIFTECH</label>
            <input id="st-shiftech" value={v.shiftechUrl} onChange={(e) => set("shiftechUrl", e.target.value)} className={input} placeholder="https://www.shiftech.eu" />
          </Field>
        </div>
      </section>

      <section>
        <h2 className={sectionTitle}>Pennylane (mode manuel)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field span>
            <label htmlFor="st-pennylane-url" className={label}>
              URL ouverte par le bouton « Ouvrir Pennylane »
              <span className="text-gray-600 normal-case"> (idéalement un lien direct vers la création de devis)</span>
            </label>
            <input
              id="st-pennylane-url"
              value={v.pennylaneManualUrl}
              onChange={(e) => set("pennylaneManualUrl", e.target.value)}
              className={input}
              placeholder="https://app.pennylane.com/"
            />
          </Field>
        </div>
      </section>

      <section>
        <h2 className={sectionTitle}>Informations légales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field>
            <label htmlFor="st-legalform" className={label}>Forme juridique</label>
            <input id="st-legalform" value={v.legalForm} onChange={(e) => set("legalForm", e.target.value)} className={input} placeholder="Ex : Entreprise individuelle" />
          </Field>
          <Field>
            <label htmlFor="st-siret" className={label}>SIRET</label>
            <input id="st-siret" value={v.siret} onChange={(e) => set("siret", e.target.value)} className={input} />
          </Field>
          <Field span>
            <label htmlFor="st-director" className={label}>Responsable de la publication</label>
            <input id="st-director" value={v.publicationDirector} onChange={(e) => set("publicationDirector", e.target.value)} className={input} />
          </Field>
        </div>
      </section>

      {msg && (
        <p
          role="status"
          className={`text-sm px-4 py-2.5 border flex items-center gap-2 ${
            msg.type === "ok" ? "text-green-400 border-green-500/25 bg-green-500/5" : "text-red-400 border-red-500/25 bg-red-500/5"
          }`}
        >
          {msg.type === "ok" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
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
