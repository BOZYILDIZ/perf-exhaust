import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Shield, Wrench, Award, MapPin } from "lucide-react";
import { partners } from "@/data/partners";
import { breadcrumbSchema } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "À propos — Atelier PERF'EXHAUST, fabricant d'échappements sur mesure en Alsace",
  description: "PERF'EXHAUST : atelier artisanal de fabrication d'échappements sur mesure à Rountzenheim-Auenheim (Bas-Rhin). Soudure TIG inox, expertise sonore, partenaire SHIFTECH. Devis gratuit pour tout le Grand Est.",
  keywords: ["atelier echappement Rountzenheim Auenheim", "PERF EXHAUST Alsace", "fabricant échappement Bas-Rhin 67", "soudeur inox Grand Est", "partenaire SHIFTECH Alsace", "artisan échappement sur mesure", "expertise soudure TIG échappement"],
  openGraph: {
    title: "À propos — PERF'EXHAUST Atelier Alsace Rountzenheim-Auenheim",
    description: "Qui sommes-nous ? PERF'EXHAUST, atelier artisanal spécialisé en fabrication d'échappements sur mesure en Alsace. Soudure TIG, inox, partenaire SHIFTECH.",
    url: "https://perfexhaust.vercel.app/a-propos",
    type: "website",
  },
  alternates: { canonical: "https://perfexhaust.vercel.app/a-propos" },
};

const BREADCRUMB = [
  { name: "Accueil", url: "https://perfexhaust.vercel.app" },
  { name: "À propos", url: "https://perfexhaust.vercel.app/a-propos" },
];

const EXPERTISE_CARDS = [
  { icon: Wrench, title: "Fabrication artisanale", desc: "Chaque pièce est fabriquée à la main. Tubes, coudes, silencieux — tout est dimensionné et assemblé selon les cotes exactes de votre véhicule." },
  { icon: Shield, title: "Inox 304L / 316L", desc: "Matériaux premium résistants à la corrosion et aux hautes températures. Durabilité garantie sur le long terme." },
  { icon: Award, title: "Soudure TIG de précision", desc: "Cordons nets et étanches, technique aéronautique appliquée à l'échappement. Aucun compromis sur la qualité." },
  { icon: MapPin, title: "Alsace · Bas-Rhin", desc: "Situé à Rountzenheim-Auenheim (67), accessible depuis Strasbourg (40 min), Haguenau (25 min), Saverne (45 min)." },
];

export default function AProposPage() {
  return (
    <div className="pt-20" style={{ background: "#080808" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema(BREADCRUMB)) }} />

      <header className="relative py-16" style={{ background: "linear-gradient(135deg, #0a0a0a, #0f0808)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-xs text-white/30 mb-6">
            <Link href="/" className="hover:text-orange-400 transition-colors">Accueil</Link>
            <span>/</span>
            <span className="text-white/60">À propos</span>
          </nav>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-0.5 bg-orange-500" />
            <span className="text-orange-500 text-xs font-bold tracking-widest uppercase">Notre atelier</span>
          </div>
          <h1 className="font-oswald font-bold text-white mb-4" style={{ fontSize: "clamp(2rem, 5vw, 4rem)", lineHeight: "1" }}>
            À PROPOS
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
            PERF&apos;EXHAUST est l&apos;atelier de référence en Alsace pour la fabrication artisanale
            d&apos;échappements sur mesure. Découvrez notre histoire, notre savoir-faire et notre philosophie.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <section aria-label="Présentation de l'atelier" className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
          <div>
            <h2 className="font-oswald text-2xl sm:text-3xl font-bold text-white uppercase mb-6">
              L&apos;atelier PERF&apos;EXHAUST
            </h2>
            <div className="space-y-4 text-gray-400 leading-relaxed">
              <p>
                PERF&apos;EXHAUST est un atelier artisanal spécialisé dans la conception, la fabrication
                et la pose d&apos;échappements sur mesure, basé à <strong className="text-white">Rountzenheim-Auenheim</strong> en
                Alsace, dans le Bas-Rhin.
              </p>
              <p>
                Notre spécialité : la <strong className="text-white">soudure TIG sur inox 304L/316L</strong>,
                aluminium et métaux ferreux. Chaque ligne d&apos;échappement est fabriquée à la main,
                adaptée précisément à votre véhicule et à vos objectifs sonores et mécaniques.
              </p>
              <p>
                Que vous souhaitiez une <strong className="text-white">sonorité sportive affirmée</strong>,
                un son grave profond, ou une modification discrète pour une utilisation quotidienne,
                nous concevons la solution idéale. Chaque projet fait l&apos;objet d&apos;une consultation
                approfondie et d&apos;un devis personnalisé gratuit.
              </p>
              <p>
                Partenaire officiel <strong className="text-white">SHIFTECH</strong>, nous combinons
                notre expertise en fabrication d&apos;échappements avec les meilleures solutions de
                reprogrammation moteur, pour des projets de performance automobile cohérents et maîtrisés.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-orange-500 text-white font-bold text-xs tracking-widest uppercase hover:bg-orange-400 transition-colors whitespace-nowrap"
                style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}
              >
                Nos services
              </Link>
              <Link
                href="/realisations"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-white/20 text-white/70 font-bold text-xs tracking-widest uppercase hover:border-orange-500 hover:text-orange-400 transition-colors whitespace-nowrap"
              >
                Nos réalisations
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {EXPERTISE_CARDS.map((item, i) => (
              <div key={i} className="p-5 border" style={{ background: "#0f0f0f", borderColor: "#1e1e1e" }}>
                <item.icon size={20} className="text-orange-500 mb-3" />
                <h3 className="font-oswald text-white font-bold text-sm uppercase mb-1">{item.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-label="Qui fabrique les échappements en Alsace" className="mb-20 p-8 border border-white/10 bg-[#0a0a0a]">
          <h2 className="font-oswald text-2xl sm:text-3xl font-bold text-white uppercase mb-6">
            Qui fabrique les échappements sur mesure en Alsace ?
          </h2>
          <div className="grid md:grid-cols-2 gap-8 text-gray-400 leading-relaxed">
            <div className="space-y-3">
              <p>
                La fabrication artisanale d&apos;échappements sur mesure est un métier rare. En Alsace,
                peu d&apos;ateliers maîtrisent réellement la <strong className="text-white">soudure TIG inox</strong>{" "}
                et la conception de lignes personnalisées. PERF&apos;EXHAUST est l&apos;un des rares
                spécialistes du Grand Est entièrement dédié à cette discipline.
              </p>
              <p>
                Notre atelier de <strong className="text-white">Rountzenheim-Auenheim</strong>{" "}
                accueille des clients de Strasbourg, Haguenau, Saverne, Sélestat, Colmar — et même au-delà.
                La distance se justifie par un résultat unique qu&apos;on ne trouve pas chez un
                préparateur généraliste.
              </p>
            </div>
            <div className="space-y-3">
              <p>
                Chaque réalisation est une pièce unique. Nous travaillons sur toutes les marques :
                Volkswagen, BMW, Audi, Mercedes, Porsche, Renault, Peugeot, Ford, Nissan, Toyota,
                et toute autre marque sur demande. Aucun modèle n&apos;est exclu de notre périmètre.
              </p>
              <p>
                Si vous cherchez un <strong className="text-white">atelier spécialisé en échappements
                inox près de Strasbourg</strong>{" "}ou dans le Bas-Rhin, PERF&apos;EXHAUST est votre
                référence. Contactez-nous pour un premier échange gratuit.
              </p>
            </div>
          </div>
        </section>

        <section aria-label="Partenaire performance" className="mb-16">
          <h2 className="font-oswald text-xl sm:text-2xl font-bold text-white uppercase mb-8">Partenaire performance</h2>
          {partners.map((p) => (
            <div key={p.id} className="p-8 border" style={{ background: "#0f0f0f", borderColor: "#1e1e1e" }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 flex items-center justify-center" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
                  <span className="text-white font-bold font-oswald">{p.name.substring(0, 2)}</span>
                </div>
                <div>
                  <h3 className="font-oswald text-white font-bold text-xl uppercase">{p.name}</h3>
                  <p className="text-orange-500 text-xs font-bold tracking-widest uppercase">{p.type}</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">{p.description}</p>
              <p className="text-white/40 text-xs">
                Notre partenariat avec {p.name}{" "}nous permet de proposer des projets complets :
                fabrication d&apos;échappements sur mesure + reprogrammation moteur, pour une
                cohérence totale entre les performances mécaniques et la sonorité.
              </p>
            </div>
          ))}
        </section>

        <section className="text-center py-12 border" style={{ background: "rgba(18,102,234,0.03)", borderColor: "rgba(18,102,234,0.15)" }}>
          <h2 className="font-oswald text-2xl font-bold text-white mb-3">Votre projet nous intéresse</h2>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">
            Chaque projet est unique. Discutons ensemble de votre véhicule, de vos attentes sonores
            et de votre budget. Devis gratuit, réponse sous 48h.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/rendez-vous" className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold tracking-widest uppercase text-white" style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)", clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}>
              Demander un devis <ArrowRight size={14} />
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold tracking-widest uppercase border border-white/20 text-white/70 hover:border-orange-500 hover:text-orange-400 transition-colors">
              Nous contacter &rarr;
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
