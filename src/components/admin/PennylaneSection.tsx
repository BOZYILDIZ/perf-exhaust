"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ExternalLink, AlertCircle, RefreshCw, FileWarning, Info } from "lucide-react";

export interface PennylaneState {
  pennylaneQuoteId: string | null;
  pennylaneQuoteNumber: string | null;
  pennylaneQuoteUrl: string | null;
  pennylaneSyncStatus: string | null;
  pennylaneSyncError: string | null;
  pennylaneSyncedAt: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  not_configured: "Non configuré",
  pending: "En attente",
  draft_created: "Brouillon créé",
  failed: "Erreur",
};

const STATUS_STYLES: Record<string, string> = {
  not_configured: "text-gray-400 bg-white/5",
  pending: "text-yellow-400 bg-yellow-500/10",
  draft_created: "text-green-400 bg-green-500/10",
  failed: "text-red-400 bg-red-500/10",
};

/**
 * Pennylane est la source unique pour les devis et les factures — ce bloc ne
 * fait que REFLÉTER l'état du brouillon créé automatiquement par
 * POST /api/rendez-vous (voir src/lib/pennylane/client.ts,
 * createDraftQuoteFromRequest). Le panel PERF'EXHAUST ne construit plus de
 * devis local : prix, envoi, acceptation et facturation se font dans
 * Pennylane. Voir docs/MAINTENANCE.md § "Intégration Pennylane".
 */
export default function PennylaneSection({
  quoteRequestId,
  state,
  pennylaneConfigured,
}: {
  quoteRequestId: string;
  state: PennylaneState;
  pennylaneConfigured: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = state.pennylaneSyncStatus || "not_configured";
  const hasQuote = Boolean(state.pennylaneQuoteId);
  const hasFailed = status === "failed";

  const retry = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/quote-requests/${quoteRequestId}/pennylane/retry`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.error || "Création impossible");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  if (!pennylaneConfigured) {
    return (
      <section>
        <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4 pb-2 border-b border-[#1e1e1e]">Devis Pennylane</h2>
        <p className="text-sm text-gray-400 p-4 border border-brand-500/25 bg-brand-500/5 flex items-start gap-3 max-w-xl">
          <FileWarning size={18} className="text-brand-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong className="text-white block mb-1">Pennylane non configuré</strong>
            Définissez <code className="text-brand-400">PENNYLANE_API_KEY</code> pour qu&apos;un brouillon de devis
            soit créé automatiquement à chaque nouvelle demande. Voir{" "}
            <code className="text-brand-400">docs/MAINTENANCE.md</code> § « Intégration Pennylane ».
          </span>
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4 pb-2 border-b border-[#1e1e1e]">Devis Pennylane</h2>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className={`text-xs font-bold px-2.5 py-1 uppercase tracking-wider ${STATUS_STYLES[status] ?? STATUS_STYLES.not_configured}`}>
          {STATUS_LABELS[status] ?? status}
        </span>
        {state.pennylaneSyncedAt && (
          <span className="text-gray-600 text-xs">le {new Date(state.pennylaneSyncedAt).toLocaleString("fr-FR")}</span>
        )}
      </div>

      {hasQuote ? (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm">
          <div>
            <dt className="text-gray-600 text-xs uppercase tracking-wider mb-0.5">ID Pennylane</dt>
            <dd className="text-white">{state.pennylaneQuoteId}</dd>
          </div>
          {state.pennylaneQuoteNumber && (
            <div>
              <dt className="text-gray-600 text-xs uppercase tracking-wider mb-0.5">Numéro de devis</dt>
              <dd className="text-white">{state.pennylaneQuoteNumber}</dd>
            </div>
          )}
        </dl>
      ) : (
        <p className="text-sm text-gray-400 p-3 border border-[#1e1e1e] bg-white/[0.02] mb-4 flex items-start gap-2 max-w-xl">
          <Info size={15} className="text-gray-500 flex-shrink-0 mt-0.5" />
          {hasFailed
            ? "La création automatique du brouillon a échoué — la demande est bien enregistrée, mais aucun devis Pennylane n'existe encore."
            : "Aucun brouillon Pennylane n'a encore été créé pour cette demande."}
        </p>
      )}

      {hasFailed && state.pennylaneSyncError && (
        <p className="text-sm text-red-400 p-3 border border-red-500/25 bg-red-500/5 mb-4 flex items-start gap-2 max-w-xl">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          {state.pennylaneSyncError}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-400 p-3 border border-red-500/25 bg-red-500/5 mb-4 flex items-start gap-2 max-w-xl">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-4">
        {hasQuote && state.pennylaneQuoteUrl && (
          <a
            href={state.pennylaneQuoteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-widest uppercase text-white"
            style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
          >
            Ouvrir dans Pennylane <ExternalLink size={13} />
          </a>
        )}
        {!hasQuote && (
          <button
            type="button"
            onClick={retry}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-widest uppercase text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
          >
            {loading ? (
              <><Loader2 size={14} className="animate-spin" /> Création...</>
            ) : (
              <><RefreshCw size={13} /> {hasFailed ? "Réessayer la création du brouillon" : "Créer le brouillon Pennylane"}</>
            )}
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 max-w-xl">
        Les prix, l&apos;envoi au client, l&apos;acceptation et la facturation sont gérés directement dans Pennylane.
      </p>
    </section>
  );
}
