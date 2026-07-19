import { notFound } from "next/navigation";
import { isDbConfigured, getDb } from "@/lib/db";
import { isPennylaneConfigured, getPennylaneMode } from "@/lib/pennylane/client";
import { getSiteSettings } from "@/lib/settings-repo";
import { buildExtensionQuoteData, safeJsonForScriptTag } from "@/lib/pennylane/extension-data";
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

  // Lu par l'extension Chrome "PERF'EXHAUST — Assistant Pennylane"
  // (chrome-extension/perfexhaust-pennylane-assistant/) — jamais exécuté,
  // jamais envoyé à un serveur tiers. Voir src/lib/pennylane/extension-data.ts.
  const extensionData = buildExtensionQuoteData(q);

  return (
    <div>
      <script
        type="application/json"
        id="perfexhaust-quote-data"
        dangerouslySetInnerHTML={{ __html: safeJsonForScriptTag(extensionData) }}
      />
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
      />
    </div>
  );
}
