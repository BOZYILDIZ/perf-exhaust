import type { Metadata } from "next";
import { AlertTriangle, Calendar, Clock, Car, MapPin, Phone } from "lucide-react";
import { lookupAppointmentByCancellationToken } from "@/lib/agenda/customer-cancellation";
import { getSiteSettings } from "@/lib/settings-repo";
import { formatParisDate, formatParisTime } from "@/lib/agenda/timezone";
import CancelAppointmentForm from "@/components/forms/CancelAppointmentForm";

export const metadata: Metadata = {
  title: "Annuler mon rendez-vous — PERF'EXHAUST",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  invalid: "Ce lien d'annulation est invalide ou a expiré.",
  already_cancelled: "Ce rendez-vous a déjà été annulé.",
  already_completed: "Ce rendez-vous est déjà terminé — l'annulation n'est plus possible.",
};

export default async function CancelAppointmentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [result, settings] = await Promise.all([
    lookupAppointmentByCancellationToken(token),
    getSiteSettings(),
  ]);

  const workshopAddress = `${settings.address}, ${settings.postalCode} ${settings.city}`;

  return (
    <div className="pt-32 pb-20 min-h-screen" style={{ background: "#080808" }}>
      <div className="max-w-lg mx-auto px-6">
        <h1 className="text-2xl font-black text-white mb-8" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
          Annuler mon rendez-vous
        </h1>

        {(result.status === "invalid" || result.status === "already_cancelled" || result.status === "already_completed") && (
          <div className="flex items-start gap-3 p-5" style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}>
            <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{MESSAGES[result.status]}</p>
          </div>
        )}

        {(result.status === "valid" || result.status === "too_late") && result.appointment && (
          <div>
            <div className="p-5 mb-6 border" style={{ borderColor: "#1e1e1e", background: "#0f0f0f" }}>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2.5 text-gray-300">
                  <Calendar size={15} className="text-brand-400" /> {formatParisDate(result.appointment.startAt)}
                </div>
                <div className="flex items-center gap-2.5 text-gray-300">
                  <Clock size={15} className="text-brand-400" /> {formatParisTime(result.appointment.startAt)} ({result.appointment.durationMinutes} min)
                </div>
                <div className="flex items-center gap-2.5 text-gray-300">
                  <Car size={15} className="text-brand-400" /> {result.appointment.vehicle}
                </div>
                <div className="flex items-center gap-2.5 text-gray-300">
                  <MapPin size={15} className="text-brand-400" /> {workshopAddress}
                </div>
              </div>
            </div>

            {result.status === "too_late" ? (
              <div>
                <div className="flex items-start gap-3 p-5 mb-6" style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)" }}>
                  <AlertTriangle size={20} className="text-orange-400 flex-shrink-0 mt-0.5" />
                  <p className="text-orange-400 text-sm">
                    L&apos;annulation en ligne n&apos;est plus disponible à moins de 48 heures du rendez-vous. Merci d&apos;appeler
                    directement l&apos;atelier au {settings.phone}.
                  </p>
                </div>
                <a
                  href={`tel:${settings.phone.replace(/\s+/g, "")}`}
                  className="w-full flex items-center justify-center gap-3 py-4 text-sm font-bold tracking-widest uppercase text-white transition-all hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
                >
                  <Phone size={16} /> Appeler l&apos;atelier
                </a>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 text-sm mb-6">
                  Un empêchement ? Vous pouvez annuler ce rendez-vous ci-dessous. Cette action est définitive.
                </p>
                <CancelAppointmentForm token={token} />
                <p className="text-gray-600 text-xs mt-4">
                  Vous pouvez aussi annuler par téléphone à tout moment au {settings.phone}.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
