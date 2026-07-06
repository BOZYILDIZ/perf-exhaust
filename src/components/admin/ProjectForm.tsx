"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils";
import { FILTER_TAGS } from "@/lib/admin-validation";
import { Loader2, Save, Upload, Trash2, AlertCircle, CheckCircle, Eye } from "lucide-react";

/* eslint-disable @next/next/no-img-element -- previews d'URLs externes (Blob) dans l'outil admin */

export interface ProjectFormValues {
  slug: string;
  status: "draft" | "published";
  vehicule: string;
  marque: string;
  modele: string;
  annee: string;
  prestation: string;
  categorie: string;
  tags: string[];
  sonoriteTag: string;
  filterTags: string[];
  description: string;
  descriptionComplete: string;
  objectifsClient: string;
  modificationsRealisees: string;
  materiaux: string;
  resultatSonore: string;
  dureeProjet: string;
  difficulte: string;
  ctaCustom: string;
  imagePrincipale: string;
  imageAlt: string;
  galerie: { src: string; alt: string; type: "avant" | "apres" | "detail" }[];
  videoUrl: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  featured: boolean;
  date: string;
  sortOrder: number;
}

export const EMPTY_PROJECT: ProjectFormValues = {
  slug: "", status: "draft",
  vehicule: "", marque: "", modele: "", annee: "", prestation: "", categorie: "",
  tags: [], sonoriteTag: "", filterTags: [],
  description: "", descriptionComplete: "", objectifsClient: "", modificationsRealisees: "",
  materiaux: "", resultatSonore: "", dureeProjet: "", difficulte: "", ctaCustom: "",
  imagePrincipale: "", imageAlt: "", galerie: [], videoUrl: "",
  seoTitle: "", seoDescription: "", ogImage: "",
  featured: false, date: "", sortOrder: 0,
};

const label = "block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2";
const input = "w-full bg-transparent border border-gray-800 text-white text-sm px-4 py-2.5 focus:outline-none focus:border-brand-500 transition-colors placeholder-gray-700";
const area = input + " resize-y";
const sectionTitle = "text-white font-bold text-sm tracking-widest uppercase mb-4 pb-2 border-b border-[#1e1e1e]";

function Field({ children, span = false }: { children: React.ReactNode; span?: boolean }) {
  return <div className={span ? "sm:col-span-2" : ""}>{children}</div>;
}

export default function ProjectForm({
  initial,
  projectId,
  blobConfigured,
}: {
  initial: ProjectFormValues;
  projectId?: string;
  blobConfigured: boolean;
}) {
  const router = useRouter();
  const [v, setV] = useState<ProjectFormValues>(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(projectId));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) =>
    setV((prev) => ({ ...prev, [key]: value }));

  const onVehiculeChange = (val: string) => {
    set("vehicule", val);
    if (!slugTouched) set("slug", slugify(val));
  };

  const upload = async (file: File): Promise<string | null> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) {
      setMsg({ type: "err", text: data.error || "Upload impossible" });
      return null;
    }
    return data.url as string;
  };

  const uploadMain = async (file: File) => {
    setUploading("main");
    const url = await upload(file);
    if (url) set("imagePrincipale", url);
    setUploading(null);
  };

  const uploadGallery = async (files: FileList) => {
    setUploading("gallery");
    for (const file of Array.from(files)) {
      const url = await upload(file);
      if (url) {
        setV((prev) => ({
          ...prev,
          galerie: [...prev.galerie, { src: url, alt: "", type: "detail" }],
        }));
      }
    }
    setUploading(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    const missingAlt = v.galerie.some((g) => !g.alt.trim());
    if (missingAlt) {
      setMsg({ type: "err", text: "Chaque image de la galerie doit avoir un texte alternatif." });
      return;
    }

    setSaving(true);
    try {
      const payload = { ...v, tags: v.tags.filter(Boolean), sortOrder: Number(v.sortOrder) || 0 };
      const res = await fetch(projectId ? `/api/admin/projects/${projectId}` : "/api/admin/projects", {
        method: projectId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enregistrement impossible");
      setMsg({ type: "ok", text: projectId ? "Réalisation mise à jour." : "Réalisation créée." });
      router.refresh();
      if (!projectId && data.id) router.push(`/admin/realisations/${data.id}/edit`);
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-4xl space-y-10 pb-24">
      {/* ===== Statut ===== */}
      <section>
        <h2 className={sectionTitle}>Statut & identifiant</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field>
            <label htmlFor="pf-status" className={label}>Statut</label>
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
            <label htmlFor="pf-slug" className={label}>Slug (URL) *</label>
            <input
              id="pf-slug"
              value={v.slug}
              onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }}
              className={input}
              placeholder="bmw-serie-3-sonorite-grave"
              required
            />
            <p className="text-gray-600 text-xs mt-1">/realisations/{v.slug || "..."}</p>
          </Field>
        </div>
      </section>

      {/* ===== Informations principales ===== */}
      <section>
        <h2 className={sectionTitle}>Informations principales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field span>
            <label htmlFor="pf-vehicule" className={label}>Titre / Véhicule *</label>
            <input id="pf-vehicule" value={v.vehicule} onChange={(e) => onVehiculeChange(e.target.value)} className={input} placeholder="ex : BMW Série 3" required />
          </Field>
          <Field>
            <label htmlFor="pf-marque" className={label}>Marque *</label>
            <input id="pf-marque" value={v.marque} onChange={(e) => set("marque", e.target.value)} className={input} required />
          </Field>
          <Field>
            <label htmlFor="pf-modele" className={label}>Modèle *</label>
            <input id="pf-modele" value={v.modele} onChange={(e) => set("modele", e.target.value)} className={input} required />
          </Field>
          <Field>
            <label htmlFor="pf-annee" className={label}>Année *</label>
            <input id="pf-annee" value={v.annee} onChange={(e) => set("annee", e.target.value)} className={input} placeholder="2021" maxLength={4} required />
          </Field>
          <Field>
            <label htmlFor="pf-prestation" className={label}>Prestation *</label>
            <input id="pf-prestation" value={v.prestation} onChange={(e) => set("prestation", e.target.value)} className={input} placeholder="ex : Ligne complète inox" required />
          </Field>
          <Field>
            <label htmlFor="pf-categorie" className={label}>Catégorie</label>
            <input id="pf-categorie" value={v.categorie} onChange={(e) => set("categorie", e.target.value)} className={input} placeholder="optionnel" />
          </Field>
          <Field>
            <label htmlFor="pf-sonorite" className={label}>Profil sonore *</label>
            <input id="pf-sonorite" value={v.sonoriteTag} onChange={(e) => set("sonoriteTag", e.target.value)} className={input} placeholder="ex : Son grave" required />
          </Field>
          <Field span>
            <label htmlFor="pf-tags" className={label}>Tags (séparés par des virgules)</label>
            <input
              id="pf-tags"
              value={v.tags.join(", ")}
              onChange={(e) => set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
              className={input}
              placeholder="Ligne complète, Inox 304L, Sport"
            />
          </Field>
        </div>
      </section>

      {/* ===== Filtres galerie ===== */}
      <section>
        <h2 className={sectionTitle}>Filtres de la galerie publique</h2>
        <div className="flex flex-wrap gap-2">
          {FILTER_TAGS.map((tag) => {
            const active = v.filterTags.includes(tag);
            return (
              <label
                key={tag}
                className={[
                  "inline-flex items-center gap-2 px-3 py-2 text-xs font-bold tracking-wider uppercase border cursor-pointer transition-colors",
                  active ? "bg-brand-500/15 text-brand-400 border-brand-500/40" : "text-gray-500 border-gray-800 hover:text-white",
                ].join(" ")}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) =>
                    set("filterTags", e.target.checked ? [...v.filterTags, tag] : v.filterTags.filter((t) => t !== tag))
                  }
                  className="accent-brand-500 w-3.5 h-3.5"
                />
                {tag}
              </label>
            );
          })}
        </div>
      </section>

      {/* ===== Contenu ===== */}
      <section>
        <h2 className={sectionTitle}>Contenu</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field span>
            <label htmlFor="pf-desc" className={label}>Description courte * <span className="text-gray-600 normal-case">(carte galerie)</span></label>
            <textarea id="pf-desc" value={v.description} onChange={(e) => set("description", e.target.value)} className={area} rows={2} required />
          </Field>
          <Field span>
            <label htmlFor="pf-desclong" className={label}>Description longue * <span className="text-gray-600 normal-case">(page projet)</span></label>
            <textarea id="pf-desclong" value={v.descriptionComplete} onChange={(e) => set("descriptionComplete", e.target.value)} className={area} rows={4} required />
          </Field>
          <Field>
            <label htmlFor="pf-objectifs" className={label}>Objectifs client</label>
            <textarea id="pf-objectifs" value={v.objectifsClient} onChange={(e) => set("objectifsClient", e.target.value)} className={area} rows={3} />
          </Field>
          <Field>
            <label htmlFor="pf-modifs" className={label}>Modifications réalisées</label>
            <textarea id="pf-modifs" value={v.modificationsRealisees} onChange={(e) => set("modificationsRealisees", e.target.value)} className={area} rows={3} />
          </Field>
          <Field>
            <label htmlFor="pf-materiaux" className={label}>Matériaux utilisés</label>
            <textarea id="pf-materiaux" value={v.materiaux} onChange={(e) => set("materiaux", e.target.value)} className={area} rows={2} />
          </Field>
          <Field>
            <label htmlFor="pf-resultat" className={label}>Résultat sonore</label>
            <textarea id="pf-resultat" value={v.resultatSonore} onChange={(e) => set("resultatSonore", e.target.value)} className={area} rows={2} />
          </Field>
          <Field>
            <label htmlFor="pf-duree" className={label}>Durée du projet</label>
            <input id="pf-duree" value={v.dureeProjet} onChange={(e) => set("dureeProjet", e.target.value)} className={input} placeholder="ex : 2 jours" />
          </Field>
          <Field>
            <label htmlFor="pf-difficulte" className={label}>Difficulté</label>
            <input id="pf-difficulte" value={v.difficulte} onChange={(e) => set("difficulte", e.target.value)} className={input} placeholder="ex : Avancée" />
          </Field>
          <Field span>
            <label htmlFor="pf-cta" className={label}>CTA personnalisé (optionnel)</label>
            <input id="pf-cta" value={v.ctaCustom} onChange={(e) => set("ctaCustom", e.target.value)} className={input} placeholder="ex : Envie du même son pour votre M3 ?" />
          </Field>
        </div>
      </section>

      {/* ===== Médias ===== */}
      <section>
        <h2 className={sectionTitle}>Médias</h2>
        {!blobConfigured && (
          <p className="mb-4 text-xs text-brand-400 bg-brand-500/5 border border-brand-500/25 px-4 py-3">
            Upload non configuré (BLOB_READ_WRITE_TOKEN absent) — vous pouvez coller des URLs d&apos;images
            manuellement en attendant. Voir docs/MAINTENANCE.md.
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field>
            <label htmlFor="pf-image" className={label}>Image principale</label>
            <div className="flex gap-2">
              <input id="pf-image" value={v.imagePrincipale} onChange={(e) => set("imagePrincipale", e.target.value)} className={input} placeholder="https://... ou upload →" />
              <label className={`flex items-center gap-1.5 px-3 border border-gray-800 text-xs text-gray-400 cursor-pointer hover:border-brand-500 hover:text-white transition-colors ${!blobConfigured || uploading ? "opacity-50 pointer-events-none" : ""}`}>
                {uploading === "main" ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && uploadMain(e.target.files[0])} />
              </label>
            </div>
            {v.imagePrincipale && (
              <div className="mt-2 relative inline-block">
                <img src={v.imagePrincipale} alt={v.imageAlt || "Aperçu image principale"} className="h-24 w-auto border border-gray-800 object-cover" />
                <button
                  type="button"
                  onClick={() => set("imagePrincipale", "")}
                  className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center bg-red-500/90 text-white hover:bg-red-500 transition-colors rounded-full"
                  aria-label="Supprimer l'image principale"
                  title="Supprimer l'image"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            )}
          </Field>
          <Field>
            <label htmlFor="pf-imagealt" className={label}>Alt image principale</label>
            <input id="pf-imagealt" value={v.imageAlt} onChange={(e) => set("imageAlt", e.target.value)} className={input} placeholder="Description de l'image (SEO + a11y)" />
          </Field>
          <Field span>
            <div className="flex items-center justify-between mb-2">
              <span className={label + " mb-0"}>Galerie (avant / après / détail)</span>
              <button
                type="button"
                onClick={() => galleryInput.current?.click()}
                disabled={!blobConfigured || uploading !== null}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-800 text-gray-400 hover:border-brand-500 hover:text-white transition-colors disabled:opacity-50"
              >
                {uploading === "gallery" ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Ajouter des images
              </button>
              <input ref={galleryInput} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => e.target.files && uploadGallery(e.target.files)} />
            </div>
            {v.galerie.length === 0 && <p className="text-gray-600 text-xs">Aucune image pour l&apos;instant.</p>}
            <div className="space-y-2">
              {v.galerie.map((img, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 p-2 border border-gray-800">
                  <img src={img.src} alt={img.alt || `Image ${i + 1}`} className="h-14 w-20 object-cover flex-shrink-0" />
                  <input
                    value={img.alt}
                    onChange={(e) => {
                      const g = [...v.galerie];
                      g[i] = { ...g[i], alt: e.target.value };
                      set("galerie", g);
                    }}
                    className={input + " flex-1 min-w-[140px]"}
                    placeholder="Texte alternatif * (obligatoire)"
                    aria-label={`Texte alternatif image ${i + 1}`}
                  />
                  <select
                    value={img.type}
                    onChange={(e) => {
                      const g = [...v.galerie];
                      g[i] = { ...g[i], type: e.target.value as "avant" | "apres" | "detail" };
                      set("galerie", g);
                    }}
                    className="bg-gray-950 border border-gray-800 text-white text-xs px-2 py-2 focus:outline-none focus:border-brand-500"
                    aria-label={`Type image ${i + 1}`}
                  >
                    <option value="avant">Avant</option>
                    <option value="apres">Après</option>
                    <option value="detail">Détail</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => set("galerie", v.galerie.filter((_, j) => j !== i))}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                    aria-label={`Supprimer l'image ${i + 1}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </Field>
          <Field span>
            <label htmlFor="pf-video" className={label}>Vidéo Instagram / TikTok (URL, optionnel)</label>
            <input id="pf-video" value={v.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} className={input} placeholder="https://www.tiktok.com/@perfexhaust/video/..." />
          </Field>
        </div>
      </section>

      {/* ===== SEO ===== */}
      <section>
        <h2 className={sectionTitle}>SEO</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field>
            <label htmlFor="pf-seotitle" className={label}>
              Meta title <span className="text-gray-600 normal-case">(vide = auto)</span>
              <span className={`float-right tabular-nums ${(v.seoTitle || `${v.vehicule} — ${v.prestation}`).length > 60 ? "text-red-400" : "text-gray-600"}`}>
                {(v.seoTitle || `${v.vehicule} — ${v.prestation}`).length}/60
              </span>
            </label>
            <input id="pf-seotitle" value={v.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} className={input} maxLength={120} />
          </Field>
          <Field>
            <label htmlFor="pf-ogimage" className={label}>Image Open Graph (URL)</label>
            <input id="pf-ogimage" value={v.ogImage} onChange={(e) => set("ogImage", e.target.value)} className={input} placeholder="vide = image du site" />
          </Field>
          <Field span>
            <label htmlFor="pf-seodesc" className={label}>
              Meta description <span className="text-gray-600 normal-case">(vide = description courte)</span>
              <span className={`float-right tabular-nums ${(v.seoDescription || v.description).length > 160 ? "text-red-400" : "text-gray-600"}`}>
                {(v.seoDescription || v.description).length}/160
              </span>
            </label>
            <textarea id="pf-seodesc" value={v.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} className={area} rows={2} maxLength={300} />
          </Field>
        </div>
        <p className="text-gray-600 text-xs mt-2">Canonical : https://perfexhaust.fr/realisations/{v.slug || "..."} (automatique)</p>

        {/* Aperçu résultat Google */}
        <div className="mt-4 p-4 border border-white/10 bg-white/[0.02]">
          <p className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-3">Aperçu Google</p>
          <div className="max-w-xl">
            <p className="text-xs text-gray-500 truncate">perfexhaust.fr › realisations › {v.slug || "votre-slug"}</p>
            <p className="text-[#8ab4f8] text-lg leading-snug truncate" style={{ fontFamily: "arial, sans-serif" }}>
              {(v.seoTitle || `${v.vehicule || "Titre du projet"} — ${v.prestation || "Prestation"}`).slice(0, 60)}
              {(v.seoTitle || `${v.vehicule} — ${v.prestation}`).length > 60 ? "…" : ""}
            </p>
            <p className="text-gray-400 text-sm leading-snug" style={{ fontFamily: "arial, sans-serif" }}>
              {(v.seoDescription || v.description || "La meta description apparaîtra ici.").slice(0, 160)}
              {(v.seoDescription || v.description).length > 160 ? "…" : ""}
            </p>
          </div>
        </div>
      </section>

      {/* ===== Divers ===== */}
      <section>
        <h2 className={sectionTitle}>Affichage</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field>
            <label className={label}>Mise en avant (home)</label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" checked={v.featured} onChange={(e) => set("featured", e.target.checked)} className="accent-brand-500 w-4 h-4" />
              Afficher sur la page d&apos;accueil
            </label>
          </Field>
          <Field>
            <label htmlFor="pf-date" className={label}>Date (AAAA-MM-JJ)</label>
            <input id="pf-date" value={v.date} onChange={(e) => set("date", e.target.value)} className={input} placeholder="2026-07-03" />
          </Field>
          <Field>
            <label htmlFor="pf-order" className={label}>Ordre de tri</label>
            <input id="pf-order" type="number" min={0} value={v.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} className={input} />
          </Field>
        </div>
      </section>

      {/* ===== Barre d'action ===== */}
      {msg && (
        <p
          role="status"
          className={`text-sm px-4 py-3 border flex items-center gap-2 ${
            msg.type === "ok" ? "text-green-400 border-green-500/25 bg-green-500/5" : "text-red-400 border-red-500/25 bg-red-500/5"
          }`}
        >
          {msg.type === "ok" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {msg.text}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold tracking-widest uppercase text-white disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {projectId ? "Enregistrer" : "Créer la réalisation"}
        </button>
        {projectId && v.slug && (
          <a
            href={`/realisations/${v.slug}${v.status === "draft" ? "?preview=1" : ""}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 text-xs font-bold tracking-widest uppercase text-gray-400 border border-gray-800 hover:text-white hover:border-gray-600 transition-colors"
          >
            <Eye size={14} /> Prévisualiser
          </a>
        )}
      </div>
    </form>
  );
}
