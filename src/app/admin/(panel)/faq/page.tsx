import Link from "next/link";
import { Plus } from "lucide-react";
import { isDbConfigured, getDb } from "@/lib/db";
import FAQTable, { type AdminFAQRow } from "@/components/admin/FAQTable";

export const dynamic = "force-dynamic";

export default async function AdminFAQPage() {
  let rows: AdminFAQRow[] = [];
  if (isDbConfigured()) {
    const db = getDb();
    const items = await db.fAQItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      select: { id: true, question: true, category: true, status: true, sortOrder: true, updatedAt: true },
    });
    rows = items.map((i) => ({ ...i, updatedAt: i.updatedAt.toISOString() }));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>FAQ</h1>
          <p className="text-gray-500 text-sm mt-1">Questions affichées sur la page d&apos;accueil, avec schéma FAQPage généré automatiquement.</p>
        </div>
        <Link
          href="/admin/faq/new"
          className="inline-flex items-center gap-2 px-5 py-3 text-xs font-bold tracking-widest uppercase text-white"
          style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
        >
          <Plus size={14} /> Nouvelle question
        </Link>
      </div>

      {!isDbConfigured() ? (
        <p className="text-gray-400 text-sm p-5 border border-brand-500/30 bg-brand-500/5 max-w-2xl">
          Base de données non configurée — voir le Dashboard pour la marche à suivre.
        </p>
      ) : (
        <FAQTable initialRows={rows} />
      )}
    </div>
  );
}
