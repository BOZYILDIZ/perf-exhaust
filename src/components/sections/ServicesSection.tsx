"use client";

import Link from "next/link";
import { services } from "@/data/services";
import SectionTitle from "@/components/ui/SectionTitle";
import { ArrowRight, Wrench, Zap, Volume2, Flame, Music, Star, Settings } from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  wrench: Wrench, zap: Zap, "volume-2": Volume2, flame: Flame,
  tool: Settings, music: Music, star: Star,
};

export default function ServicesSection() {
  return (
    <section className="py-24 relative" style={{ background: "linear-gradient(180deg, #0a0a0a 0%, #0d0d0d 100%)" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <SectionTitle
            label="Nos prestations"
            title="Services<br/>d&apos;excellence"
            subtitle="Chaque projet est unique. Chaque échappement est fabriqué à la main dans notre atelier alsacien."
          />
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-brand-400 hover:text-brand-300 transition-colors flex-shrink-0"
          >
            Tous les services <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((service) => {
            const Icon = iconMap[service.icon] || Wrench;
            return (
              <div
                key={service.id}
                className="group p-6 border transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                style={{
                  background: "#111111",
                  borderColor: "#1e1e1e",
                  borderRadius: "2px",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(18,102,234,0.3)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(18,102,234,0.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#1e1e1e";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-10 h-10 flex items-center justify-center"
                    style={{
                      background: "rgba(18,102,234,0.1)",
                      border: "1px solid rgba(18,102,234,0.2)",
                    }}
                  >
                    <Icon size={18} className="text-brand-500" />
                  </div>
                  {service.badge && (
                    <span
                      className="text-xs font-bold tracking-wider uppercase text-brand-400 px-2 py-0.5"
                      style={{ background: "rgba(18,102,234,0.1)", border: "1px solid rgba(18,102,234,0.2)" }}
                    >
                      {service.badge}
                    </span>
                  )}
                </div>

                <h3
                  className="text-white font-bold text-base mb-2 leading-tight group-hover:text-brand-400 transition-colors"
                  style={{ fontFamily: "var(--font-oswald), sans-serif" }}
                >
                  {service.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{service.description}</p>

                <ul className="space-y-1">
                  {service.details.slice(0, 3).map((d) => (
                    <li key={d} className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="w-1 h-1 bg-brand-500 rounded-full flex-shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Prix sur devis banner */}
        <div
          className="mt-8 p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ background: "rgba(18,102,234,0.05)", border: "1px solid rgba(18,102,234,0.15)" }}
        >
          <div>
            <p className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
              Tous nos tarifs sur devis personnalisé
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Chaque projet est unique. Contactez-nous pour une estimation gratuite adaptée à votre véhicule.
            </p>
          </div>
          <Link
            href="/rendez-vous"
            className="w-full sm:w-auto flex-shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold tracking-widest uppercase text-white text-center"
            style={{
              background: "linear-gradient(135deg, #1266ea, #0d54c8)",
              clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
            }}
          >
            Demander un devis <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
