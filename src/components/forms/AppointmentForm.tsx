"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const schema = z.object({
  nom: z.string().min(2, "Nom requis"),
  prenom: z.string().min(2, "Prénom requis"),
  telephone: z.string().min(10, "Téléphone invalide"),
  email: z.string().email("Email invalide"),
  marque: z.string().min(2, "Marque requise"),
  modele: z.string().min(1, "Modèle requis"),
  annee: z.string().min(4, "Année requise"),
  motorisation: z.string().optional(),
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

const labelStyle = "block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2";
const inputStyle = "w-full bg-transparent border border-gray-800 text-white text-sm px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors placeholder-gray-700";
const selectStyle = "w-full bg-gray-950 border border-gray-800 text-white text-sm px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors appearance-none";
const errorStyle = "text-red-400 text-xs mt-1 flex items-center gap-1";

export default function AppointmentForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [fileName, setFileName] = useState<string>("");

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

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
      reset();
      setFileName("");
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
        <h3 className="text-2xl font-black text-white mb-3" style={{ fontFamily: "Oswald, sans-serif" }}>
          Demande envoyée !
        </h3>
        <p className="text-gray-400 text-sm max-w-md mx-auto mb-2">
          Votre demande de devis a bien été reçue. Notre équipe va analyser votre projet et vous contactera dans les <strong className="text-white">24 à 48h</strong>.
        </p>
        <p className="text-gray-500 text-xs">Un email de confirmation vous a été envoyé.</p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-8 text-orange-400 text-sm hover:text-orange-300 transition-colors underline"
        >
          Faire une nouvelle demande
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Section identité */}
      <div>
        <h3 className="text-white font-bold text-sm tracking-widest uppercase mb-4 pb-2" style={{ borderBottom: "1px solid #1e1e1e" }}>
          01 — Vos coordonnées
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelStyle}>Prénom *</label>
            <input {...register("prenom")} className={inputStyle} placeholder="Votre prénom" />
            {errors.prenom && <p className={errorStyle}><AlertCircle size={10} />{errors.prenom.message}</p>}
          </div>
          <div>
            <label className={labelStyle}>Nom *</label>
            <input {...register("nom")} className={inputStyle} placeholder="Votre nom" />
            {errors.nom && <p className={errorStyle}><AlertCircle size={10} />{errors.nom.message}</p>}
          </div>
          <div>
            <label className={labelStyle}>Téléphone *</label>
            <input {...register("telephone")} type="tel" className={inputStyle} placeholder="06 XX XX XX XX" />
            {errors.telephone && <p className={errorStyle}><AlertCircle size={10} />{errors.telephone.message}</p>}
          </div>
          <div>
            <label className={labelStyle}>Email *</label>
            <input {...register("email")} type="email" className={inputStyle} placeholder="votre@email.fr" />
            {errors.email && <p className={errorStyle}><AlertCircle size={10} />{errors.email.message}</p>}
          </div>
        </div>
      </div>

      {/* Section véhicule */}
      <div>
        <h3 className="text-white font-bold text-sm tracking-widest uppercase mb-4 pb-2" style={{ borderBottom: "1px solid #1e1e1e" }}>
          02 — Votre véhicule
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelStyle}>Marque *</label>
            <input {...register("marque")} className={inputStyle} placeholder="ex : BMW, Audi..." />
            {errors.marque && <p className={errorStyle}><AlertCircle size={10} />{errors.marque.message}</p>}
          </div>
          <div>
            <label className={labelStyle}>Modèle *</label>
            <input {...register("modele")} className={inputStyle} placeholder="ex : Série 3, A4..." />
            {errors.modele && <p className={errorStyle}><AlertCircle size={10} />{errors.modele.message}</p>}
          </div>
          <div>
            <label className={labelStyle}>Année *</label>
            <input {...register("annee")} className={inputStyle} placeholder="ex : 2021" maxLength={4} />
            {errors.annee && <p className={errorStyle}><AlertCircle size={10} />{errors.annee.message}</p>}
          </div>
          <div className="sm:col-span-3">
            <label className={labelStyle}>Motorisation (optionnel)</label>
            <input {...register("motorisation")} className={inputStyle} placeholder="ex : 2.0 TDI 150ch, 2.0 TSI 300ch..." />
          </div>
        </div>
      </div>

      {/* Section projet */}
      <div>
        <h3 className="text-white font-bold text-sm tracking-widest uppercase mb-4 pb-2" style={{ borderBottom: "1px solid #1e1e1e" }}>
          03 — Votre projet
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelStyle}>Type de projet *</label>
            <div className="relative">
              <select {...register("typeProjet")} className={selectStyle}>
                <option value="">Choisir...</option>
                {typesProjet.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {errors.typeProjet && <p className={errorStyle}><AlertCircle size={10} />{errors.typeProjet.message}</p>}
          </div>
          <div>
            <label className={labelStyle}>Préférence sonore *</label>
            <div className="relative">
              <select {...register("sonoritePreference")} className={selectStyle}>
                <option value="">Choisir...</option>
                {sonorities.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {errors.sonoritePreference && <p className={errorStyle}><AlertCircle size={10} />{errors.sonoritePreference.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className={labelStyle}>Description de votre besoin *</label>
            <textarea
              {...register("description")}
              className={inputStyle}
              rows={4}
              placeholder="Décrivez votre projet, vos attentes sonores, vos contraintes budgétaires..."
            />
            {errors.description && <p className={errorStyle}><AlertCircle size={10} />{errors.description.message}</p>}
          </div>
          <div>
            <label className={labelStyle}>Créneau souhaité (optionnel)</label>
            <input {...register("creneauSouhaite")} className={inputStyle} placeholder="ex : Semaine prochaine matin" />
          </div>
          <div>
            <label className={labelStyle}>Photos du véhicule (optionnel)</label>
            <label
              className="flex items-center gap-3 border border-gray-800 border-dashed px-4 py-3 cursor-pointer hover:border-orange-500 transition-colors"
              htmlFor="photos"
            >
              <Upload size={16} className="text-gray-500" />
              <span className="text-gray-600 text-sm">{fileName || "Ajouter des photos..."}</span>
            </label>
            <input
              id="photos"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
            />
            <p className="text-gray-700 text-xs mt-1">JPG, PNG — Max 5MB (traitement côté client uniquement)</p>
          </div>
        </div>
      </div>

      {/* RGPD */}
      <div className="flex items-start gap-3 p-4" style={{ background: "rgba(249,115,22,0.03)", border: "1px solid rgba(249,115,22,0.1)" }}>
        <input
          type="checkbox"
          id="rgpd"
          {...register("rgpd")}
          className="mt-0.5 accent-orange-500 w-4 h-4 flex-shrink-0"
        />
        <label htmlFor="rgpd" className="text-gray-400 text-xs leading-relaxed cursor-pointer">
          J&apos;accepte que PERF&apos;EXHAUST traite mes données personnelles pour répondre à ma demande de devis.
          Ces données ne seront pas partagées avec des tiers sans consentement. Conformément au RGPD,
          vous pouvez exercer vos droits en nous contactant à{" "}
          <a href="mailto:contact@perfexhaust.fr" className="text-orange-400 hover:underline">contact@perfexhaust.fr</a>.
          <br />
          <a href="/mentions-legales#confidentialite" className="text-orange-400 hover:underline">
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
        className="w-full flex items-center justify-center gap-3 py-4 text-sm font-bold tracking-widest uppercase text-black transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg, #f97316, #ea580c)",
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
        Réponse garantie sous 24-48h · Devis gratuit et sans engagement
      </p>
    </form>
  );
}
