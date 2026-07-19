"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, CheckCircle, AlertCircle, Loader2, ChevronDown } from "lucide-react";
import VehicleSelector, { type VehicleValue } from "./VehicleSelector";
import { REAR_DIFFUSER_OPTIONS, REAR_DIFFUSER_VALUES, rearDiffuserLabel } from "@/lib/quote-request-options";

const schema = z.object({
  nom: z.string().min(2, "Nom requis"),
  prenom: z.string().min(2, "Prénom requis"),
  telephone: z.string().regex(/^[+0-9 .()-]{10,20}$/, "Téléphone invalide (10 chiffres minimum)"),
  email: z.string().email("Email invalide"),
  marque: z.string().min(2, "Marque requise"),
  modele: z.string().min(1, "Modèle requis"),
  annee: z.string().regex(/^(19|20)\d{2}$/, "Année invalide (ex : 2021)"),
  motorisation: z.string().optional(),
  rearDiffuser: z.enum(REAR_DIFFUSER_VALUES, { message: "Merci d'indiquer si votre véhicule a un diffuseur arrière" }),
  typeProjet: z.string().min(1, "Type de projet requis"),
  sonoritePreference: z.string().min(1, "Préférence sonore requise"),
  description: z.string().min(10, "Description requise (10 caractères minimum)"),
  creneauSouhaite: z.string().optional(),
  rgpd: z.boolean().refine((v) => v === true, { message: "Vous devez accepter la politique de confidentialité" }),
});

type FormData = z.infer<typeof schema>;

const typesProjet = [
  "Ligne complète",
  "Demi-ligne",
  "Silencieux",
  "Réparation",
  "Modification sonore",
  "Soudure personnalisée",
  "Autre",
];

const sonorities = [
  "Bruit léger",
  "Bruit fort",
  "Son grave",
  "Son aigu",
  "Son sportif",
  "Discret",
  "À définir avec l'atelier",
];

const DRAFT_KEY = "pe-devis-draft";
const REQUIRED_FIELDS: (keyof FormData)[] = [
  "prenom", "nom", "telephone", "email",
  "marque", "modele", "annee", "rearDiffuser",
  "typeProjet", "sonoritePreference", "description", "rgpd",
];

const labelStyle = "block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2";
const inputStyle = "w-full bg-transparent border border-gray-800 text-white text-sm px-4 py-3 focus:outline-none focus:border-brand-500 transition-colors placeholder-gray-700";
const selectStyle = "w-full bg-gray-950 border border-gray-800 text-white text-sm px-4 py-3 focus:outline-none focus:border-brand-500 transition-colors appearance-none";
const errorStyle = "text-red-400 text-xs mt-1 flex items-center gap-1";

export default function AppointmentForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Brouillon localStorage : restauré APRÈS montage (jamais au rendu initial,
  // sinon le HTML client diverge du HTML serveur → erreur d'hydratation React).
  const [draft, setDraft] = useState<Partial<FormData> | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitted }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    // Validation en temps réel dès qu'un champ a été visité
    mode: "onTouched",
    defaultValues: { marque: "", modele: "", annee: "", motorisation: "" },
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<FormData>;
      // Le consentement RGPD ne se restaure jamais automatiquement
      reset({ marque: "", modele: "", annee: "", motorisation: "", ...saved, rgpd: false } as FormData);
      setDraft(saved);
      setDraftRestored(true);
    } catch { /* stockage indisponible/corrompu : on repart à vide */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sauvegarde automatique (débouncée) de tous les champs sauf le consentement
  const values = watch();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (status === "success") return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        const toSave: Record<string, unknown> = { ...values };
        delete toSave.rgpd;
        const hasContent = Object.values(toSave).some((v) => typeof v === "string" && v.trim() !== "");
        if (hasContent) window.localStorage.setItem(DRAFT_KEY, JSON.stringify(toSave));
      } catch { /* stockage indisponible : silencieux */ }
    }, 600);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values), status]);

  const clearDraft = () => {
    try { window.localStorage.removeItem(DRAFT_KEY); } catch { /* noop */ }
    setDraftRestored(false);
  };

  // Progression : proportion de champs requis valides/remplis
  const filledCount = REQUIRED_FIELDS.filter((f) => {
    const v = values[f];
    return typeof v === "boolean" ? v : typeof v === "string" && v.trim() !== "";
  }).length;
  const progress = Math.round((filledCount / REQUIRED_FIELDS.length) * 100);

  const onSubmit = async (data: FormData) => {
    setStatus("loading");
    try {
      const res = await fetch("/api/rendez-vous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      setStatus("success");
      clearDraft();
      reset();
    } catch {
      setStatus("error");
      setErrorMsg("Une erreur est survenue. Veuillez réessayer ou nous contacter directement.");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-16 px-8">
        <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
          <CheckCircle size={32} className="text-green-400" />
        </div>
        <h3 className="text-2xl font-black text-white mb-3" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
          Demande envoyée !
        </h3>
        <p className="text-gray-400 text-sm max-w-md mx-auto mb-2">
          Votre demande a bien été enregistrée. L&apos;atelier reviendra vers vous dès que possible.
        </p>
        <p className="text-gray-500 text-xs">Nous vous recontacterons aux coordonnées indiquées.</p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-8 text-brand-400 text-sm hover:text-brand-300 transition-colors underline"
        >
          Faire une nouvelle demande
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Progression */}
      <div aria-hidden="true">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500">Progression de votre demande</span>
          <span className="text-xs font-bold text-brand-400 tabular-nums">{progress}%</span>
        </div>
        <div className="h-1 bg-white/10 overflow-hidden">
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%`, background: "linear-gradient(90deg, #1266ea, #4d8ef0)" }}
          />
        </div>
      </div>

      {/* Reprise de brouillon */}
      {draftRestored && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border border-brand-500/25 bg-brand-500/5">
          <p className="text-brand-400 text-xs">Votre saisie précédente a été restaurée automatiquement.</p>
          <button
            type="button"
            onClick={() => { clearDraft(); reset({ marque: "", modele: "", annee: "", motorisation: "", rgpd: false } as FormData); window.location.reload(); }}
            className="text-xs text-gray-500 hover:text-white underline underline-offset-2 transition-colors"
          >
            Recommencer à zéro
          </button>
        </div>
      )}

      {/* Section identité */}
      <div>
        <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4 pb-2" style={{ borderBottom: "1px solid #1e1e1e" }}>
          01 — Vos coordonnées
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="rv-prenom" className={labelStyle}>Prénom *</label>
            <input id="rv-prenom" {...register("prenom")} className={inputStyle} placeholder="Votre prénom" />
            {errors.prenom && <p className={errorStyle}><AlertCircle size={10} />{errors.prenom.message}</p>}
          </div>
          <div>
            <label htmlFor="rv-nom" className={labelStyle}>Nom *</label>
            <input id="rv-nom" {...register("nom")} className={inputStyle} placeholder="Votre nom" />
            {errors.nom && <p className={errorStyle}><AlertCircle size={10} />{errors.nom.message}</p>}
          </div>
          <div>
            <label htmlFor="rv-telephone" className={labelStyle}>Téléphone *</label>
            <input id="rv-telephone" {...register("telephone")} type="tel" className={inputStyle} placeholder="06 XX XX XX XX" />
            {errors.telephone && <p className={errorStyle}><AlertCircle size={10} />{errors.telephone.message}</p>}
          </div>
          <div>
            <label htmlFor="rv-email" className={labelStyle}>Email *</label>
            <input id="rv-email" {...register("email")} type="email" className={inputStyle} placeholder="votre@email.fr" />
            {errors.email && <p className={errorStyle}><AlertCircle size={10} />{errors.email.message}</p>}
          </div>
        </div>
      </div>

      {/* Section véhicule */}
      <div>
        <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4 pb-2" style={{ borderBottom: "1px solid #1e1e1e" }}>
          02 — Votre véhicule
        </h2>
        <VehicleSelector
          key={draft ? "draft" : "fresh"}
          initial={draft ? ({ marque: draft.marque ?? "", modele: draft.modele ?? "", annee: draft.annee ?? "", motorisation: draft.motorisation ?? "" } as VehicleValue) : undefined}
          onChange={(v) => {
            const opts = { shouldValidate: isSubmitted };
            setValue("marque", v.marque, opts);
            setValue("modele", v.modele, opts);
            setValue("annee", v.annee, opts);
            setValue("motorisation", v.motorisation, opts);
          }}
          errors={{
            marque: errors.marque?.message,
            modele: errors.modele?.message,
            annee: errors.annee?.message,
            motorisation: errors.motorisation?.message,
          }}
        />
      </div>

      {/* Diffuseur arrière */}
      <fieldset>
        <legend className={labelStyle}>Votre véhicule est-il équipé d&apos;un diffuseur arrière ? *</legend>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
          {REAR_DIFFUSER_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              htmlFor={`rv-rear-diffuser-${opt.value}`}
              className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer"
            >
              <input
                type="radio"
                id={`rv-rear-diffuser-${opt.value}`}
                value={opt.value}
                {...register("rearDiffuser")}
                className="accent-brand-500 w-4 h-4 cursor-pointer flex-shrink-0"
              />
              {opt.label}
            </label>
          ))}
        </div>
        <p className="text-gray-600 text-xs mt-2">
          Le diffuseur est la partie située sous le pare-chocs arrière, autour des sorties d&apos;échappement.
        </p>
        {errors.rearDiffuser && <p className={errorStyle}><AlertCircle size={10} />{errors.rearDiffuser.message}</p>}
      </fieldset>

      {/* Section projet */}
      <div>
        <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4 pb-2" style={{ borderBottom: "1px solid #1e1e1e" }}>
          03 — Votre projet
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="rv-type-projet" className={labelStyle}>Type de projet *</label>
            <div className="relative">
              <select id="rv-type-projet" {...register("typeProjet")} className={`${selectStyle} pr-10`}>
                <option value="">Choisir...</option>
                {typesProjet.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" aria-hidden="true" />
            </div>
            {errors.typeProjet && <p className={errorStyle}><AlertCircle size={10} />{errors.typeProjet.message}</p>}
          </div>
          <div>
            <label htmlFor="rv-sonorite" className={labelStyle}>Préférence sonore *</label>
            <div className="relative">
              <select id="rv-sonorite" {...register("sonoritePreference")} className={`${selectStyle} pr-10`}>
                <option value="">Choisir...</option>
                {sonorities.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" aria-hidden="true" />
            </div>
            {errors.sonoritePreference && <p className={errorStyle}><AlertCircle size={10} />{errors.sonoritePreference.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="rv-description" className={labelStyle}>Description de votre besoin *</label>
            <textarea
              id="rv-description"
              {...register("description")}
              className={inputStyle}
              rows={4}
              placeholder="Décrivez votre projet, vos attentes sonores, vos contraintes budgétaires..."
            />
            {errors.description && <p className={errorStyle}><AlertCircle size={10} />{errors.description.message}</p>}
          </div>
          <div>
            <label htmlFor="rv-creneau" className={labelStyle}>Créneau souhaité (optionnel)</label>
            <input id="rv-creneau" {...register("creneauSouhaite")} className={inputStyle} placeholder="ex : Semaine prochaine matin" />
          </div>
          <div className="flex items-end">
            <p className="text-gray-500 text-xs leading-relaxed pb-1">
              Des photos de votre véhicule ou de la ligne existante ? Envoyez-les à{" "}
              <a href="mailto:contact@perfexhaust.fr" className="text-brand-400 hover:underline">contact@perfexhaust.fr</a>{" "}
              après votre demande — elles nous aideront à affiner le devis.
            </p>
          </div>
        </div>
      </div>

      {/* Résumé avant envoi */}
      {values.marque && values.typeProjet && (
        <div className="p-4 border border-white/10 bg-white/[0.02]">
          <p className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-3">Récapitulatif de votre demande</p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            <div className="flex gap-2"><dt className="text-gray-500 shrink-0">Véhicule :</dt><dd className="text-white">{[values.marque, values.modele, values.annee].filter(Boolean).join(" · ")}</dd></div>
            {values.motorisation && <div className="flex gap-2"><dt className="text-gray-500 shrink-0">Motorisation :</dt><dd className="text-white">{values.motorisation}</dd></div>}
            {values.rearDiffuser && <div className="flex gap-2"><dt className="text-gray-500 shrink-0">Diffuseur arrière :</dt><dd className="text-white">{rearDiffuserLabel(values.rearDiffuser)}</dd></div>}
            <div className="flex gap-2"><dt className="text-gray-500 shrink-0">Projet :</dt><dd className="text-white">{values.typeProjet}</dd></div>
            {values.sonoritePreference && <div className="flex gap-2"><dt className="text-gray-500 shrink-0">Sonorité :</dt><dd className="text-white">{values.sonoritePreference}</dd></div>}
          </dl>
        </div>
      )}

      {/* RGPD */}
      <div className="flex items-start gap-3 p-4" style={{ background: "rgba(18,102,234,0.03)", border: "1px solid rgba(18,102,234,0.1)" }}>
        <input
          type="checkbox"
          id="rgpd"
          {...register("rgpd")}
          className="mt-0.5 accent-brand-500 w-5 h-5 flex-shrink-0 cursor-pointer"
        />
        <label htmlFor="rgpd" className="text-gray-400 text-xs leading-relaxed cursor-pointer">
          J&apos;accepte que PERF&apos;EXHAUST traite mes données personnelles pour répondre à ma demande de devis.
          Ces données ne seront pas partagées avec des tiers sans consentement. Conformément au RGPD,
          vous pouvez exercer vos droits en nous contactant à{" "}
          <a href="mailto:contact@perfexhaust.fr" className="text-brand-400 hover:underline">contact@perfexhaust.fr</a>.
          <br />
          <a href="/mentions-legales#confidentialite" className="text-brand-400 hover:underline">
            Politique de confidentialité
          </a>
        </label>
      </div>
      {errors.rgpd && <p className={errorStyle}><AlertCircle size={10} />{errors.rgpd.message}</p>}

      {status === "error" && (
        <div className="flex items-center gap-3 p-4" style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}>
          <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{errorMsg}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full flex items-center justify-center gap-3 py-4 text-sm font-bold tracking-widest uppercase text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg, #1266ea, #0d54c8)",
          clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
        }}
      >
        {status === "loading" ? (
          <><Loader2 size={16} className="animate-spin" /> Envoi en cours...</>
        ) : (
          <>Envoyer ma demande de devis <ArrowRight size={16} /></>
        )}
      </button>

      <p className="text-center text-gray-600 text-xs">
        Devis gratuit et sans engagement
      </p>
    </form>
  );
}
