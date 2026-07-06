import { isDbConfigured, getDb } from "@/lib/db";
import QuoteRequestsTable, { type QuoteRequestRow } from "@/components/admin/QuoteRequestsTable";

export const dynamic = "force-dynamic";

function StatChip({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className="px-4 py-3 border flex-1 min-w-[130px]"
      style={{
        background: accent ? "rgba(18,102,234,0.06)" : "#0f0f0f",
        borderColor: accent ? "rgba(18,102,234,0.3)" : "#1e1e1e",
      }}
    >
      <div className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>{value}</div>
      <div className="text-gray-500 text-xs uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}

export default async function AdminQuoteRequestsPage() {
  let rows: QuoteRequestRow[] = [];
  let counts = { new: 0, inProgress: 0, completed: 0, archived: 0 };

  if (isDbConfigured()) {
    const db = getDb();
    const [items, newCount, contactedCount, inProgressCount, completedCount, archivedCount] = await Promise.all([
      db.quoteRequest.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true, nom: true, prenom: true, email: true, telephone: true,
          marque: true, modele: true, annee: true, typeProjet: true,
          status: true, createdAt: true,
        },
      }),
      db.quoteRequest.count({ where: { status: "new" } }),
      db.quoteRequest.count({ where: { status: "contacted" } }),
      db.quoteRequest.count({ where: { status: "in_progress" } }),
      db.quoteRequest.count({ where: { status: "completed" } }),
      db.quoteRequest.count({ where: { status: "archived" } }),
    ]);
    rows = items.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
    counts = { new: newCount, inProgress: contactedCount + inProgressCount, completed: completedCount, archived: archivedCount };
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
        Demandes de devis
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Toutes les demandes reçues via le formulaire /rendez-vous — l&apos;email atelier continue d&apos;être envoyé en parallèle.
      </p>

      {!isDbConfigured() ? (
        <p className="text-gray-400 text-sm p-5 border border-brand-500/30 bg-brand-500/5 max-w-2xl">
          Base de données non configurée — voir le Dashboard pour la marche à suivre. Les demandes continuent
          d&apos;arriver par email en attendant.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 mb-8">
            <StatChip label="Nouvelles" value={counts.new} accent />
            <StatChip label="En cours" value={counts.inProgress} />
            <StatChip label="Terminées" value={counts.completed} />
            <StatChip label="Archivées" value={counts.archived} />
          </div>
          <QuoteRequestsTable initialRows={rows} />
        </>
      )}
    </div>
  );
}
