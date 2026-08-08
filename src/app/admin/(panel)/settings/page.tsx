import { isDbConfigured } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings-repo";
import { getAgendaSettings, listWorkshopClosures } from "@/lib/agenda/settings";
import SettingsForm from "@/components/admin/SettingsForm";
import AgendaSettingsForm from "@/components/admin/AgendaSettingsForm";
import PushNotificationSettings from "@/components/admin/PushNotificationSettings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [settings, agendaSettings, closures] = await Promise.all([
    getSiteSettings(),
    getAgendaSettings(),
    listWorkshopClosures(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
        Paramètres du site
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        Coordonnées, réseaux sociaux et informations légales — utilisées sur tout le site public
        (en-tête, pied de page, contact, mentions légales, données structurées SEO) sans toucher au code.
      </p>

      {!isDbConfigured() ? (
        <p className="text-gray-400 text-sm p-5 border border-brand-500/30 bg-brand-500/5 max-w-2xl">
          Base de données non configurée — voir le Dashboard pour la marche à suivre. Le site public
          utilise en attendant les valeurs par défaut codées en dur.
        </p>
      ) : (
        <>
          <SettingsForm initial={settings} />

          <h2 className="text-2xl font-black text-white mt-16 mb-2" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
            Agenda atelier
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            Horaires d&apos;ouverture, pause déjeuner, durées de rendez-vous et fermetures exceptionnelles —
            utilisés par le moteur de disponibilités de l&apos;agenda (<code className="text-brand-400">/admin/agenda</code>).
          </p>
          <AgendaSettingsForm initial={agendaSettings} initialClosures={closures} />

          <h2 className="text-2xl font-black text-white mt-16 mb-2" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
            Notifications
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            Recevez une notification sur cet appareil à chaque nouvelle demande de devis — propre à
            chaque appareil (téléphone, tablette, ordinateur), jamais partagée entre eux.
          </p>
          <PushNotificationSettings />
        </>
      )}
    </div>
  );
}
