import Link from "next/link";
import { WeldingIcon, InoxIcon, SoundIcon, PrecisionIcon, AtelierIcon, PartnerIcon } from "@/components/icons";

const REASONS = [
  {
    Icon: WeldingIcon,
    title: "Savoir-faire artisanal unique",
    body: "Chaque échappement est fabriqué à la main dans notre atelier de Rountzenheim-Auenheim. Pas de catalogue, pas de pièces génériques : tout est conçu, cintré et soudé sur mesure pour votre véhicule spécifique. Ce niveau d'artisanat est rare en Alsace.",
    link: { href: "/a-propos", label: "Notre atelier" },
  },
  {
    Icon: InoxIcon,
    title: "Matériaux premium inox 304L / 316L",
    body: "Nous travaillons exclusivement en inox 304L et 316L — des alliages résistants à la corrosion, durables et nobles. La qualité de la matière première garantit la longévité de votre ligne d'échappement sur mesure.",
    link: { href: "/services", label: "Nos services" },
  },
  {
    Icon: SoundIcon,
    title: "Sonorité 100% personnalisée",
    body: "Notre spécialité, c'est la signature sonore. Grave et velouté, sportif et claquant, discret au quotidien ou agressif en accélération — nous concevons la sonorité exacte que vous souhaitez, testée et validée avant livraison.",
    link: { href: "/realisations", label: "Voir les réalisations" },
  },
  {
    Icon: PrecisionIcon,
    title: "Soudure TIG de précision",
    body: "La soudure TIG est la technique de référence pour les pièces inox de qualité. Elle garantit des cordons propres, une étanchéité parfaite et une résistance mécanique supérieure à la soudure classique. Chaque raccord est fait avec soin.",
    link: null,
  },
  {
    Icon: AtelierIcon,
    title: "Atelier dédié en Alsace",
    body: "Situé à Rountzenheim-Auenheim dans le Bas-Rhin, notre atelier est accessible depuis Strasbourg (40 min), Haguenau (25 min) et toute la région Grand Est. Sur rendez-vous uniquement, nous vous accueillons pour analyser votre véhicule et définir votre projet.",
    link: { href: "/contact", label: "Nous localiser" },
  },
  {
    Icon: PartnerIcon,
    title: "Partenaire officiel SHIFTECH Strasbourg",
    body: "PERF'EXHAUST est partenaire officiel de SHIFTECH, leader européen de la reprogrammation moteur. Nous pouvons ainsi proposer des projets complets : échappement sur mesure + reprogrammation, pour des gains de puissance cohérents et maîtrisés.",
    link: { href: "/a-propos", label: "Notre partenariat" },
  },
];

export default function WhyChooseSection() {
  return (
    <section
      className="py-24 bg-[#080808]"
      aria-labelledby="why-choose-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
        <header className="mb-16">
          <div className="text-xs font-bold tracking-widest uppercase text-brand-400 mb-4">
            Notre différence
          </div>
          <h2
            id="why-choose-heading"
            className="font-oswald text-4xl md:text-5xl font-bold text-white uppercase tracking-wider mb-4"
          >
            Pourquoi choisir<br />
            <span className="text-brand-400">PERF&apos;EXHAUST ?</span>
          </h2>
          <p className="text-white/60 max-w-2xl text-lg leading-relaxed">
            En Alsace, peu d&apos;ateliers maîtrisent réellement la fabrication d&apos;échappements sur mesure.
            PERF&apos;EXHAUST est l&apos;un des rares spécialistes du Bas-Rhin à proposer un travail 100% artisanal,
            de la conception à la pose.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {REASONS.map((reason) => (
            <article
              key={reason.title}
              className="group p-6 border border-white/10 bg-[#0f0f0f] hover:border-brand-500/30 hover:bg-brand-500/5 transition-all duration-300"
            >
              <div className="w-10 h-10 flex items-center justify-center bg-brand-500/10 border border-brand-500/20 mb-4 text-brand-400 group-hover:bg-brand-500/20 transition-colors">
                <reason.Icon size={20} />
              </div>
              <h3 className="font-oswald text-lg font-bold text-white uppercase tracking-wide mb-3">
                {reason.title}
              </h3>
              <p className="text-white/55 text-sm leading-relaxed mb-4">
                {reason.body}
              </p>
              {reason.link && (
                <Link
                  href={reason.link.href}
                  className="inline-flex items-center gap-1 text-xs font-bold tracking-widest uppercase text-brand-400/70 hover:text-brand-400 transition-colors"
                >
                  {reason.link.label} →
                </Link>
              )}
            </article>
          ))}
        </div>

        <aside className="mt-12 p-6 border border-brand-500/20 bg-brand-500/5">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div className="flex-1">
              <p className="text-white font-medium leading-relaxed">
                <strong className="text-brand-400">Vous cherchez un fabricant d&apos;échappements sur mesure en Alsace ?</strong>{" "}
                PERF&apos;EXHAUST est l&apos;atelier de référence du Bas-Rhin pour la fabrication inox, la soudure TIG
                et la personnalisation sonore. Devis gratuit, réponse sous 48h.
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link
                href="/rendez-vous"
                className="inline-flex items-center gap-2 px-5 py-3 bg-brand-500 text-white font-bold text-xs tracking-widest uppercase hover:bg-brand-400 transition-colors"
                style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}
              >
                Devis gratuit
              </Link>
              <Link
                href="/realisations"
                className="inline-flex items-center gap-2 px-5 py-3 border border-white/20 text-white font-bold text-xs tracking-widest uppercase hover:border-brand-500 hover:text-brand-400 transition-colors"
              >
                Nos projets
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
