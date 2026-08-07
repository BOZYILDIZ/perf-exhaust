"use client";

import { WifiOff } from "lucide-react";

/**
 * Page affichée par le service worker (voir public/admin/sw.js) quand une
 * navigation échoue hors ligne — précachée une fois en ligne, jamais
 * générée dynamiquement offline. Volontairement statique, sans
 * authentification ni appel base de données : ne doit jamais dépendre d'une
 * ressource indisponible hors connexion, et ne montre jamais de donnée
 * atelier (client/devis/RDV) comme si elle était à jour.
 */
export default function OfflineScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#0a0a0a" }}>
      <div className="max-w-sm text-center">
        <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <WifiOff size={28} className="text-red-400" />
        </div>
        <h1 className="text-white font-black text-xl mb-3" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
          Connexion internet requise
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          Connexion internet requise pour accéder aux données de l&apos;atelier. Les devis, rendez-vous et informations
          client ne peuvent pas être consultés hors ligne.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-6 py-3 text-xs font-bold tracking-widest uppercase text-white"
          style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
