import { Metadata } from "next";
import Link from "next/link";
import { projects } from "@/data/projects";
import ProjectCard from "@/components/ui/ProjectCard";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Réalisations — Projets échappements sur mesure",
  description:
    "Découvrez nos 15 réalisations en Alsace : Golf GTI, BMW M2, Audi RS3, Porsche Cayman et bien plus. Échappements inox sur mesure par PERF'EXHAUST.",
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
              "linear-gradient(rgba(249,115,22,1) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,1) 1px, transparent 1px)",
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

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div
          className="p-8 text-center border"
          style={{
            background: "rgba(249,115,22,0.03)",
            borderColor: "rgba(249,115,22,0.15)",
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
            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold tracking-widest uppercase text-black"
            style={{
              background: "linear-gradient(135deg, #f97316, #ea580c)",
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
