import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getDb, isDbConfigured } from "@/lib/db";
import { getClientProfile } from "@/lib/pennylane-v2/client-profile";
import { getSiteSettings } from "@/lib/settings-repo";
import type { VehiclePhoto } from "@/lib/vehicle-photo-slots";
import { resolveAppointmentLicensePlate } from "@/lib/agenda/workshop-status";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Fiche complète d'un rendez-vous — agrège tout ce qu'il faut pour ne pas
 * avoir à retourner sur /admin/devis/[id] : réutilise getClientProfile()
 * (déjà construit pour le CRM Pennylane, aucune logique dupliquée ni aucun
 * appel Pennylane supplémentaire au-delà de ce qu'il fait déjà).
 */
export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    if (!isDbConfigured()) return NextResponse.json({ error: "Base de données non configurée (DATABASE_URL)." }, { status: 503 });

    const { id } = await ctx.params;
    const db = getDb();
    const appointment = await db.appointment.findUnique({
      where: { id },
      include: { quoteRequest: { select: { photos: true, motorisation: true, rearDiffuser: true, licensePlate: true, status: true } } },
    });
    if (!appointment) return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });

    // Un rendez-vous manuel (Phase 4, sans demande de devis) n'a pas de
    // quoteRequest — motorisation/diffuseur/adresse viennent alors des
    // champs snapshot propres à Appointment, jamais de la demande (il n'y
    // en a pas) ; aucun profil Pennylane à agréger dans ce cas non plus.
    const [profile, settings] = await Promise.all([
      appointment.quoteRequestId ? getClientProfile(appointment.quoteRequestId) : Promise.resolve(null),
      getSiteSettings(),
    ]);

    return NextResponse.json({
      appointment: {
        id: appointment.id,
        quoteRequestId: appointment.quoteRequestId,
        customerName: appointment.customerName,
        customerEmail: appointment.customerEmail,
        customerPhone: appointment.customerPhone,
        customerAddress: appointment.quoteRequestId ? null : appointment.customerAddress,
        vehicle: appointment.vehicle,
        startAt: appointment.startAt.toISOString(),
        endAt: appointment.endAt.toISOString(),
        durationMinutes: appointment.durationMinutes,
        status: appointment.status,
        notes: appointment.notes,
        cancelledBy: appointment.cancelledBy,
        cancellationReason: appointment.cancellationReason,
        motorisation: appointment.quoteRequest?.motorisation ?? appointment.motorisation,
        rearDiffuser: appointment.quoteRequest?.rearDiffuser ?? appointment.rearDiffuser,
        licensePlate: resolveAppointmentLicensePlate(appointment.quoteRequest?.licensePlate, appointment.licensePlate),
        vehicleNotes: appointment.quoteRequestId ? null : appointment.vehicleNotes,
        photos: Array.isArray(appointment.quoteRequest?.photos) ? (appointment.quoteRequest.photos as unknown as VehiclePhoto[]) : [],
        workshopStatus: appointment.workshopStatus,
        quoteStatus: appointment.quoteRequest?.status ?? null,
        vehicleReadyNotifiedAt: appointment.vehicleReadyNotifiedAt ? appointment.vehicleReadyNotifiedAt.toISOString() : null,
        vehicleReadyNotificationLastError: appointment.vehicleReadyNotificationLastError,
        vehicleReadyNotificationLastAttemptAt: appointment.vehicleReadyNotificationLastAttemptAt
          ? appointment.vehicleReadyNotificationLastAttemptAt.toISOString()
          : null,
      },
      profile: profile
        ? {
            pennylaneCustomerId: profile.pennylaneCustomerId,
            pennylaneCustomerName: profile.pennylaneCustomerName,
            billingAddress: profile.card.billingAddress,
            billingPostalCode: profile.card.billingPostalCode,
            billingCity: profile.card.billingCity,
            vehicles: profile.vehicles,
            badge: profile.badge,
            appointmentHistory: profile.appointmentHistory,
            financials: {
              notSynced: profile.financials.notSynced,
              quotes: profile.financials.quotes,
              invoices: profile.financials.invoices,
              summary: profile.financials.summary,
            },
          }
        : null,
      pennylaneHomeUrl: settings.pennylaneManualUrl,
    });
  } catch (error) {
    console.error("[API/admin/appointments/[id]/detail]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
