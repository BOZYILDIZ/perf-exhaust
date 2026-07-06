import Link from "next/link";
import { Plus } from "lucide-react";
import { isDbConfigured, getDb } from "@/lib/db";
import ServicesTable, { type AdminServiceRow } from "@/components/admin/ServicesTable";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  let rows: AdminServiceRow[] = [];
  if (isDbConfigured()) {
    const db = getDb();
    const services = await db.service.findMany({
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      select: { id: true, title: true, slug: true, shortDescription: true, status: true, sortOrder: true, updatedAt: true },
    });
    rows = services.map((s) => ({ ...s, updatedAt: s.updatedAt.toISOString() }));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>Services</h1>
          <p className="text-gray-500 text-sm mt-1">Prestations affichées sur /services. Tant qu&apos;aucune n&apos;est créée, le contenu historique reste affiché.</p>
        </div>
        <Link
          href="/admin/services/new"
          className="inline-flex items-center gap-2 px-5 py-3 text-xs font-bold tracking-widest uppercase text-white"
          style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
        >
          <Plus size={14} /> Nouveau service
        </Link>
      </div>

      {!isDbConfigured() ? (
        <p className="text-gray-400 text-sm p-5 border border-brand-500/30 bg-brand-500/5 max-w-2xl">
          Base de données non configurée — voir le Dashboard pour la marche à suivre.
        </p>
      ) : (
        <ServicesTable initialRows={rows} />
      )}
    </div>
  );
}
