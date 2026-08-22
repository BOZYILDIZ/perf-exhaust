"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Eye, ExternalLink, SlidersHorizontal, X, Calendar, Car } from "lucide-react";
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_STYLES, QUOTE_QUICK_FILTERS } from "@/lib/quote-pipeline";

export interface QuoteRequestRow {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  marque: string;
  modele: string;
  annee: string;
  motorisation: string | null;
  licensePlate: string | null;
  typeProjet: string;
  status: string;
  createdAt: string;
  pennylaneSyncStatus: string | null;
  pennylaneQuoteUrl: string | null;
  pennylaneManualStatus: string | null;
  pennylaneQuoteNumber: string | null;
  pennylaneCustomerId: string | null;
  quoteNumbers: string[];
  invoiceNumbers: string[];
  nextAppointment: { startAt: string; status: string } | null;
}

const STATUS_LABELS: Record<string, string> = QUOTE_STATUS_LABELS;
const STATUS_STYLES: Record<string, string> = QUOTE_STATUS_STYLES;

const PENNYLANE_LABELS: Record<string, string> = {
  not_configured: "Non configuré",
  pending: "En attente",
  draft_created: "Brouillon créé",
  failed: "Erreur",
};

const PENNYLANE_STYLES: Record<string, string> = {
  not_configured: "text-gray-500 bg-white/5",
  pending: "text-yellow-400 bg-yellow-500/10",
  draft_created: "text-green-400 bg-green-500/10",
  failed: "text-red-400 bg-red-500/10",
};

const MANUAL_STATUS_LABELS: Record<string, string> = {
  a_creer: "À créer",
  devis_cree: "Devis créé",
  devis_envoye: "Devis envoyé",
  devis_accepte: "Devis accepté",
  devis_refuse: "Devis refusé",
  facture_creee: "Facture créée",
  paye: "Payé",
};

const MANUAL_STATUS_STYLES: Record<string, string> = {
  a_creer: "text-gray-400 bg-white/5",
  devis_cree: "text-brand-400 bg-brand-500/10",
  devis_envoye: "text-yellow-400 bg-yellow-500/10",
  devis_accepte: "text-green-400 bg-green-500/10",
  devis_refuse: "text-red-400 bg-red-500/10",
  facture_creee: "text-purple-300 bg-purple-500/10",
  paye: "text-green-400 bg-green-500/10",
};

function pennylaneLabelAndStyle(r: QuoteRequestRow, pennylaneMode: "api" | "manual") {
  if (pennylaneMode === "manual") {
    return {
      label: MANUAL_STATUS_LABELS[r.pennylaneManualStatus ?? "a_creer"] ?? r.pennylaneManualStatus ?? "—",
      style: MANUAL_STATUS_STYLES[r.pennylaneManualStatus ?? "a_creer"] ?? "text-gray-500 bg-white/5",
    };
  }
  return {
    label: PENNYLANE_LABELS[r.pennylaneSyncStatus ?? "not_configured"] ?? r.pennylaneSyncStatus ?? "—",
    style: PENNYLANE_STYLES[r.pennylaneSyncStatus ?? "not_configured"] ?? "text-gray-500 bg-white/5",
  };
}

function frNextAppointment(r: QuoteRequestRow): string | null {
  if (!r.nextAppointment) return null;
  return new Date(r.nextAppointment.startAt).toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function QuoteRequestsTable({ initialRows, pennylaneMode }: { initialRows: QuoteRequestRow[]; pennylaneMode: "api" | "manual" }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | string>("all");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const activeFilter = QUOTE_QUICK_FILTERS.find((f) => f.key === statusFilter);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialRows.filter((r) => {
      if (activeFilter && !(activeFilter.statuses as readonly string[]).includes(r.status)) return false;
      if (!q) return true;
      const textFields = [
        r.nom, r.prenom, r.email, r.telephone,
        r.marque, r.modele, r.annee, r.motorisation ?? "", r.licensePlate ?? "",
        r.pennylaneCustomerId ?? "",
        ...r.quoteNumbers, ...r.invoiceNumbers,
      ];
      return textFields.some((v) => v.toLowerCase().includes(q));
    });
  }, [initialRows, query, activeFilter]);

  const statusButtons = (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par statut">
      {([["all", "Tous"], ...QUOTE_QUICK_FILTERS.map((f) => [f.key, f.label] as [string, string])]).map(([v, l]) => (
        <button
          key={v}
          onClick={() => { setStatusFilter(v); setFilterSheetOpen(false); }}
          aria-pressed={statusFilter === v}
          className={[
            "px-3 py-2.5 min-h-[44px] text-xs font-bold tracking-wider uppercase border transition-colors",
            statusFilter === v
              ? "bg-brand-500 text-white border-brand-500"
              : "bg-transparent text-gray-500 border-gray-800 hover:text-white hover:border-gray-600",
          ].join(" ")}
        >
          {l}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      {/* Recherche : toujours visible. Filtres de statut : inline sur desktop, sheet compact sur mobile. */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher (nom, email, téléphone, véhicule, immatriculation, n° devis/facture, ID Pennylane...)"
            aria-label="Rechercher une demande"
            className="w-full bg-transparent border border-gray-800 text-white text-sm pl-9 pr-4 py-2.5 min-h-[44px] focus:outline-none focus:border-brand-500 transition-colors placeholder-gray-700"
          />
        </div>
        <button
          type="button"
          onClick={() => setFilterSheetOpen(true)}
          className="md:hidden inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-wider text-gray-300 border border-gray-700"
        >
          <SlidersHorizontal size={14} /> Filtres{statusFilter !== "all" ? ` (1)` : ""}
        </button>
        <div className="hidden md:block">{statusButtons}</div>
      </div>

      {filterSheetOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col justify-end">
          <button type="button" aria-label="Fermer" onClick={() => setFilterSheetOpen(false)} className="absolute inset-0 bg-black/70" />
          <div className="relative border-t rounded-t-2xl p-5" style={{ background: "#0d0d0d", borderColor: "#1e1e1e", paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-bold text-xs uppercase tracking-widest">Filtrer par statut</span>
              <button type="button" onClick={() => setFilterSheetOpen(false)} aria-label="Fermer" className="text-gray-500 hover:text-white p-2 -m-2"><X size={18} /></button>
            </div>
            {statusButtons}
          </div>
        </div>
      )}

      <p className="text-gray-600 text-xs mb-3">{filtered.length} demande{filtered.length > 1 ? "s" : ""}</p>

      {/* Cards mobile/tablette (<1024px) — le tableau devient illisible en dessous de cette largeur */}
      <div className="lg:hidden space-y-3">
        {filtered.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-8">Aucune demande ne correspond.</p>
        ) : (
          filtered.map((r) => {
            const pl = pennylaneLabelAndStyle(r, pennylaneMode);
            const nextAppt = frNextAppointment(r);
            return (
              <Link
                key={r.id}
                href={`/admin/devis/${r.id}`}
                className="block p-4 border active:scale-[0.99] transition-transform"
                style={{ borderColor: "#1e1e1e", background: "#0f0f0f" }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm truncate">{r.prenom} {r.nom}</p>
                    <p className="text-gray-600 text-xs truncate">{r.email}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 uppercase tracking-wider flex-shrink-0 ${STATUS_STYLES[r.status] ?? "text-gray-400 bg-white/5"}`}>
                    {STATUS_LABELS[r.status] ?? r.status}
                  </span>
                </div>
                <p className="text-gray-400 text-xs flex items-center gap-1.5 mb-2"><Car size={12} className="flex-shrink-0" /> {r.marque} {r.modele} ({r.annee})</p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`font-bold px-2 py-0.5 uppercase tracking-wider ${pl.style}`}>{pl.label}</span>
                  {nextAppt && (
                    <span className="text-brand-400 flex items-center gap-1"><Calendar size={11} /> {nextAppt}</span>
                  )}
                  <span className="text-gray-600 ml-auto">{new Date(r.createdAt).toLocaleDateString("fr-FR")}</span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Tableau desktop (>=1024px) */}
      <div className="hidden lg:block border overflow-x-auto" style={{ borderColor: "#1e1e1e" }}>
        <table className="w-full text-sm min-w-[820px]">
          <thead>
            <tr className="text-left text-gray-500 text-xs uppercase tracking-wider" style={{ background: "#0d0d0d" }}>
              <th className="px-4 py-3 font-bold">Client</th>
              <th className="px-4 py-3 font-bold">Véhicule</th>
              <th className="px-4 py-3 font-bold">Projet</th>
              <th className="px-4 py-3 font-bold">Statut</th>
              <th className="px-4 py-3 font-bold">Pennylane</th>
              <th className="px-4 py-3 font-bold">Prochain RDV</th>
              <th className="px-4 py-3 font-bold">Reçue</th>
              <th className="px-4 py-3 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 ? "#0d0d0d" : "#0f0f0f", borderTop: "1px solid #1a1a1a" }}>
                <td className="px-4 py-3">
                  <div className="text-white font-medium">{r.prenom} {r.nom}</div>
                  <div className="text-gray-600 text-xs">{r.email}</div>
                </td>
                <td className="px-4 py-3 text-gray-400">{r.marque} {r.modele} <span className="text-gray-600">({r.annee})</span></td>
                <td className="px-4 py-3 text-gray-400">{r.typeProjet}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-2 py-0.5 uppercase tracking-wider ${STATUS_STYLES[r.status] ?? "text-gray-400 bg-white/5"}`}>
                    {STATUS_LABELS[r.status] ?? r.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {pennylaneMode === "manual" ? (
                      <span className={`text-xs font-bold px-2 py-0.5 uppercase tracking-wider whitespace-nowrap ${MANUAL_STATUS_STYLES[r.pennylaneManualStatus ?? "a_creer"] ?? "text-gray-500 bg-white/5"}`}>
                        {MANUAL_STATUS_LABELS[r.pennylaneManualStatus ?? "a_creer"] ?? r.pennylaneManualStatus}
                      </span>
                    ) : (
                      <span className={`text-xs font-bold px-2 py-0.5 uppercase tracking-wider whitespace-nowrap ${PENNYLANE_STYLES[r.pennylaneSyncStatus ?? "not_configured"] ?? "text-gray-500 bg-white/5"}`}>
                        {PENNYLANE_LABELS[r.pennylaneSyncStatus ?? "not_configured"] ?? r.pennylaneSyncStatus}
                      </span>
                    )}
                    {r.pennylaneQuoteUrl && (
                      <a
                        href={r.pennylaneQuoteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-400 hover:text-brand-300"
                        aria-label="Ouvrir dans Pennylane"
                        title="Ouvrir dans Pennylane"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                  {r.pennylaneQuoteNumber && (
                    <div className="text-gray-600 text-xs mt-0.5">{r.pennylaneQuoteNumber}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{frNextAppointment(r) ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString("fr-FR")}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/devis/${r.id}`}
                      className="p-2 text-brand-400 hover:text-brand-300 transition-colors"
                      aria-label={`Voir la demande de ${r.prenom} ${r.nom}`}
                      title="Voir le détail"
                    >
                      <Eye size={15} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-600 text-sm">
                  Aucune demande ne correspond.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
