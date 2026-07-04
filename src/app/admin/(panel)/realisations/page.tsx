import Link from "next/link";
import { Plus } from "lucide-react";
import { isDbConfigured, getDb } from "@/lib/db";
import ProjectsTable, { type AdminProjectRow } from "@/components/admin/ProjectsTable";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  let rows: AdminProjectRow[] = [];
  if (isDbConfigured()) {
    const db = getDb();
    const projects = await db.project.findMany({
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true, slug: true, vehicule: true, marque: true, prestation: true,
        categorie: true, status: true, featured: true, updatedAt: true,
      },
    });
    rows = projects.map((p) => ({ ...p, updatedAt: p.updatedAt.toISOString() }));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
          Réalisations
        </h1>
        <Link
          href="/admin/realisations/new"
          className="inline-flex items-center gap-2 px-5 py-3 text-xs font-bold tracking-widest uppercase text-white"
          style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
        >
          <Plus size={14} /> Nouvelle réalisation
        </Link>
      </div>

      {!isDbConfigured() ? (
        <p className="text-gray-400 text-sm p-5 border border-brand-500/30 bg-brand-500/5 max-w-2xl">
          Base de données non configurée — voir le Dashboard pour la marche à suivre.
        </p>
      ) : (
        <ProjectsTable initialRows={rows} />
      )}
    </div>
  );
}
