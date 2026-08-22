import { isDbConfigured, getDb } from "@/lib/db";
import { getPennylaneMode } from "@/lib/pennylane/client";
import QuoteRequestsTable, { type QuoteRequestRow } from "@/components/admin/QuoteRequestsTable";
import { QUOTE_QUICK_FILTERS } from "@/lib/quote-pipeline";

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
  let quickFilterCounts: { key: string; label: string; count: number }[] = [];

  if (isDbConfigured()) {
    const db = getDb();
    const [items, ...counts] = await Promise.all([
      db.quoteRequest.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true, nom: true, prenom: true, email: true, telephone: true,
          marque: true, modele: true, annee: true, motorisation: true, licensePlate: true, typeProjet: true,
          status: true, createdAt: true,
          pennylaneSyncStatus: true, pennylaneQuoteUrl: true,
          pennylaneManualStatus: true, pennylaneQuoteNumber: true,
          pennylaneCustomerId: true, pennylaneQuotesCache: true, pennylaneInvoicesCache: true,
          appointment: { select: { startAt: true, status: true } },
        },
      }),
      ...QUOTE_QUICK_FILTERS.map((f) => db.quoteRequest.count({ where: { status: { in: f.statuses } } })),
    ]);
    const now = new Date();
    rows = items.map((r) => {
      const { pennylaneQuotesCache, pennylaneInvoicesCache, appointment, ...rest } = r;
      const quotes = (pennylaneQuotesCache as unknown as { number: string | null }[] | null) ?? [];
      const invoices = (pennylaneInvoicesCache as unknown as { number: string | null }[] | null) ?? [];
      const nextAppointment = appointment && (appointment.status === "PENDING" || appointment.status === "CONFIRMED") && appointment.startAt >= now
        ? { startAt: appointment.startAt.toISOString(), status: appointment.status }
        : null;
      return {
        ...rest,
        createdAt: r.createdAt.toISOString(),
        // Numéros extraits du cache local (jamais un nouvel appel Pennylane pour la recherche) — voir QuoteRequestsTable.
        quoteNumbers: quotes.map((q) => q.number).filter((n): n is string => Boolean(n)),
        invoiceNumbers: invoices.map((i) => i.number).filter((n): n is string => Boolean(n)),
        nextAppointment,
      };
    });
    quickFilterCounts = QUOTE_QUICK_FILTERS.map((f, i) => ({ key: f.key, label: f.label, count: counts[i] }));
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
            {quickFilterCounts.map((f) => (
              <StatChip key={f.key} label={f.label} value={f.count} accent={f.key === "nouvelles"} />
            ))}
          </div>
          <QuoteRequestsTable initialRows={rows} pennylaneMode={getPennylaneMode()} />
        </>
      )}
    </div>
  );
}
