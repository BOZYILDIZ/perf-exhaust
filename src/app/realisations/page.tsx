import { Metadata } from "next";
import Link from "next/link";
import { projects } from "@/data/projects";
import GalleryWithFilters from "@/components/gallery/GalleryWithFilters";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Réalisations — Projets échappements inox sur mesure en Alsace",
  description: "15 projets réalisés : Golf GTI, BMW M2, Audi RS3, Porsche Cayman... Échappements inox sur mesure par PERF'EXHAUST à Rountzenheim-Auenheim. Découvrez notre savoir-faire.",
  keywords: ["réalisations échappements Alsace", "Golf GTI échappement inox", "BMW M2 silencieux sport", "Audi RS3 ligne complète", "projets sur mesure Bas-Rhin"],
  openGraph: {
    title: "Nos réalisations — PERF'EXHAUST Échappements sur mesure Alsace",
    description: "15 projets réalisés dans notre atelier alsacien. Chaque véhicule, une sonorité unique.",
    url: "https://perfexhaust.vercel.app/realisations",
    type: "website",
  },
  alternates: { canonical: "https://perfexhaust.vercel.app/realisations" },
};

export default function RealisationsPage() {
  return (
    <div className="pt-20" style={{ background: "#080808" }}>
      {/* Header */}
      <div
        className="relative py-20 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #0f0808 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(18,102,234,1) 1px, transparent 1px), linear-gradient(90deg, rgba(18,102,234,1) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-0.5 bg-orange-500" />
            <span className="text-orange-500 text-xs font-bold tracking-widest uppercase">
              Portfolio
            </span>
          </div>
          <h1
            className="font-black text-white mb-4"
            style={{
              fontFamily: "Oswald, sans-serif",
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              lineHeight: "0.95",
            }}
          >
            NOS RÉALISATIONS
          </h1>
          <p className="text-gray-400 text-lg max-w-xl">
            15 projets réalisés dans notre atelier alsacien. Chaque véhicule,
            une sonorité unique fabriquée sur mesure.
          </p>
        </div>
      </div>

      {/* Gallery with filters */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <GalleryWithFilters projects={projects} />
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div
          className="p-8 text-center border"
          style={{
            background: "rgba(18,102,234,0.03)",
            borderColor: "rgba(18,102,234,0.15)",
          }}
        >
          <h2
            className="text-2xl font-black text-white mb-2"
            style={{ fontFamily: "Oswald, sans-serif" }}
          >
            Vous avez un projet similaire ?
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Contactez-nous pour un devis gratuit et personnalisé.
          </p>
          <Link
            href="/rendez-vous"
            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold tracking-widest uppercase text-white"
            style={{
              background: "linear-gradient(135deg, #1266ea, #0d54c8)",
              clipPath:
                "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
            }}
          >
            Demander un devis <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
