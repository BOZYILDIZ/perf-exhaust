"use client";

import { useEffect, useState } from "react";
import WeldingIntro from "@/components/animations/WeldingIntro";

/**
 * Porte d'entrée de l'intro soudure : overlay plein écran affiché une fois
 * par session. Isolé en Client Component pour que la page d'accueil reste un
 * Server Component (nécessaire à la lecture des réalisations côté serveur).
 */
export default function IntroGate() {
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("pe-intro-seen")) return;
    // Différé d'une frame : évite un re-render en cascade au montage
    // (l'intro s'affiche sur fond noir, le décalage est imperceptible).
    const id = requestAnimationFrame(() => setShowIntro(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
    sessionStorage.setItem("pe-intro-seen", "1");
  };

  if (!showIntro) return null;
  return <WeldingIntro onComplete={handleIntroComplete} />;
}
