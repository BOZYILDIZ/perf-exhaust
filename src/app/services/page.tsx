import { Metadata } from "next";
import Link from "next/link";
import { services } from "@/data/services";
import SectionTitle from "@/components/ui/SectionTitle";
import { ArrowRight, Wrench, Zap, Volume2, Flame, Music, Star, Settings } from "lucide-react";

export const metadata: Metadata = {
  title: "Services — Échappements sur mesure Alsace",
  description: "Tous nos services : ligne complète, demi-ligne, silencieux sur mesure, soudure inox, réparation. PERF'EXHAUST — Rountzenheim-Auenheim.",
};

const iconMap: Record<string, React.ElementType> = {
  wrench: Wrench, zap: Zap, "volume-2": Volume2, flame: Flame,
  tool: Settings, music: Music, star: Star,
};

export default function ServicesPage() {
  return (
    <div className="pt-20" style={{ background: "#080808" }}>
      <div className="relative py-16" style={{ background: "linear-gradient(135deg, #0a0a0a, #0f0808)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-0.5 bg-orange-500" />
            <span className="text-orange-500 text-xs font-bold tracking-widest uppercase">Prestations</span>
          </div>
          <h1 className="font-black text-white mb-4" style={{ fontFamily: "Oswald, sans-serif", fontSize: "clamp(2rem, 5vw, 4rem)", lineHeight: "1" }}>
            NOS SERVICES
          </h1>
          <p className="text-gray-400 text-lg max-w-xl">
            Fabrication artisanale, soudure TIG, inox 304L/316L. Chaque prestation est réalisée à la main dans notre atelier.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 space-y-8">
        {services.map((service, i) => {
          const Icon = iconMap[service.icon] || Wrench;
          return (
            <div
              key={service.id}
              className="grid grid-cols-1 md:grid-cols-3 gap-0 border overflow-hidden"
              style={{ borderColor: "#1e1e1e", borderRadius: "2px" }}
            >
              <div
                className="p-8 flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #0f0f0f, #141414)" }}
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}>
                    <Icon size={28} className="text-orange-500" />
                  </div>
                  <span className="text-3xl font-black text-white/10" style={{ fontFamily: "Oswald, sans-serif" }}>
                    0{i + 1}
                  </span>
                </div>
              </div>
              <div className="md:col-span-2 p-8 border-l" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-2xl font-black text-white" style={{ fontFamily: "Oswald, sans-serif" }}>{service.title}</h2>
                  {service.badge && (
                    <span className="text-xs font-bold tracking-wider uppercase text-orange-400 px-2 py-1" style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}>
                      {service.badge}
                    </span>
                  )}
                </div>
                <p className="text-gray-400 mb-5 leading-relaxed">{service.description}</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {service.details.map((d) => (
                    <span key={d} className="flex items-center gap-1.5 text-xs text-gray-400 px-3 py-1" style={{ background: "#1a1a1a", border: "1px solid #222" }}>
                      <span className="w-1 h-1 bg-orange-500 rounded-full" /> {d}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-sm text-orange-500 font-bold">
                  <span className="text-gray-500">Tarif :</span> Prix sur devis personnalisé
                </div>
              </div>
            </div>
          );
        })}

        <div className="mt-12 text-center py-12 border" style={{ background: "rgba(249,115,22,0.03)", borderColor: "rgba(249,115,22,0.15)" }}>
          <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily: "Oswald, sans-serif" }}>Votre projet sur mesure</h2>
          <p className="text-gray-400 mb-6">Devis gratuit · Réponse sous 48h</p>
          <Link href="/rendez-vous" className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold tracking-widest uppercase text-black" style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}>
            Demander un devis <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
