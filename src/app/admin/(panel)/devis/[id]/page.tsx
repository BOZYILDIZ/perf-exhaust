import { notFound } from "next/navigation";
import { isDbConfigured, getDb } from "@/lib/db";
import { isPennylaneConfigured, getPennylaneMode } from "@/lib/pennylane/client";
import { getSiteSettings } from "@/lib/settings-repo";
import QuoteRequestDetail from "@/components/admin/QuoteRequestDetail";
import { isPennylaneV2Configured } from "@/lib/pennylane-v2/config";
import { getCustomerFinancials } from "@/lib/pennylane-v2/financials";
import { customerDisplayName } from "@/lib/pennylane-v2/types";
import { getCustomer } from "@/lib/pennylane-v2/customers";

export const dynamic = "force-dynamic";

export default async function AdminQuoteRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured()) notFound();
  const { id } = await params;
  const [q, settings] = await Promise.all([
    getDb().quoteRequest.findUnique({ where: { id } }),
    getSiteSettings(),
  ]);
  if (!q) notFound();

  // Nouvelle intégration Pennylane API v2 — chargée uniquement à l'ouverture
  // de la fiche (jamais à chaque interaction), voir src/lib/pennylane-v2/.
  const pennylaneV2Configured = isPennylaneV2Configured();
  const [financials, pennylaneCustomerName] = await Promise.all([
    pennylaneV2Configured ? getCustomerFinancials(id) : Promise.resolve(null),
    pennylaneV2Configured && q.pennylaneCustomerId
      ? getCustomer(Number(q.pennylaneCustomerId)).then(customerDisplayName).catch(() => null)
      : Promise.resolve(null),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-8" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
        Demande — {q.prenom} {q.nom}
      </h1>
      <QuoteRequestDetail
        request={{
          id: q.id,
          nom: q.nom,
          prenom: q.prenom,
          email: q.email,
          telephone: q.telephone,
          marque: q.marque,
          modele: q.modele,
          annee: q.annee,
          motorisation: q.motorisation,
          rearDiffuser: q.rearDiffuser,
          typeProjet: q.typeProjet,
          sonorite: q.sonorite,
          message: q.message,
          status: q.status,
          notes: q.notes,
          createdAt: q.createdAt.toISOString(),
          pennylaneCustomerId: q.pennylaneCustomerId,
          pennylaneQuoteId: q.pennylaneQuoteId,
          pennylaneQuoteNumber: q.pennylaneQuoteNumber,
          pennylaneQuoteUrl: q.pennylaneQuoteUrl,
          pennylaneSyncStatus: q.pennylaneSyncStatus,
          pennylaneSyncError: q.pennylaneSyncError,
          pennylaneSyncedAt: q.pennylaneSyncedAt ? q.pennylaneSyncedAt.toISOString() : null,
          pennylaneManualStatus: q.pennylaneManualStatus,
        }}
        pennylaneConfigured={isPennylaneConfigured()}
        pennylaneMode={getPennylaneMode()}
        pennylaneManualUrl={settings.pennylaneManualUrl}
        pennylaneV2={{
          configured: pennylaneV2Configured,
          syncStatus: q.pennylaneCustomerSyncStatus,
          syncError: q.pennylaneCustomerSyncError,
          customerId: q.pennylaneCustomerId,
          customerType: q.pennylaneCustomerType,
          customerName: pennylaneCustomerName,
          syncedAt: q.pennylaneCustomerSyncedAt ? q.pennylaneCustomerSyncedAt.toISOString() : null,
          lastSyncAt: q.pennylaneCustomerLastSyncAt ? q.pennylaneCustomerLastSyncAt.toISOString() : null,
          ambiguousCandidates: (q.pennylaneAmbiguousCandidates as unknown as { id: number; name: string; email: string | null; phone: string | null }[] | null) ?? null,
          financials: financials
            ? {
                notSynced: financials.notSynced,
                quotes: financials.quotes,
                invoices: financials.invoices,
                summary: financials.summary,
                fetchedAt: financials.fetchedAt ? financials.fetchedAt.toISOString() : null,
                stale: financials.stale,
                error: financials.error,
              }
            : { notSynced: true, quotes: [], invoices: [], summary: { count: 0, totalBilled: 0, totalPaid: 0, totalRemaining: 0, lastInvoiceDate: null, hasUnpaid: false }, fetchedAt: null, stale: false, error: null },
        }}
      />
    </div>
  );
}
