import { notFound } from "next/navigation";
import { isDbConfigured, getDb } from "@/lib/db";
import { isPennylaneConfigured, getPennylaneMode } from "@/lib/pennylane/client";
import { getSiteSettings } from "@/lib/settings-repo";
import QuoteRequestDetail from "@/components/admin/QuoteRequestDetail";

export const dynamic = "force-dynamic";

export default async function AdminQuoteRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured()) notFound();
  const { id } = await params;
  const [q, settings] = await Promise.all([
    getDb().quoteRequest.findUnique({ where: { id } }),
    getSiteSettings(),
  ]);
  if (!q) notFound();

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
      />
    </div>
  );
}
