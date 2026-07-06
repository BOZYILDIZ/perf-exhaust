import { isDbConfigured } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings-repo";
import SettingsForm from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

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
        <SettingsForm initial={settings} />
      )}
    </div>
  );
}
