import type { Metadata } from "next";
import Link from "next/link";
import { services } from "@/data/services";
import { Wrench, Zap, Volume2, Flame, Music, Star, Settings, ArrowRight } from "lucide-react";
import { breadcrumbSchema, serviceSchema } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Services — Fabrication échappements inox sur mesure, soudure TIG, modification sonore Alsace",
  description: "Tous nos services d'échappement sur mesure en Alsace : ligne complète inox 304L, demi-ligne, silencieux sur mesure, soudure TIG, réparation et modification sonore. Atelier à Rountzenheim-Auenheim (Bas-Rhin). Devis gratuit.",
  keywords: ["ligne complète inox Alsace", "soudure TIG Bas-Rhin", "silencieux sur mesure Strasbourg", "modification sonore véhicule", "échappement inox Haguenau", "fabrication échappement Grand Est", "demi-ligne sur mesure 67"],
  openGraph: {
    title: "Services — Fabrication échappements sur mesure PERF'EXHAUST Alsace",
    description: "Ligne complète, demi-ligne, silencieux, soudure inox TIG, modification sonore. Fabrication artisanale à Rountzenheim-Auenheim.",
    url: "https://perfexhaust.fr/services",
    type: "website",
  },
  alternates: { canonical: "https://perfexhaust.fr/services" },
};

const iconMap: Record<string, React.ElementType> = {
  wrench: Wrench, zap: Zap, "volume-2": Volume2, flame: Flame,
  tool: Settings, music: Music, star: Star,
};

const BREADCRUMB = [
  { name: "Accueil", url: "https://perfexhaust.fr" },
  { name: "Services", url: "https://perfexhaust.fr/services" },
];

export default function ServicesPage() {
  return (
    <div className="pt-20" style={{ background: "#080808" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema(BREADCRUMB)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema("Fabrication d'échappements sur mesure", "Fabrication artisanale de lignes d'échappement inox 304L sur mesure en Alsace. Soudure TIG, modification sonore, ligne complète ou demi-ligne.")) }} />

      <header className="relative py-16" style={{ background: "linear-gradient(135deg, #0a0a0a, #0f0808)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-xs text-white/30 mb-6">
            <Link href="/" className="hover:text-brand-400 transition-colors">Accueil</Link>
            <span>/</span>
            <span className="text-white/60">Services</span>
          </nav>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-0.5 bg-brand-500" />
            <span className="text-brand-500 text-xs font-bold tracking-widest uppercase">Prestations</span>
          </div>
          <h1 className="font-oswald font-bold text-white mb-4" style={{ fontSize: "clamp(2rem, 5vw, 4rem)", lineHeight: "1" }}>
            NOS SERVICES
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
            Fabrication artisanale d&apos;échappements sur mesure en Alsace. Soudure TIG inox 304L/316L,
            modification sonore, ligne complète ou demi-ligne — chaque prestation est réalisée
            à la main dans notre atelier de Rountzenheim-Auenheim, Bas-Rhin.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <section aria-label="Nos prestations" className="space-y-8">
          {services.map((service, i) => {
            const Icon = iconMap[service.icon] || Wrench;
            return (
              <article
                key={service.id}
                className="grid grid-cols-1 md:grid-cols-3 gap-0 border overflow-hidden"
                style={{ borderColor: "#1e1e1e", borderRadius: "2px" }}
              >
                <div
                  className="p-8 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #0f0f0f, #141414)" }}
                  aria-hidden="true"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(18,102,234,0.1)", border: "1px solid rgba(18,102,234,0.2)" }}>
                      <Icon size={28} className="text-brand-500" />
                    </div>
                    <span className="text-3xl font-bold text-white/10 font-oswald">0{i + 1}</span>
                  </div>
                </div>
                <div className="md:col-span-2 p-8 border-l" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="font-oswald text-2xl font-bold text-white">{service.title}</h2>
                    {service.badge && (
                      <span className="text-xs font-bold tracking-wider uppercase text-brand-400 px-2 py-1" style={{ background: "rgba(18,102,234,0.1)", border: "1px solid rgba(18,102,234,0.2)" }}>
                        {service.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 mb-5 leading-relaxed">{service.description}</p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {service.details.map((d) => (
                      <span key={d} className="flex items-center gap-1.5 text-xs text-gray-400 px-3 py-1" style={{ background: "#1a1a1a", border: "1px solid #222" }}>
                        <span className="w-1 h-1 bg-brand-500 rounded-full" /> {d}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-brand-500 font-bold">
                    <span className="text-gray-500 whitespace-nowrap">Tarif :</span> Prix sur devis personnalisé
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section aria-label="Fabrication sur mesure en Alsace" className="mt-20 grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="font-oswald text-3xl font-bold text-white uppercase mb-4">
              Fabrication d&apos;échappements en Alsace
            </h2>
            <div className="space-y-3 text-gray-400 leading-relaxed">
              <p>
                PERF&apos;EXHAUST est l&apos;atelier spécialisé du Bas-Rhin pour la fabrication
                d&apos;échappements sur mesure. Situé à Rountzenheim-Auenheim, nous accueillons
                des clients de <strong className="text-white">Strasbourg</strong>, <strong className="text-white">Haguenau</strong>,
                Saverne, Sélestat et toute la région Grand Est.
              </p>
              <p>
                Contrairement aux garages généralistes, nous sommes 100% dédiés à l&apos;échappement
                sur mesure. Chaque ligne est fabriquée dans notre atelier, à la main, avec des
                matériaux premium — inox 304L ou 316L — et soudée au procédé TIG.
              </p>
              <p>
                Vous cherchez où faire modifier votre échappement dans le Bas-Rhin ?
                Où trouver un fabricant d&apos;échappements sport près de Strasbourg ?
                PERF&apos;EXHAUST est votre atelier de référence en Alsace.
              </p>
            </div>
          </div>
          <div>
            <h2 className="font-oswald text-3xl font-bold text-white uppercase mb-4">
              Pourquoi un devis personnalisé ?
            </h2>
            <div className="space-y-3 text-gray-400 leading-relaxed">
              <p>
                Chaque véhicule est unique : les dimensions, les contraintes d&apos;espace, le type
                de moteur et les objectifs sonores varient d&apos;un modèle à l&apos;autre. C&apos;est
                pourquoi nous ne proposons pas de tarifs fixes.
              </p>
              <p>
                Après analyse de votre véhicule, nous vous proposons une solution adaptée avec
                un devis détaillé — matériaux, temps de travail, options. Aucune mauvaise surprise.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/rendez-vous"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand-500 text-white font-bold text-xs tracking-widest uppercase hover:bg-brand-400 transition-colors text-center"
                  style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}
                >
                  Demander un devis
                </Link>
                <Link
                  href="/realisations"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-white/20 text-white/70 font-bold text-xs tracking-widest uppercase hover:border-brand-500 hover:text-brand-400 transition-colors text-center"
                >
                  Voir les réalisations
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16" aria-label="Appel à l'action">
          <div className="text-center py-12 border" style={{ background: "rgba(18,102,234,0.03)", borderColor: "rgba(18,102,234,0.15)" }}>
            <h2 className="font-oswald text-3xl font-bold text-white mb-3">Votre projet sur mesure</h2>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto">
              Décrivez votre véhicule et vos attentes. Nous vous répondons sous 48h avec une proposition adaptée.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/rendez-vous" className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold tracking-widest uppercase text-white" style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)", clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}>
                Demander un devis <ArrowRight size={14} />
              </Link>
              <Link href="/a-propos" className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold tracking-widest uppercase border border-white/20 text-white/70 hover:border-brand-500 hover:text-brand-400 transition-colors">
                Notre atelier →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
