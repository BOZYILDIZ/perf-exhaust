import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Wrench, Shield, Award, MapPin } from "lucide-react";
import SectionTitle from "@/components/ui/SectionTitle";
import { partners } from "@/data/partners";

/** Repères condensés depuis les 4 cartes détaillées de /a-propos — juste le titre, pas les paragraphes complets. */
const HIGHLIGHTS = [
  { icon: Wrench, title: "Fabrication artisanale" },
  { icon: Shield, title: "Inox 304L / 316L" },
  { icon: Award, title: "Soudure TIG de précision" },
  { icon: MapPin, title: "Alsace · Bas-Rhin" },
];

/**
 * Présentation courte de l'atelier sur l'accueil — remplace les anciennes
 * sections pleine longueur (WhyChoose/Expertise/Process, désormais détaillées
 * sur /a-propos) par un aperçu condensé + un renvoi vers la page complète.
 * Le partenariat SHIFTECH est mentionné ici de façon compacte (badge), la
 * présentation détaillée restant sur /a-propos et le badge complet en footer.
 */
export default function AboutTeaser() {
  const shiftech = partners[0];
  return (
    <section className="py-24" style={{ background: "#060606" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionTitle
              label="Notre atelier"
              title="Un savoir-faire<br/>artisanal en Alsace"
              subtitle="PERF'EXHAUST fabrique à la main, à Rountzenheim-Auenheim (Bas-Rhin), des échappements sur mesure en inox 304L/316L — soudure TIG, sonorité personnalisée, zéro pièce catalogue."
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/a-propos"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold tracking-widest uppercase text-white transition-all hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #1266ea, #0d54c8)",
                  clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
                }}
              >
                Découvrir l&apos;atelier <ArrowRight size={14} />
              </Link>
              {shiftech && (
                <a
                  href={shiftech.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-4 py-3 border border-white/15 hover:border-brand-500/40 transition-colors"
                >
                  {shiftech.logo && (
                    <Image src={shiftech.logo} alt={`Logo ${shiftech.name}`} width={20} height={20} className="w-5 h-5 flex-shrink-0" />
                  )}
                  <span className="text-white/70 text-xs font-bold tracking-wider uppercase">
                    Partenaire officiel {shiftech.name} Strasbourg
                  </span>
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {HIGHLIGHTS.map((item) => (
              <div key={item.title} className="p-5 border" style={{ background: "#0f0f0f", borderColor: "#1e1e1e" }}>
                <item.icon size={20} className="text-brand-500 mb-3" />
                <h3 className="font-oswald text-white font-bold text-sm uppercase">{item.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
