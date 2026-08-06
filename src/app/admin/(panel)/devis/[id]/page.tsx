import { notFound } from "next/navigation";
import { isDbConfigured, getDb } from "@/lib/db";
import { isPennylaneConfigured, getPennylaneMode } from "@/lib/pennylane/client";
import { getSiteSettings } from "@/lib/settings-repo";
import QuoteRequestDetail from "@/components/admin/QuoteRequestDetail";
import { getClientProfile } from "@/lib/pennylane-v2/client-profile";
import { getAgendaSettings } from "@/lib/agenda/settings";

export const dynamic = "force-dynamic";

export default async function AdminQuoteRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured()) notFound();
  const { id } = await params;
  const [q, settings, clientProfile, agendaSettings] = await Promise.all([
    getDb().quoteRequest.findUnique({ where: { id }, include: { appointment: true } }),
    getSiteSettings(),
    // Agrège client Pennylane + demandes locales soeurs (véhicules, historique,
    // statistiques) — un seul appel Pennylane pour le nom/date de création du
    // client, le reste réutilise le cache devis/factures existant (voir
    // src/lib/pennylane-v2/client-profile.ts).
    getClientProfile(id),
    getAgendaSettings(),
  ]);
  if (!q) notFound();

  const durationOptions = [
    { label: "30 min", minutes: 30 },
    { label: "1 heure", minutes: 60 },
    { label: "2 heures", minutes: 120 },
    { label: "3 heures", minutes: 180 },
    { label: "Demi-journée", minutes: agendaSettings.halfDayDurationMinutes },
    { label: "Journée", minutes: agendaSettings.fullDayDurationMinutes },
  ];

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
          configured: clientProfile?.configured ?? false,
          syncStatus: q.pennylaneCustomerSyncStatus,
          syncError: q.pennylaneCustomerSyncError,
          customerType: q.pennylaneCustomerType,
          ambiguousCandidates: (q.pennylaneAmbiguousCandidates as unknown as { id: number; name: string; email: string | null; phone: string | null; type: "individual" | "company" }[] | null) ?? null,
          profile: clientProfile
            ? {
                pennylaneCustomerId: clientProfile.pennylaneCustomerId,
                pennylaneCustomerName: clientProfile.pennylaneCustomerName,
                pennylaneCreatedAt: clientProfile.pennylaneCreatedAt,
                customerFetchError: clientProfile.customerFetchError,
                requestCount: clientProfile.requestCount,
                vehicles: clientProfile.vehicles,
                badge: clientProfile.badge,
                timeline: clientProfile.timeline,
                card: clientProfile.card,
                financials: {
                  notSynced: clientProfile.financials.notSynced,
                  quotes: clientProfile.financials.quotes,
                  invoices: clientProfile.financials.invoices,
                  summary: clientProfile.financials.summary,
                  quotesStats: clientProfile.financials.quotesStats,
                  fetchedAt: clientProfile.financials.fetchedAt ? clientProfile.financials.fetchedAt.toISOString() : null,
                  stale: clientProfile.financials.stale,
                  error: clientProfile.financials.error,
                },
              }
            : null,
        }}
        appointment={
          q.appointment
            ? {
                id: q.appointment.id,
                startAt: q.appointment.startAt.toISOString(),
                endAt: q.appointment.endAt.toISOString(),
                durationMinutes: q.appointment.durationMinutes,
                status: q.appointment.status,
                notes: q.appointment.notes,
                cancelledBy: q.appointment.cancelledBy,
              }
            : null
        }
        durationOptions={durationOptions}
        defaultDurationMinutes={agendaSettings.defaultDurationMinutes}
      />
    </div>
  );
}
