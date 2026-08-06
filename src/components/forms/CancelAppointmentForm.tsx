"use client";

import { useState } from "react";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function CancelAppointmentForm({ token }: { token: string }) {
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/rendez-vous/annuler/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible d'annuler ce rendez-vous.");
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Erreur réseau — réessayez.");
    }
  };

  if (status === "done") {
    return (
      <div className="flex items-start gap-3 p-4" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}>
        <CheckCircle size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
        <p className="text-green-400 text-sm">Votre rendez-vous a bien été annulé. Un email de confirmation vous a été envoyé.</p>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="cancel-reason" className="block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2">
        Motif (facultatif)
      </label>
      <textarea
        id="cancel-reason"
        value={reason}
        onChange={(e) => setReason(e.target.value.slice(0, 500))}
        maxLength={500}
        rows={3}
        className="w-full bg-transparent border border-gray-800 text-white text-sm px-4 py-3 focus:outline-none focus:border-brand-500 transition-colors mb-4"
        placeholder="Vous pouvez préciser la raison de votre annulation (optionnel)"
      />

      {status === "error" && (
        <div className="flex items-center gap-3 p-4 mb-4" style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}>
          <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{errorMsg}</p>
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={status === "loading"}
        className="w-full flex items-center justify-center gap-3 py-4 text-sm font-bold tracking-widest uppercase text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
      >
        {status === "loading" ? <><Loader2 size={16} className="animate-spin" /> Annulation en cours...</> : "Confirmer l'annulation"}
      </button>
    </div>
  );
}
