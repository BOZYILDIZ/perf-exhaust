"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Eye, ExternalLink } from "lucide-react";

export interface QuoteRequestRow {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  marque: string;
  modele: string;
  annee: string;
  typeProjet: string;
  status: string;
  createdAt: string;
  pennylaneSyncStatus: string | null;
  pennylaneQuoteUrl: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  new: "Nouvelle",
  contacted: "Contactée",
  in_progress: "En cours",
  completed: "Terminée",
  archived: "Archivée",
};

const STATUS_STYLES: Record<string, string> = {
  new: "text-brand-400 bg-brand-500/10",
  contacted: "text-blue-300 bg-blue-500/10",
  in_progress: "text-yellow-400 bg-yellow-500/10",
  completed: "text-green-400 bg-green-500/10",
  archived: "text-gray-500 bg-white/5",
};

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

export default function QuoteRequestsTable({ initialRows }: { initialRows: QuoteRequestRow[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialRows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return [r.nom, r.prenom, r.email, r.telephone, r.marque, r.modele].some((v) =>
        v.toLowerCase().includes(q)
      );
    });
  }, [initialRows, query, statusFilter]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher (nom, email, téléphone, véhicule...)"
            aria-label="Rechercher une demande"
            className="w-full bg-transparent border border-gray-800 text-white text-sm pl-9 pr-4 py-2.5 focus:outline-none focus:border-brand-500 transition-colors placeholder-gray-700"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par statut">
          {([["all", "Tous"], ...Object.entries(STATUS_LABELS)] as [string, string][]).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setStatusFilter(v)}
              aria-pressed={statusFilter === v}
              className={[
                "px-3 py-2 text-xs font-bold tracking-wider uppercase border transition-colors",
                statusFilter === v
                  ? "bg-brand-500 text-white border-brand-500"
                  : "bg-transparent text-gray-500 border-gray-800 hover:text-white hover:border-gray-600",
              ].join(" ")}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <p className="text-gray-600 text-xs mb-3">{filtered.length} demande{filtered.length > 1 ? "s" : ""}</p>

      <div className="border overflow-x-auto" style={{ borderColor: "#1e1e1e" }}>
        <table className="w-full text-sm min-w-[820px]">
          <thead>
            <tr className="text-left text-gray-500 text-xs uppercase tracking-wider" style={{ background: "#0d0d0d" }}>
              <th className="px-4 py-3 font-bold">Client</th>
              <th className="px-4 py-3 font-bold">Véhicule</th>
              <th className="px-4 py-3 font-bold">Projet</th>
              <th className="px-4 py-3 font-bold">Statut</th>
              <th className="px-4 py-3 font-bold">Pennylane</th>
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
                    <span className={`text-xs font-bold px-2 py-0.5 uppercase tracking-wider whitespace-nowrap ${PENNYLANE_STYLES[r.pennylaneSyncStatus ?? "not_configured"] ?? "text-gray-500 bg-white/5"}`}>
                      {PENNYLANE_LABELS[r.pennylaneSyncStatus ?? "not_configured"] ?? r.pennylaneSyncStatus}
                    </span>
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
                </td>
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
                <td colSpan={7} className="px-4 py-8 text-center text-gray-600 text-sm">
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
