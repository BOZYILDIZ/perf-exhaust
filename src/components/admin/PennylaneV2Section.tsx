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
  Mail,
  Phone,
  Car,
  Calendar,
  Wallet,
  FileText,
  Receipt,
  CheckCircle2,
  Fingerprint,
  MapPin,
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
  amountHT: string | null;
  amountTTC: string | null;
  webUrl: string;
}

export interface PennylaneV2InvoiceSummary {
  id: number;
  number: string | null;
  date: string | null;
  deadline: string | null;
  rawStatus: string | null;
  displayStatus: "paid" | "partially_paid" | "unpaid" | "overdue" | "draft" | "cancelled" | "other";
  amountTTC: number | null;
  amountPaid: number | null;
  amountRemaining: number | null;
  webUrl: string;
}

export interface PennylaneV2VehicleEntry {
  marque: string;
  modele: string;
  annee: string;
  motorisation: string | null;
  requestCount: number;
}

export interface PennylaneV2Badge {
  kind: string;
  label: string;
  emoji: string;
  tone: "err" | "warn" | "loyal" | "existing" | "new";
}

export interface PennylaneV2TimelineEvent {
  kind: string;
  label: string;
  date: string;
  detail?: string;
  approximate?: boolean;
}

export interface PennylaneV2ClientCard {
  nom: string;
  email: string;
  telephone: string;
  billingAddress: string | null;
  billingPostalCode: string | null;
  billingCity: string | null;
  vehicleCount: number;
  quoteCount: number;
  invoiceCount: number;
  totalBilled: number;
  lastInterventionDate: string | null;
  lastSyncAt: string | null;
}

export interface PennylaneV2FinancialsSummary {
  count: number;
  paidCount: number;
  unpaidCount: number;
  totalBilled: number;
  totalPaid: number;
  totalRemaining: number;
  lastInvoiceDate: string | null;
  hasUnpaid: boolean;
}

export interface PennylaneV2QuotesStats {
  count: number;
  accepted: number;
  denied: number;
  expired: number;
  pending: number;
  invoiced: number;
}

export interface PennylaneV2Profile {
  pennylaneCustomerId: number | null;
  pennylaneCustomerName: string | null;
  pennylaneCreatedAt: string | null;
  customerFetchError: string | null;
  requestCount: number;
  vehicles: PennylaneV2VehicleEntry[];
  badge: PennylaneV2Badge;
  timeline: PennylaneV2TimelineEvent[];
  card: PennylaneV2ClientCard;
  financials: {
    notSynced: boolean;
    quotes: PennylaneV2QuoteSummary[];
    invoices: PennylaneV2InvoiceSummary[];
    summary: PennylaneV2FinancialsSummary;
    quotesStats: PennylaneV2QuotesStats;
    fetchedAt: string | null;
    stale: boolean;
    error: string | null;
  };
}

export interface PennylaneV2SectionProps {
  quoteRequestId: string;
  configured: boolean;
  syncStatus: string | null;
  syncError: string | null;
  customerType: string | null;
  ambiguousCandidates: PennylaneV2Candidate[] | null;
  profile: PennylaneV2Profile | null;
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
function dateTimeFR(v: string | null): string {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("fr-FR");
}

/** Jamais de détail technique côté navigateur — un fetch échoué ne doit jamais afficher autre chose qu'un message propre. */
function safeErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message) return e.message;
  return fallback;
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
  cancelled: "Annulée",
  other: "Autre",
};

const INVOICE_STATUS_STYLES: Record<string, string> = {
  paid: "text-green-400 bg-green-500/10",
  partially_paid: "text-yellow-400 bg-yellow-500/10",
  unpaid: "text-gray-400 bg-white/5",
  overdue: "text-red-400 bg-red-500/10",
  draft: "text-gray-500 bg-white/5",
  cancelled: "text-gray-600 bg-white/5",
  other: "text-gray-400 bg-white/5",
};

const BADGE_STYLES: Record<PennylaneV2Badge["tone"], string> = {
  err: "text-red-400 bg-red-500/10 border-red-500/25",
  warn: "text-orange-400 bg-orange-500/10 border-orange-500/25",
  loyal: "text-purple-300 bg-purple-500/10 border-purple-500/25",
  existing: "text-blue-300 bg-blue-500/10 border-blue-500/25",
  new: "text-green-400 bg-green-500/10 border-green-500/25",
};

const TIMELINE_ICONS: Record<string, typeof FileText> = {
  demande_creee: FileText,
  sync_pennylane: RefreshCw,
  devis_cree: FileText,
  devis_accepte: CheckCircle2,
  facture_cree: Receipt,
  facture_creee: Receipt,
  facture_payee: Wallet,
};

function SyncStatusBadge({ status, syncing }: { status: string | null; syncing: boolean }) {
  if (syncing) {
    return (
      <span className="text-xs font-bold px-2.5 py-1 uppercase tracking-wider text-brand-400 bg-brand-500/10 inline-flex items-center gap-1.5">
        <Loader2 size={12} className="animate-spin" /> Synchronisation en cours
      </span>
    );
  }
  const map: Record<string, { label: string; tone: string }> = {
    SYNCED: { label: "Synchronisé", tone: "text-green-400 bg-green-500/10" },
    FAILED: { label: "Échec de synchronisation", tone: "text-red-400 bg-red-500/10" },
    AMBIGUOUS: { label: "Correspondance ambiguë", tone: "text-yellow-400 bg-yellow-500/10" },
  };
  const s = map[status ?? ""] ?? { label: "Non synchronisé", tone: "text-gray-400 bg-white/5" };
  return <span className={`text-xs font-bold px-2.5 py-1 uppercase tracking-wider ${s.tone}`}>{s.label}</span>;
}

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

  const profile = props.profile;

  const runSync = async () => {
    setSyncing(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/quote-requests/${props.quoteRequestId}/pennylane-v2/sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Synchronisation impossible");
      setMsg({ type: "ok", text: "Synchronisation effectuée." });
      router.refresh();
    } catch (e) {
      setMsg({ type: "err", text: safeErrorMessage(e, "Erreur réseau — synchronisation impossible.") });
    } finally {
      setSyncing(false);
    }
  };

  /** "Actualiser Pennylane" : synchronise le client PUIS rafraîchit devis/factures/statistiques en un seul geste, sans recharger la page (router.refresh() ne fait qu'un aller-retour serveur, pas un rechargement navigateur). */
  const refreshAll = async () => {
    setRefreshing(true);
    setMsg(null);
    try {
      const syncRes = await fetch(`/api/admin/quote-requests/${props.quoteRequestId}/pennylane-v2/sync`, { method: "POST" });
      const syncData = await syncRes.json();
      if (!syncRes.ok) throw new Error(syncData.error || "Synchronisation impossible");

      const finRes = await fetch(`/api/admin/quote-requests/${props.quoteRequestId}/pennylane-v2/financials`, { method: "POST" });
      const finData = await finRes.json();
      if (!finRes.ok) throw new Error(finData.error || "Récupération des devis/factures impossible");

      setMsg({ type: "ok", text: "Client, devis et factures actualisés." });
      router.refresh();
    } catch (e) {
      setMsg({ type: "err", text: safeErrorMessage(e, "Pennylane indisponible — réessayez dans un instant.") });
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
      if (!res.ok) throw new Error(data.error || "Résolution impossible");
      setMsg({ type: "ok", text: `Client « ${candidate.name} » associé à cette demande.` });
      router.refresh();
    } catch (e) {
      setMsg({ type: "err", text: safeErrorMessage(e, "Erreur réseau — résolution impossible.") });
    } finally {
      setResolvingId(null);
    }
  };

  const badge = profile?.badge;

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-2 border-b border-[#1e1e1e]">
        <h2 className="text-white font-bold text-sm tracking-widest uppercase">Pennylane — CRM client</h2>
        {badge && (
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 uppercase tracking-wider border ${BADGE_STYLES[badge.tone]}`}>
            <span aria-hidden="true">{badge.emoji}</span> {badge.label}
          </span>
        )}
      </div>

      {/* --- En-tête : identité, statut, dates, actions --- */}
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <SyncStatusBadge status={props.syncStatus} syncing={syncing} />
        {profile?.pennylaneCustomerName && (
          <span className="text-gray-200 text-sm font-medium">{profile.pennylaneCustomerName}</span>
        )}
        {profile?.pennylaneCustomerId && (
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

      <div className="flex flex-wrap gap-x-5 gap-y-1 text-gray-600 text-xs mb-4">
        {profile?.pennylaneCustomerId && (
          <span className="inline-flex items-center gap-1.5"><Fingerprint size={12} /> ID Pennylane #{profile.pennylaneCustomerId}</span>
        )}
        {profile?.pennylaneCreatedAt && (
          <span className="inline-flex items-center gap-1.5"><Calendar size={12} /> Client créé le {dateFR(profile.pennylaneCreatedAt)}</span>
        )}
        {profile?.card.lastSyncAt && (
          <span className="inline-flex items-center gap-1.5"><RefreshCw size={12} /> Dernière synchronisation : {dateTimeFR(profile.card.lastSyncAt)}</span>
        )}
      </div>

      {props.syncStatus === "FAILED" && props.syncError && (
        <p className="text-sm text-red-400 px-4 py-2.5 border border-red-500/25 bg-red-500/5 flex items-start gap-2 mb-4 max-w-xl">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" /> {props.syncError}
        </p>
      )}
      {profile?.customerFetchError && (
        <p className="text-sm text-yellow-400 px-4 py-2.5 border border-yellow-500/25 bg-yellow-500/5 flex items-start gap-2 mb-4 max-w-xl">
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" /> {profile.customerFetchError}
        </p>
      )}

      {props.syncStatus === "AMBIGUOUS" && props.ambiguousCandidates && props.ambiguousCandidates.length > 0 && (
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
          className={`text-sm px-4 py-2.5 border flex items-center gap-2 mb-4 max-w-xl transition-opacity ${
            msg.type === "ok" ? "text-green-400 border-green-500/25 bg-green-500/5" : "text-red-400 border-red-500/25 bg-red-500/5"
          }`}
        >
          {msg.type === "ok" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {msg.text}
        </p>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        {(props.syncStatus === "FAILED" || props.syncStatus === "PENDING" || !props.syncStatus) && (
          <button
            type="button"
            onClick={runSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-widest uppercase text-white disabled:opacity-50 transition-transform active:scale-95"
            style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
          >
            {syncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            {props.syncStatus === "FAILED" ? "Relancer la synchronisation" : "Synchroniser maintenant"}
          </button>
        )}
        {profile?.pennylaneCustomerId && (
          <button
            type="button"
            onClick={refreshAll}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-widest uppercase text-gray-300 border border-gray-700 hover:border-gray-500 disabled:opacity-50 transition-colors active:scale-95"
          >
            {refreshing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Actualiser Pennylane
          </button>
        )}
      </div>

      {profile && profile.pennylaneCustomerId && (
        <div className="space-y-8">
          <ClientCardBlock card={profile.card} />
          <StatsBlock summary={profile.financials.summary} quotesStats={profile.financials.quotesStats} />
          <VehiclesBlock vehicles={profile.vehicles} />
          {!profile.financials.notSynced && <FinancialsBlock financials={profile.financials} />}
          <TimelineBlock events={profile.timeline} />
        </div>
      )}
    </section>
  );
}

function BlockTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-3">{children}</h3>;
}

function billingAddressLine(card: PennylaneV2ClientCard): string {
  if (!card.billingAddress || !card.billingPostalCode || !card.billingCity) return "Adresse non renseignée";
  return `${card.billingAddress}, ${card.billingPostalCode} ${card.billingCity}, France`;
}

function ClientCardBlock({ card }: { card: PennylaneV2ClientCard }) {
  const rows: { icon: typeof Mail; label: string; value: string }[] = [
    { icon: Mail, label: "Email", value: card.email },
    { icon: Phone, label: "Téléphone", value: card.telephone },
    { icon: MapPin, label: "Adresse de facturation", value: billingAddressLine(card) },
    { icon: Car, label: "Véhicules", value: String(card.vehicleCount) },
    { icon: FileText, label: "Devis", value: String(card.quoteCount) },
    { icon: Receipt, label: "Factures", value: String(card.invoiceCount) },
    { icon: Wallet, label: "CA total (facturé)", value: euro(card.totalBilled) },
    { icon: Calendar, label: "Dernière intervention", value: dateFR(card.lastInterventionDate) },
    { icon: RefreshCw, label: "Dernière synchronisation", value: dateTimeFR(card.lastSyncAt) },
  ];
  return (
    <div>
      <BlockTitle>Fiche client — {card.nom}</BlockTitle>
      <div className="border p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ borderColor: "#1e1e1e", background: "linear-gradient(160deg, #0f0f0f, #0b0d12)" }}>
        {rows.map((r) => (
          <div key={r.label} className="flex items-start gap-2.5">
            <r.icon size={14} className="text-brand-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-gray-600 text-[11px] uppercase tracking-wider">{r.label}</div>
              <div className="text-white text-sm font-medium break-words">{r.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatTile({ label, value, warn, accent }: { label: string; value: string; warn?: boolean; accent?: boolean }) {
  return (
    <div
      className="px-4 py-3 border transition-colors"
      style={{
        background: warn ? "rgba(239,68,68,0.05)" : accent ? "rgba(18,102,234,0.06)" : "#0f0f0f",
        borderColor: warn ? "rgba(239,68,68,0.3)" : accent ? "rgba(18,102,234,0.3)" : "#1e1e1e",
      }}
    >
      <div className={`text-lg font-black ${warn ? "text-red-400" : "text-white"}`} style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
        {value}
      </div>
      <div className="text-gray-500 text-xs uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}

function StatsBlock({ summary, quotesStats }: { summary: PennylaneV2FinancialsSummary; quotesStats: PennylaneV2QuotesStats }) {
  return (
    <div>
      <BlockTitle>Historique commercial</BlockTitle>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatTile label="Devis (total)" value={String(quotesStats.count)} accent />
        <StatTile label="Devis acceptés" value={String(quotesStats.accepted)} />
        <StatTile label="Devis refusés" value={String(quotesStats.denied)} />
        <StatTile label="Devis expirés" value={String(quotesStats.expired)} />
        <StatTile label="Factures (total)" value={String(summary.count)} accent />
        <StatTile label="Factures payées" value={String(summary.paidCount)} />
        <StatTile label="Factures impayées" value={String(summary.unpaidCount)} warn={summary.unpaidCount > 0} />
        <StatTile label="Dernière facture" value={dateFR(summary.lastInvoiceDate)} />
        <StatTile label="Total facturé" value={euro(summary.totalBilled)} />
        <StatTile label="Total payé" value={euro(summary.totalPaid)} />
        <StatTile label="Reste dû" value={euro(summary.totalRemaining)} warn={summary.totalRemaining > 0} />
      </div>
    </div>
  );
}

function VehiclesBlock({ vehicles }: { vehicles: PennylaneV2VehicleEntry[] }) {
  if (vehicles.length === 0) return null;
  return (
    <div>
      <BlockTitle>Véhicules connus ({vehicles.length})</BlockTitle>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {vehicles.map((v, i) => (
          <li key={i} className="px-4 py-3 border flex items-start gap-2.5" style={{ borderColor: "#1e1e1e", background: "#0f0f0f" }}>
            <Car size={15} className="text-brand-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-white text-sm font-medium truncate">{v.marque} {v.modele} <span className="text-gray-600">({v.annee})</span></div>
              <div className="text-gray-500 text-xs truncate">{v.motorisation || "Motorisation non précisée"}</div>
              <div className="text-gray-600 text-xs mt-1">{v.requestCount} demande{v.requestCount > 1 ? "s" : ""} associée{v.requestCount > 1 ? "s" : ""}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FinancialsBlock({ financials }: { financials: PennylaneV2Profile["financials"] }) {
  const { quotes, invoices, stale, error } = financials;

  return (
    <div>
      {error && (
        <p className="text-sm text-yellow-400 px-4 py-2.5 border border-yellow-500/25 bg-yellow-500/5 flex items-start gap-2 mb-4 max-w-xl">
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
          {error} {stale && "— dernières données connues affichées ci-dessous."}
        </p>
      )}

      <BlockTitle>Devis ({quotes.length})</BlockTitle>
      {quotes.length === 0 ? (
        <p className="text-gray-600 text-sm mb-8">Aucun devis Pennylane pour ce client.</p>
      ) : (
        <>
          {/* Desktop/tablette : tableau */}
          <div className="hidden sm:block border overflow-x-auto mb-8" style={{ borderColor: "#1e1e1e" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase tracking-wider" style={{ background: "#0d0d0d" }}>
                  <th className="px-4 py-2.5 font-bold">Numéro</th>
                  <th className="px-4 py-2.5 font-bold">Date</th>
                  <th className="px-4 py-2.5 font-bold">Montant HT</th>
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
                    <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap tabular-nums">{euro(q.amountHT)}</td>
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
          {/* Mobile : cartes */}
          <ul className="sm:hidden space-y-3 mb-8">
            {quotes.map((q) => (
              <li key={q.id} className="p-4 border" style={{ borderColor: "#1e1e1e", background: "#0f0f0f" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-medium">{q.number ?? `#${q.id}`}</span>
                  <span className="text-xs font-bold px-2 py-0.5 uppercase tracking-wider text-gray-400 bg-white/5">
                    {QUOTE_STATUS_LABELS[q.status] ?? q.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-500">
                  <span>Date : <span className="text-gray-300">{dateFR(q.date)}</span></span>
                  <span>Validité : <span className="text-gray-300">{dateFR(q.deadline)}</span></span>
                  <span>HT : <span className="text-gray-300 tabular-nums">{euro(q.amountHT)}</span></span>
                  <span>TTC : <span className="text-gray-300 tabular-nums">{euro(q.amountTTC)}</span></span>
                </div>
                <a href={q.webUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-brand-400 text-xs">
                  Ouvrir <ExternalLink size={12} />
                </a>
              </li>
            ))}
          </ul>
        </>
      )}

      <BlockTitle>Factures ({invoices.length})</BlockTitle>
      {invoices.length === 0 ? (
        <p className="text-gray-600 text-sm">Aucune facture Pennylane pour ce client.</p>
      ) : (
        <>
          <div className="hidden sm:block border overflow-x-auto" style={{ borderColor: "#1e1e1e" }}>
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
          <ul className="sm:hidden space-y-3">
            {invoices.map((inv) => (
              <li key={inv.id} className="p-4 border" style={{ borderColor: "#1e1e1e", background: "#0f0f0f" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-medium">{inv.number ?? `#${inv.id}`}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 uppercase tracking-wider ${INVOICE_STATUS_STYLES[inv.displayStatus] ?? "text-gray-400 bg-white/5"}`}>
                    {INVOICE_STATUS_LABELS[inv.displayStatus] ?? inv.displayStatus}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-500">
                  <span>Date : <span className="text-gray-300">{dateFR(inv.date)}</span></span>
                  <span>Échéance : <span className="text-gray-300">{dateFR(inv.deadline)}</span></span>
                  <span>TTC : <span className="text-gray-300 tabular-nums">{euro(inv.amountTTC)}</span></span>
                  <span>Restant : <span className="text-gray-300 tabular-nums">{euro(inv.amountRemaining)}</span></span>
                </div>
                <a href={inv.webUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-brand-400 text-xs">
                  Ouvrir <ExternalLink size={12} />
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function TimelineBlock({ events }: { events: PennylaneV2TimelineEvent[] }) {
  if (events.length === 0) return null;
  return (
    <div>
      <BlockTitle>Historique PERF&apos;EXHAUST</BlockTitle>
      <ol className="relative border-l ml-1.5" style={{ borderColor: "#1e1e1e" }}>
        {events.map((e, i) => {
          const Icon = TIMELINE_ICONS[e.kind] ?? FileText;
          return (
            <li key={i} className="mb-4 ml-5 last:mb-0">
              <span
                className="absolute -left-[9px] flex items-center justify-center w-4.5 h-4.5 rounded-full"
                style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", width: 18, height: 18 }}
              >
                <Icon size={10} className="text-brand-400" />
              </span>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-white text-sm font-medium">{e.label}</span>
                {e.detail && <span className="text-gray-500 text-xs">{e.detail}</span>}
              </div>
              <div className="text-gray-600 text-xs mt-0.5">
                {dateTimeFR(e.date)}{e.approximate && <span className="text-gray-700"> (date approximative — non fournie par Pennylane)</span>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
