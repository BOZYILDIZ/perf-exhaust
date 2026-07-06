"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2, Archive, CheckCircle, AlertCircle, Phone, Mail } from "lucide-react";
import QuoteLinesEditor, { type QuoteLineValue } from "@/components/admin/QuoteLinesEditor";
import PennylaneSection from "@/components/admin/PennylaneSection";

export interface QuoteRequestDetailData {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  marque: string;
  modele: string;
  annee: string;
  motorisation: string | null;
  typeProjet: string;
  sonorite: string;
  message: string;
  status: string;
  notes: string;
  createdAt: string;
  pennylaneCustomerId: string | null;
  pennylaneQuoteId: string | null;
  pennylaneQuoteNumber: string | null;
  pennylaneQuoteUrl: string | null;
  pennylaneSyncStatus: string | null;
  pennylaneSyncError: string | null;
  pennylaneSyncedAt: string | null;
}

const STATUSES = [
  { value: "new", label: "Nouvelle" },
  { value: "contacted", label: "Contactée" },
  { value: "in_progress", label: "En cours" },
  { value: "completed", label: "Terminée" },
  { value: "archived", label: "Archivée" },
];

const label = "block text-xs font-bold tracking-widest uppercase text-gray-400 mb-2";
const sectionTitle = "text-white font-bold text-sm tracking-widest uppercase mb-4 pb-2 border-b border-[#1e1e1e]";

function InfoRow({ label: l, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-gray-600 text-xs uppercase tracking-wider mb-1">{l}</div>
      <div className="text-white text-sm">{value}</div>
    </div>
  );
}

export default function QuoteRequestDetail({
  request,
  initialLines,
  pennylaneConfigured,
}: {
  request: QuoteRequestDetailData;
  initialLines: QuoteLineValue[];
  pennylaneConfigured: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(request.status);
  const [notes, setNotes] = useState(request.notes);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const hasClientInfo = Boolean(request.email.trim() && request.nom.trim() && request.prenom.trim());
  const hasLines = initialLines.length > 0;
  const allPriced = hasLines && initialLines.every((l) => l.unitPriceCents > 0);
  const canCreatePennylaneQuote = hasClientInfo && hasLines && allPriced;
  const blockReason = !hasClientInfo
    ? "Nom ou email du client manquant."
    : !hasLines
      ? "Ajoutez et enregistrez au moins une ligne de devis ci-dessus."
      : !allPriced
        ? "Toutes les lignes doivent avoir un prix renseigné — enregistrez après modification."
        : null;

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/quote-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enregistrement impossible");
      setMsg({ type: "ok", text: "Modifications enregistrées." });
      router.refresh();
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Erreur" });
    } finally {
      setSaving(false);
    }
  };

  const archive = async () => {
    setStatus("archived");
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/quote-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived", notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Archivage impossible");
      setMsg({ type: "ok", text: "Demande archivée." });
      router.refresh();
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Erreur" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Supprimer définitivement la demande de « ${request.prenom} ${request.nom} » ?\nCette action est irréversible.`)) return;
    setDeleting(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/quote-requests/${request.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Suppression impossible");
      router.push("/admin/devis");
      router.refresh();
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Erreur" });
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8 pb-10">
      <section>
        <h2 className={sectionTitle}>Client</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow label="Nom" value={`${request.prenom} ${request.nom}`} />
          <InfoRow label="Reçue le" value={new Date(request.createdAt).toLocaleString("fr-FR")} />
          <div>
            <div className="text-gray-600 text-xs uppercase tracking-wider mb-1">Email</div>
            <a href={`mailto:${request.email}`} className="text-brand-400 hover:text-brand-300 text-sm inline-flex items-center gap-1.5">
              <Mail size={13} /> {request.email}
            </a>
          </div>
          <div>
            <div className="text-gray-600 text-xs uppercase tracking-wider mb-1">Téléphone</div>
            <a href={`tel:${request.telephone}`} className="text-brand-400 hover:text-brand-300 text-sm inline-flex items-center gap-1.5">
              <Phone size={13} /> {request.telephone}
            </a>
          </div>
        </div>
      </section>

      <section>
        <h2 className={sectionTitle}>Véhicule & projet</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow label="Véhicule" value={`${request.marque} ${request.modele} (${request.annee})`} />
          <InfoRow label="Motorisation" value={request.motorisation || "Non précisée"} />
          <InfoRow label="Type de projet" value={request.typeProjet} />
          <InfoRow label="Sonorité souhaitée" value={request.sonorite} />
        </div>
        <div className="mt-4">
          <div className="text-gray-600 text-xs uppercase tracking-wider mb-1">Message</div>
          <p className="text-gray-300 text-sm leading-relaxed p-4 border border-[#1e1e1e]" style={{ background: "#0d0d0d" }}>
            {request.message}
          </p>
        </div>
      </section>

      <section>
        <h2 className={sectionTitle}>Lignes du devis</h2>
        <QuoteLinesEditor quoteRequestId={request.id} initialLines={initialLines} />
      </section>

      <PennylaneSection
        quoteRequestId={request.id}
        pennylaneConfigured={pennylaneConfigured}
        canCreate={canCreatePennylaneQuote}
        blockReason={blockReason}
        state={{
          pennylaneQuoteId: request.pennylaneQuoteId,
          pennylaneQuoteNumber: request.pennylaneQuoteNumber,
          pennylaneQuoteUrl: request.pennylaneQuoteUrl,
          pennylaneSyncStatus: request.pennylaneSyncStatus,
          pennylaneSyncError: request.pennylaneSyncError,
          pennylaneSyncedAt: request.pennylaneSyncedAt,
        }}
      />

      <section>
        <h2 className={sectionTitle}>Suivi atelier</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="qr-status" className={label}>Statut</label>
            <select
              id="qr-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-transparent border border-gray-800 text-white text-sm px-4 py-2.5 focus:outline-none focus:border-brand-500 transition-colors"
              style={{ background: "#0d0d0d" }}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value} style={{ background: "#0d0d0d" }}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="qr-notes" className={label}>Notes internes <span className="text-gray-600 normal-case">(jamais visibles publiquement)</span></label>
          <textarea
            id="qr-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            className="w-full bg-transparent border border-gray-800 text-white text-sm px-4 py-2.5 focus:outline-none focus:border-brand-500 transition-colors resize-y"
            placeholder="Ex : Devis envoyé le 12/07, en attente de réponse client..."
          />
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

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={save}
          disabled={saving || deleting}
          className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold tracking-widest uppercase text-white disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
        >
          {saving ? <><Loader2 size={15} className="animate-spin" /> Enregistrement...</> : <><Save size={14} /> Enregistrer</>}
        </button>
        <button
          onClick={archive}
          disabled={saving || deleting || status === "archived"}
          className="inline-flex items-center gap-2 px-5 py-3 text-xs font-bold tracking-widest uppercase text-gray-300 border border-gray-700 hover:border-gray-500 disabled:opacity-40 transition-colors"
        >
          <Archive size={14} /> Archiver
        </button>
        <button
          onClick={remove}
          disabled={saving || deleting}
          className="inline-flex items-center gap-2 px-5 py-3 text-xs font-bold tracking-widest uppercase text-red-400 border border-red-500/30 hover:border-red-400 disabled:opacity-40 transition-colors ml-auto"
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Supprimer
        </button>
      </div>
    </div>
  );
}
