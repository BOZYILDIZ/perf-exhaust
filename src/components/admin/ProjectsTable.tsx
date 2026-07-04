"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, PencilLine, Trash2, Eye, Star, Loader2, Copy } from "lucide-react";

export interface AdminProjectRow {
  id: string;
  slug: string;
  vehicule: string;
  marque: string;
  prestation: string;
  categorie: string | null;
  status: string;
  featured: boolean;
  updatedAt: string;
}

export default function ProjectsTable({ initialRows }: { initialRows: AdminProjectRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return [r.vehicule, r.marque, r.prestation, r.slug, r.categorie ?? ""].some((v) =>
        v.toLowerCase().includes(q)
      );
    });
  }, [rows, query, statusFilter]);

  const duplicate = async (row: AdminProjectRow) => {
    setDuplicating(row.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/projects/${row.id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Duplication impossible");
      setMessage({ type: "ok", text: `Copie créée en brouillon (${data.slug}) — redirection...` });
      router.push(`/admin/realisations/${data.id}/edit`);
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Erreur" });
    } finally {
      setDuplicating(null);
    }
  };

  const remove = async (row: AdminProjectRow) => {
    if (!window.confirm(`Supprimer définitivement « ${row.vehicule} — ${row.prestation} » ?\nCette action est irréversible.`)) return;
    setDeleting(row.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/projects/${row.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Suppression impossible");
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setMessage({ type: "ok", text: `« ${row.vehicule} » supprimée.` });
      router.refresh();
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Erreur" });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      {/* Barre recherche + filtres */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher (véhicule, marque, slug...)"
            aria-label="Rechercher une réalisation"
            className="w-full bg-transparent border border-gray-800 text-white text-sm pl-9 pr-4 py-2.5 focus:outline-none focus:border-brand-500 transition-colors placeholder-gray-700"
          />
        </div>
        <div className="flex gap-2" role="group" aria-label="Filtrer par statut">
          {([["all", "Tous"], ["published", "Publiés"], ["draft", "Brouillons"]] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setStatusFilter(v)}
              aria-pressed={statusFilter === v}
              className={[
                "px-4 py-2.5 text-xs font-bold tracking-wider uppercase border transition-colors",
                statusFilter === v
                  ? "bg-brand-500 text-white border-brand-500"
                  : "bg-transparent text-gray-500 border-gray-800 hover:text-white hover:border-gray-600",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <p
          role="status"
          className={`mb-4 text-sm px-4 py-2.5 border ${
            message.type === "ok"
              ? "text-green-400 border-green-500/25 bg-green-500/5"
              : "text-red-400 border-red-500/25 bg-red-500/5"
          }`}
        >
          {message.text}
        </p>
      )}

      <p className="text-gray-600 text-xs mb-3">{filtered.length} réalisation{filtered.length > 1 ? "s" : ""}</p>

      <div className="border overflow-x-auto" style={{ borderColor: "#1e1e1e" }}>
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-gray-500 text-xs uppercase tracking-wider" style={{ background: "#0d0d0d" }}>
              <th className="px-4 py-3 font-bold">Véhicule</th>
              <th className="px-4 py-3 font-bold">Prestation</th>
              <th className="px-4 py-3 font-bold">Statut</th>
              <th className="px-4 py-3 font-bold">Modifié</th>
              <th className="px-4 py-3 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 ? "#0d0d0d" : "#0f0f0f", borderTop: "1px solid #1a1a1a" }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {r.featured && <Star size={12} className="text-brand-400 fill-brand-400 flex-shrink-0" aria-label="Mise en avant" />}
                    <div>
                      <div className="text-white font-medium">{r.vehicule}</div>
                      <div className="text-gray-600 text-xs">{r.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400">{r.prestation}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 uppercase tracking-wider ${
                      r.status === "published" ? "text-green-400 bg-green-500/10" : "text-yellow-400 bg-yellow-500/10"
                    }`}
                  >
                    {r.status === "published" ? "Publié" : "Brouillon"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{new Date(r.updatedAt).toLocaleDateString("fr-FR")}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <a
                      href={`/realisations/${r.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-500 hover:text-white transition-colors"
                      aria-label={`Voir ${r.vehicule} sur le site`}
                      title="Voir sur le site"
                    >
                      <Eye size={15} />
                    </a>
                    <button
                      onClick={() => duplicate(r)}
                      disabled={duplicating === r.id}
                      className="p-2 text-gray-500 hover:text-brand-400 transition-colors disabled:opacity-50"
                      aria-label={`Dupliquer ${r.vehicule}`}
                      title="Dupliquer (brouillon)"
                    >
                      {duplicating === r.id ? <Loader2 size={15} className="animate-spin" /> : <Copy size={15} />}
                    </button>
                    <Link
                      href={`/admin/realisations/${r.id}/edit`}
                      className="p-2 text-brand-400 hover:text-brand-300 transition-colors"
                      aria-label={`Modifier ${r.vehicule}`}
                      title="Modifier"
                    >
                      <PencilLine size={15} />
                    </Link>
                    <button
                      onClick={() => remove(r)}
                      disabled={deleting === r.id}
                      className="p-2 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                      aria-label={`Supprimer ${r.vehicule}`}
                      title="Supprimer"
                    >
                      {deleting === r.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-600 text-sm">
                  Aucune réalisation ne correspond.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
