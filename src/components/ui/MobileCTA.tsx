"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, FileText } from "lucide-react";

/**
 * Barre d'action fixe visible uniquement sur mobile.
 * Masquée sur les pages formulaire (devis, contact) pour ne pas
 * recouvrir les champs et le bouton d'envoi.
 */
export default function MobileCTA() {
  const pathname = usePathname();
  if (pathname === "/rendez-vous" || pathname === "/contact") return null;

  return (
    <>
      {/* Réserve la hauteur de la barre pour que le bas du footer reste visible */}
      <div className="h-14 lg:hidden" aria-hidden="true" />
      <div
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden flex"
        style={{
          background: "rgba(8,8,8,0.96)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(18,102,234,0.25)",
        }}
      >
        <a
          href="tel:+33636523058"
          className="flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold tracking-widest uppercase text-white active:bg-white/5 transition-colors"
          aria-label="Appeler l'atelier PERF'EXHAUST"
        >
          <Phone size={15} className="text-brand-400" />
          Appeler
        </a>
        <div className="w-px bg-white/10 my-2" aria-hidden="true" />
        <Link
          href="/rendez-vous"
          className="flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold tracking-widest uppercase text-brand-400 active:bg-brand-500/10 transition-colors"
        >
          <FileText size={15} />
          Devis gratuit
        </Link>
      </div>
    </>
  );
}
