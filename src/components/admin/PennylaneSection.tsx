"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ExternalLink, AlertCircle, CheckCircle2, RefreshCw, FileWarning } from "lucide-react";

export interface PennylaneState {
  pennylaneQuoteId: string | null;
  pennylaneQuoteNumber: string | null;
  pennylaneQuoteUrl: string | null;
  pennylaneSyncStatus: string | null;
  pennylaneSyncError: string | null;
  pennylaneSyncedAt: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  not_configured: "Non synchronisé",
  draft: "Créé dans Pennylane (brouillon)",
  synced: "Synchronisé",
  failed: "Échec de synchronisation",
};

const STATUS_STYLES: Record<string, string> = {
  not_configured: "text-gray-400 bg-white/5",
  draft: "text-brand-400 bg-brand-500/10",
  synced: "text-green-400 bg-green-500/10",
  failed: "text-red-400 bg-red-500/10",
};

export default function PennylaneSection({
  quoteRequestId,
  state,
  pennylaneConfigured,
  canCreate,
  blockReason,
}: {
  quoteRequestId: string;
  state: PennylaneState;
  pennylaneConfigured: boolean;
  canCreate: boolean;
  blockReason: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = state.pennylaneSyncStatus || "not_configured";
  const hasQuote = Boolean(state.pennylaneQuoteId);

  const create = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/quote-requests/${quoteRequestId}/pennylane/create`, { method: "POST" });
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
            Définissez <code className="text-brand-400">PENNYLANE_API_KEY</code> pour activer la création de devis
            depuis cette demande. Voir <code className="text-brand-400">docs/MAINTENANCE.md</code> § « Intégration Pennylane ».
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

      {hasQuote && (
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
          {state.pennylaneQuoteUrl && (
            <div className="sm:col-span-2">
              <a
                href={state.pennylaneQuoteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-brand-400 hover:text-brand-300 transition-colors"
              >
                Ouvrir dans Pennylane <ExternalLink size={13} />
              </a>
            </div>
          )}
        </dl>
      )}

      {(state.pennylaneSyncError && status === "failed") && (
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

      {hasQuote ? (
        <p className="text-xs text-gray-600 flex items-center gap-1.5">
          <CheckCircle2 size={13} className="text-green-500" /> Devis déjà créé — pour éviter un doublon, une nouvelle création n&apos;est pas proposée ici. Utilisez Pennylane directement pour toute modification ultérieure.
        </p>
      ) : (
        <>
          <button
            type="button"
            onClick={create}
            disabled={loading || !canCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-widest uppercase text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
          >
            {loading ? (
              <><Loader2 size={14} className="animate-spin" /> Création...</>
            ) : status === "failed" ? (
              <><RefreshCw size={13} /> Réessayer</>
            ) : (
              "Créer le devis dans Pennylane"
            )}
          </button>
          {!canCreate && blockReason && (
            <p className="text-xs text-gray-500 mt-2">{blockReason}</p>
          )}
        </>
      )}
    </section>
  );
}
