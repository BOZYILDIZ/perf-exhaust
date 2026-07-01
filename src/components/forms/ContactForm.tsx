"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const schema = z.object({
  nom: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  sujet: z.string().min(3, "Sujet requis"),
  message: z.string().min(10, "Message trop court (10 caractères minimum)"),
});

type FormData = z.infer<typeof schema>;

const inputStyle = "w-full bg-transparent border border-gray-800 text-white text-sm px-4 py-3 focus:outline-none focus:border-brand-500 transition-colors placeholder-gray-700";
const labelStyle = "block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error();
      setStatus("success");
      reset();
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-12">
        <CheckCircle size={40} className="text-green-400 mx-auto mb-4" />
        <h3 className="text-xl font-black text-white mb-2" style={{ fontFamily: "Oswald, sans-serif" }}>Message envoyé !</h3>
        <p className="text-gray-400 text-sm">Nous vous répondrons dans les 24-48h.</p>
        <button onClick={() => setStatus("idle")} className="mt-6 text-brand-400 text-sm hover:underline">Envoyer un autre message</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <h3 className="text-white font-bold text-sm tracking-widest uppercase pb-3" style={{ borderBottom: "1px solid #1e1e1e", fontFamily: "Oswald, sans-serif" }}>
        Envoyer un message
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelStyle}>Nom *</label>
          <input {...register("nom")} className={inputStyle} placeholder="Votre nom" />
          {errors.nom && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10} />{errors.nom.message}</p>}
        </div>
        <div>
          <label className={labelStyle}>Email *</label>
          <input {...register("email")} type="email" className={inputStyle} placeholder="votre@email.fr" />
          {errors.email && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10} />{errors.email.message}</p>}
        </div>
      </div>
      <div>
        <label className={labelStyle}>Sujet *</label>
        <input {...register("sujet")} className={inputStyle} placeholder="Objet de votre message" />
        {errors.sujet && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10} />{errors.sujet.message}</p>}
      </div>
      <div>
        <label className={labelStyle}>Message *</label>
        <textarea {...register("message")} className={inputStyle} rows={5} placeholder="Votre message..." />
        {errors.message && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10} />{errors.message.message}</p>}
      </div>
      {status === "error" && (
        <div className="p-3 border border-red-500/20 bg-red-500/05">
          <p className="text-red-400 text-sm">Erreur lors de l&apos;envoi. Réessayez ou contactez-nous directement.</p>
        </div>
      )}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full flex items-center justify-center gap-2 py-4 text-sm font-bold tracking-widest uppercase text-white"
        style={{
          background: "linear-gradient(135deg, #1266ea, #0d54c8)",
          clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
        }}
      >
        {status === "loading" ? <><Loader2 size={14} className="animate-spin" /> Envoi...</> : <>Envoyer <ArrowRight size={14} /></>}
      </button>
    </form>
  );
}
