"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, PencilLine, Trash2, Eye, Loader2 } from "lucide-react";

export interface AdminServiceRow {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  status: string;
  sortOrder: number;
  updatedAt: string;
}

export default function ServicesTable({ initialRows }: { initialRows: AdminServiceRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => [r.title, r.slug].some((v) => v.toLowerCase().includes(q)));
  }, [rows, query]);

  const remove = async (row: AdminServiceRow) => {
    if (!window.confirm(`Supprimer définitivement « ${row.title} » ?\nCette action est irréversible.`)) return;
    setDeleting(row.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/services/${row.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Suppression impossible");
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setMessage({ type: "ok", text: `« ${row.title} » supprimé.` });
      router.refresh();
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Erreur" });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="relative max-w-sm mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un service..."
          aria-label="Rechercher un service"
          className="w-full bg-transparent border border-gray-800 text-white text-sm pl-9 pr-4 py-2.5 focus:outline-none focus:border-brand-500 transition-colors placeholder-gray-700"
        />
      </div>

      {message && (
        <p
          role="status"
          className={`mb-4 text-sm px-4 py-2.5 border ${
            message.type === "ok" ? "text-green-400 border-green-500/25 bg-green-500/5" : "text-red-400 border-red-500/25 bg-red-500/5"
          }`}
        >
          {message.text}
        </p>
      )}

      <p className="text-gray-600 text-xs mb-3">{filtered.length} service{filtered.length > 1 ? "s" : ""}</p>

      <div className="border overflow-x-auto" style={{ borderColor: "#1e1e1e" }}>
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-left text-gray-500 text-xs uppercase tracking-wider" style={{ background: "#0d0d0d" }}>
              <th className="px-4 py-3 font-bold">Titre</th>
              <th className="px-4 py-3 font-bold">Ordre</th>
              <th className="px-4 py-3 font-bold">Statut</th>
              <th className="px-4 py-3 font-bold">Modifié</th>
              <th className="px-4 py-3 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 ? "#0d0d0d" : "#0f0f0f", borderTop: "1px solid #1a1a1a" }}>
                <td className="px-4 py-3">
                  <div className="text-white font-medium">{r.title}</div>
                  <div className="text-gray-600 text-xs">{r.slug}</div>
                </td>
                <td className="px-4 py-3 text-gray-400">{r.sortOrder}</td>
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
                      href="/services"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-500 hover:text-white transition-colors"
                      aria-label={`Voir ${r.title} sur le site`}
                      title="Voir sur le site"
                    >
                      <Eye size={15} />
                    </a>
                    <Link
                      href={`/admin/services/${r.id}/edit`}
                      className="p-2 text-brand-400 hover:text-brand-300 transition-colors"
                      aria-label={`Modifier ${r.title}`}
                      title="Modifier"
                    >
                      <PencilLine size={15} />
                    </Link>
                    <button
                      onClick={() => remove(r)}
                      disabled={deleting === r.id}
                      className="p-2 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                      aria-label={`Supprimer ${r.title}`}
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
                  Aucun service ne correspond.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
