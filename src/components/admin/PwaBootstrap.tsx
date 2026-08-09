"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, WifiOff } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Lecture d'état externe (navigateur) sans jamais passer par un setState
// synchrone dans un effet — useSyncExternalStore est le mécanisme React
// prévu pour exactement ce cas (état déjà possédé par une API navigateur,
// jamais par React), et gère correctement le rendu serveur (aucun mismatch
// d'hydratation : `false` côté serveur, valeur réelle dès le montage client).
function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}
const getOfflineSnapshot = () => !navigator.onLine;
const getOfflineServerSnapshot = () => false;

function subscribeInstalled(callback: () => void) {
  const mq = window.matchMedia("(display-mode: standalone)");
  mq.addEventListener("change", callback);
  window.addEventListener("appinstalled", callback);
  return () => {
    mq.removeEventListener("change", callback);
    window.removeEventListener("appinstalled", callback);
  };
}
const getInstalledSnapshot = () =>
  window.matchMedia("(display-mode: standalone)").matches
  || (navigator as unknown as { standalone?: boolean }).standalone === true;
const getInstalledServerSnapshot = () => false;

/**
 * Enregistre le service worker admin (voir public/admin/sw.js, scope
 * /admin/) et pilote l'invite d'installation PWA + le bandeau hors-ligne.
 * Ne s'affiche que dans le layout /admin — jamais sur le site public.
 */
export default function PwaBootstrap() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const installed = useSyncExternalStore(subscribeInstalled, getInstalledSnapshot, getInstalledServerSnapshot);
  const offline = useSyncExternalStore(subscribeOnline, getOfflineSnapshot, getOfflineServerSnapshot);

  useEffect(() => {
    // Capture l'événement d'installation pour un déclenchement différé (clic
    // sur "Installer l'application") — setState uniquement dans le
    // callback, jamais dans le corps de l'effet lui-même.
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/admin/sw.js", { scope: "/admin/" }).catch((err) => {
        console.error("[PWA] Échec de l'enregistrement du service worker :", err);
      });
    }

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  return (
    <>
      {offline && (
        <div
          role="status"
          className="fixed top-0 inset-x-0 z-50 bg-red-600 text-white text-xs font-bold uppercase tracking-wider text-center py-2 flex items-center justify-center gap-2"
        >
          <WifiOff size={13} /> Hors connexion — connexion internet requise pour les données de l&apos;atelier
        </div>
      )}
      {installEvent && !installed && (
        <button
          type="button"
          onClick={install}
          // bottom-20 (80px) était un nombre magique censé dégager AdminBottomNav
          // (60px + safe-area) : insuffisant sur un iPhone à home indicator
          // (60+34=94px > 80px), le bouton pouvait chevaucher le haut de la nav.
          className="fixed z-40 bottom-[calc(var(--admin-bottom-nav-h)+var(--admin-safe-area-bottom)+var(--admin-sticky-action-gap))] sm:bottom-5 right-5 inline-flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg"
          style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)" }}
        >
          <Download size={14} /> Installer l&apos;application
        </button>
      )}
    </>
  );
}
