"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ExternalLink,
  HelpCircle,
} from "lucide-react";

export interface PennylaneV2Candidate {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  type: "individual" | "company";
}

export interface PennylaneV2QuoteSummary {
  id: number;
  number: string | null;
  date: string | null;
  deadline: string | null;
  status: string;
  amountTTC: string | null;
  webUrl: string;
}

export interface PennylaneV2InvoiceSummary {
  id: number;
  number: string | null;
  date: string | null;
  deadline: string | null;
  displayStatus: "paid" | "partially_paid" | "unpaid" | "overdue" | "draft";
  amountTTC: number | null;
  amountPaid: number | null;
  amountRemaining: number | null;
  webUrl: string;
}

export interface PennylaneV2FinancialsSummary {
  count: number;
  totalBilled: number;
  totalPaid: number;
  totalRemaining: number;
  lastInvoiceDate: string | null;
  hasUnpaid: boolean;
}

export interface PennylaneV2SectionProps {
  quoteRequestId: string;
  configured: boolean;
  syncStatus: string | null;
  syncError: string | null;
  customerId: string | null;
  customerType: string | null;
  customerName: string | null;
  syncedAt: string | null;
  lastSyncAt: string | null;
  ambiguousCandidates: PennylaneV2Candidate[] | null;
  financials: {
    notSynced: boolean;
    quotes: PennylaneV2QuoteSummary[];
    invoices: PennylaneV2InvoiceSummary[];
    summary: PennylaneV2FinancialsSummary;
    fetchedAt: string | null;
    stale: boolean;
    error: string | null;
  };
  pennylaneHomeUrl: string;
}

const EUR_FORMATTER = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
function euro(n: number | string | null): string {
  if (n === null) return "—";
  const v = typeof n === "string" ? Number(n) : n;
  return Number.isFinite(v) ? EUR_FORMATTER.format(v) : "—";
}
function dateFR(v: string | null): string {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR");
}

const QUOTE_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  accepted: "Accepté",
  denied: "Refusé",
  expired: "Expiré",
  invoiced: "Facturé",
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  paid: "Payée",
  partially_paid: "Partiellement payée",
  unpaid: "Impayée",
  overdue: "En retard",
  draft: "Brouillon",
};

const INVOICE_STATUS_STYLES: Record<string, string> = {
  paid: "text-green-400 bg-green-500/10",
  partially_paid: "text-yellow-400 bg-yellow-500/10",
  unpaid: "text-gray-400 bg-white/5",
  overdue: "text-red-400 bg-red-500/10",
  draft: "text-gray-500 bg-white/5",
};

function StatusBadge({ label, tone }: { label: string; tone: "ok" | "warn" | "err" | "muted" }) {
  const styles: Record<string, string> = {
    ok: "text-green-400 bg-green-500/10",
    warn: "text-yellow-400 bg-yellow-500/10",
    err: "text-red-400 bg-red-500/10",
    muted: "text-gray-400 bg-white/5",
  };
  return (
    <span className={`text-xs font-bold px-2.5 py-1 uppercase tracking-wider ${styles[tone]}`}>{label}</span>
  );
}

/**
 * Section "Pennylane" — nouvelle intégration API v2 (synchronisation client
 * + historique devis/factures). Coexiste avec les sections Pennylane
 * existantes (mode manuel/extension, ancien flux "quote") tant que la
 * Phase A n'a pas été validée — voir docs/MAINTENANCE.md.
 */
export default function PennylaneV2Section(props: PennylaneV2SectionProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  if (!props.configured) {
    return (
      <section>
        <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4 pb-2 border-b border-[#1e1e1e]">Pennylane</h2>
        <p className="text-gray-500 text-sm p-4 border border-[#1e1e1e]" style={{ background: "#0d0d0d" }}>
          Intégration API v2 non configurée — ajoutez <code className="text-brand-400">PENNYLANE_API_TOKEN</code> pour activer la
          synchronisation automatique des clients.
        </p>
      </section>
    );
  }

  const runSync = async () => {
    setSyncing(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/quote-requests/${props.quoteRequestId}/pennylane-v2/sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de la synchronisation");
      setMsg({ type: "ok", text: "Synchronisation effectuée." });
      router.refresh();
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Erreur" });
    } finally {
      setSyncing(false);
    }
  };

  const refreshFinancials = async () => {
    setRefreshing(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/quote-requests/${props.quoteRequestId}/pennylane-v2/financials`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'actualisation");
      router.refresh();
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Erreur" });
    } finally {
      setRefreshing(false);
    }
  };

  const resolveAmbiguity = async (candidate: PennylaneV2Candidate) => {
    setResolvingId(candidate.id);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/quote-requests/${props.quoteRequestId}/pennylane-v2/resolve-ambiguity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: candidate.id, customerType: candidate.type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de la résolution");
      setMsg({ type: "ok", text: `Client « ${candidate.name} » associé à cette demande.` });
      router.refresh();
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Erreur" });
    } finally {
      setResolvingId(null);
    }
  };

  const status = props.syncStatus ?? "PENDING";
  const badge =
    status === "SYNCED"
      ? { label: "Synchronisé", tone: "ok" as const, icon: CheckCircle }
      : status === "FAILED"
        ? { label: "Échec de synchronisation", tone: "err" as const, icon: AlertCircle }
        : status === "AMBIGUOUS"
          ? { label: "Correspondance ambiguë", tone: "warn" as const, icon: HelpCircle }
          : { label: "Non synchronisé", tone: "muted" as const, icon: AlertTriangle };

  return (
    <section>
      <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4 pb-2 border-b border-[#1e1e1e]">Pennylane</h2>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        {syncing ? (
          <span className="text-xs font-bold px-2.5 py-1 uppercase tracking-wider text-brand-400 bg-brand-500/10 inline-flex items-center gap-1.5">
            <Loader2 size={12} className="animate-spin" /> Synchronisation en cours
          </span>
        ) : (
          <StatusBadge label={badge.label} tone={badge.tone} />
        )}
        {props.customerName && (
          <span className="text-gray-300 text-sm">
            {props.customerName} {props.customerId && <span className="text-gray-600">(#{props.customerId})</span>}
          </span>
        )}
        {props.customerId && (
          <a
            href={props.pennylaneHomeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-brand-400 hover:text-brand-300 text-xs"
          >
            Ouvrir dans Pennylane <ExternalLink size={12} />
          </a>
        )}
      </div>

      <div className="text-gray-600 text-xs mb-4 space-y-0.5">
        {props.syncedAt && <p>Dernière synchronisation réussie : {new Date(props.syncedAt).toLocaleString("fr-FR")}</p>}
        {props.lastSyncAt && props.lastSyncAt !== props.syncedAt && (
          <p>Dernière tentative : {new Date(props.lastSyncAt).toLocaleString("fr-FR")}</p>
        )}
      </div>

      {status === "FAILED" && props.syncError && (
        <p className="text-sm text-red-400 px-4 py-2.5 border border-red-500/25 bg-red-500/5 flex items-start gap-2 mb-4 max-w-xl">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" /> {props.syncError}
        </p>
      )}

      {status === "AMBIGUOUS" && props.ambiguousCandidates && props.ambiguousCandidates.length > 0 && (
        <div className="mb-4 max-w-xl">
          <p className="text-sm text-yellow-400 px-4 py-2.5 border border-yellow-500/25 bg-yellow-500/5 flex items-start gap-2 mb-3">
            <HelpCircle size={15} className="flex-shrink-0 mt-0.5" />
            Plusieurs clients Pennylane correspondent à cette demande — sélectionnez le bon :
          </p>
          <ul className="space-y-2">
            {props.ambiguousCandidates.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border border-[#1e1e1e]"
                style={{ background: "#0d0d0d" }}
              >
                <div className="text-sm">
                  <span className="text-white">{c.name}</span>{" "}
                  <span className="text-gray-600">#{c.id}</span>
                  {c.email && <span className="text-gray-500"> · {c.email}</span>}
                  {c.phone && <span className="text-gray-500"> · {c.phone}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => resolveAmbiguity(c)}
                  disabled={resolvingId !== null}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold tracking-widest uppercase text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
                >
                  {resolvingId === c.id ? <Loader2 size={12} className="animate-spin" /> : "Choisir"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {msg && (
        <p
          role="status"
          className={`text-sm px-4 py-2.5 border flex items-center gap-2 mb-4 max-w-xl ${
            msg.type === "ok" ? "text-green-400 border-green-500/25 bg-green-500/5" : "text-red-400 border-red-500/25 bg-red-500/5"
          }`}
        >
          {msg.type === "ok" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {msg.text}
        </p>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        {(status === "FAILED" || status === "PENDING") && (
          <button
            type="button"
            onClick={runSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-widest uppercase text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
          >
            {syncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            {status === "FAILED" ? "Relancer la synchronisation" : "Synchroniser maintenant"}
          </button>
        )}
        {props.customerId && (
          <button
            type="button"
            onClick={refreshFinancials}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-widest uppercase text-gray-300 border border-gray-700 hover:border-gray-500 disabled:opacity-50 transition-colors"
          >
            {refreshing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Actualiser
          </button>
        )}
      </div>

      {props.customerId && !props.financials.notSynced && (
        <PennylaneFinancials financials={props.financials} />
      )}
    </section>
  );
}

function PennylaneFinancials({ financials }: { financials: PennylaneV2SectionProps["financials"] }) {
  const { quotes, invoices, summary, fetchedAt, stale, error } = financials;

  return (
    <div>
      {error && (
        <p className="text-sm text-yellow-400 px-4 py-2.5 border border-yellow-500/25 bg-yellow-500/5 flex items-start gap-2 mb-4 max-w-xl">
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
          {error} {stale && "— dernières données connues affichées ci-dessous."}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <SummaryCell label="Devis" value={String(quotes.length)} />
        <SummaryCell label="Factures" value={String(summary.count)} />
        <SummaryCell label="Total facturé" value={euro(summary.totalBilled)} />
        <SummaryCell label="Reste dû" value={euro(summary.totalRemaining)} warn={summary.hasUnpaid} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 text-xs text-gray-500">
        <p>Total payé : <span className="text-gray-300">{euro(summary.totalPaid)}</span></p>
        <p>Dernière facture : <span className="text-gray-300">{dateFR(summary.lastInvoiceDate)}</span></p>
        {fetchedAt && <p>Actualisé le {new Date(fetchedAt).toLocaleString("fr-FR")}</p>}
      </div>

      <h3 className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-2">Devis ({quotes.length})</h3>
      {quotes.length === 0 ? (
        <p className="text-gray-600 text-sm mb-6">Aucun devis Pennylane pour ce client.</p>
      ) : (
        <div className="border overflow-x-auto mb-6" style={{ borderColor: "#1e1e1e" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase tracking-wider" style={{ background: "#0d0d0d" }}>
                <th className="px-4 py-2.5 font-bold">Numéro</th>
                <th className="px-4 py-2.5 font-bold">Date</th>
                <th className="px-4 py-2.5 font-bold">Montant TTC</th>
                <th className="px-4 py-2.5 font-bold">Statut</th>
                <th className="px-4 py-2.5 font-bold">Validité</th>
                <th className="px-4 py-2.5 font-bold text-right">Lien</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q, i) => (
                <tr key={q.id} style={{ background: i % 2 ? "#0d0d0d" : "#0f0f0f", borderTop: "1px solid #1a1a1a" }}>
                  <td className="px-4 py-2.5 text-white whitespace-nowrap">{q.number ?? `#${q.id}`}</td>
                  <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">{dateFR(q.date)}</td>
                  <td className="px-4 py-2.5 text-gray-300 whitespace-nowrap tabular-nums">{euro(q.amountTTC)}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className="text-xs font-bold px-2 py-0.5 uppercase tracking-wider text-gray-400 bg-white/5">
                      {QUOTE_STATUS_LABELS[q.status] ?? q.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">{dateFR(q.deadline)}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <a href={q.webUrl} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300 inline-flex items-center gap-1">
                      <ExternalLink size={13} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-2">Factures ({invoices.length})</h3>
      {invoices.length === 0 ? (
        <p className="text-gray-600 text-sm">Aucune facture Pennylane pour ce client.</p>
      ) : (
        <div className="border overflow-x-auto" style={{ borderColor: "#1e1e1e" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase tracking-wider" style={{ background: "#0d0d0d" }}>
                <th className="px-4 py-2.5 font-bold">Numéro</th>
                <th className="px-4 py-2.5 font-bold">Date</th>
                <th className="px-4 py-2.5 font-bold">Montant TTC</th>
                <th className="px-4 py-2.5 font-bold">Statut</th>
                <th className="px-4 py-2.5 font-bold">Payé</th>
                <th className="px-4 py-2.5 font-bold">Restant</th>
                <th className="px-4 py-2.5 font-bold">Échéance</th>
                <th className="px-4 py-2.5 font-bold text-right">Lien</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => (
                <tr key={inv.id} style={{ background: i % 2 ? "#0d0d0d" : "#0f0f0f", borderTop: "1px solid #1a1a1a" }}>
                  <td className="px-4 py-2.5 text-white whitespace-nowrap">{inv.number ?? `#${inv.id}`}</td>
                  <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">{dateFR(inv.date)}</td>
                  <td className="px-4 py-2.5 text-gray-300 whitespace-nowrap tabular-nums">{euro(inv.amountTTC)}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className={`text-xs font-bold px-2 py-0.5 uppercase tracking-wider ${INVOICE_STATUS_STYLES[inv.displayStatus] ?? "text-gray-400 bg-white/5"}`}>
                      {INVOICE_STATUS_LABELS[inv.displayStatus] ?? inv.displayStatus}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap tabular-nums">{euro(inv.amountPaid)}</td>
                  <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap tabular-nums">{euro(inv.amountRemaining)}</td>
                  <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">{dateFR(inv.deadline)}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <a href={inv.webUrl} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300 inline-flex items-center gap-1">
                      <ExternalLink size={13} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryCell({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="px-4 py-3 border" style={{ background: warn ? "rgba(239,68,68,0.05)" : "#0f0f0f", borderColor: warn ? "rgba(239,68,68,0.3)" : "#1e1e1e" }}>
      <div className={`text-lg font-black ${warn ? "text-red-400" : "text-white"}`} style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
        {value}
      </div>
      <div className="text-gray-500 text-xs uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}
