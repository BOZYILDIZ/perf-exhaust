import Link from "next/link";

const EXPERTISES = [
  {
    number: "01",
    title: "Fabrication sur mesure",
    subtitle: "Zéro pièce catalogue",
    description: "Contrairement aux ateliers qui adaptent des pièces standard, PERF'EXHAUST fabrique chaque élément à partir de la matière première. Tubes, coudes, collecteurs, silencieux — tout est dimensionné, cintré et assemblé en fonction des cotes exactes de votre véhicule. Le résultat : une ligne qui s'intègre parfaitement, sans jeu ni vibration.",
    keywords: ["Sur mesure absolu", "Pas de pièces génériques", "Ajustement précis"],
  },
  {
    number: "02",
    title: "Soudure TIG inox",
    subtitle: "La technique des professionnels",
    description: "La soudure TIG (Tungsten Inert Gas) est la méthode utilisée pour l'aéronautique, la médical et l'industrie haute performance. Elle produit des cordons nets, esthétiques et mécaniquement solides. Appliquée à l'inox 304L ou 316L, elle garantit une étanchéité parfaite des gaz d'échappement et une résistance à la corrosion sur le long terme.",
    keywords: ["Inox 304L / 316L", "Cordons TIG homogènes", "Étanchéité garantie"],
  },
  {
    number: "03",
    title: "Optimisation de la sonorité",
    subtitle: "L'acoustique automobile, notre passion",
    description: "Le son d'un échappement dépend du diamètre des tubes, du volume des silencieux, de l'emplacement des chambres d'expansion et des contre-pressions. Nous maîtrisons ces paramètres pour concevoir exactement la signature sonore que vous souhaitez : grave et puissante, sportive avec crépitements, discrète pour le quotidien, ou une solution mixte avec valve électronique.",
    keywords: ["Grave, sportif, agressif, discret", "Valve électronique optionnelle", "Testé avant livraison"],
  },
  {
    number: "04",
    title: "Matériaux premium",
    subtitle: "Qualité qui dure",
    description: "Nous sélectionnons nos matériaux avec soin. L'inox 304L est notre standard — il résiste aux températures extrêmes et à la corrosion pendant des décennies. Pour les projets haute performance, nous proposons l'inox 316L (résistance accrue aux chlorures) ou l'aluminium pour les pièces légères. Chaque cordon de soudure est réalisé avec une baguette d'apport adaptée au métal de base.",
    keywords: ["Inox 304L standard", "316L haute performance", "Aluminium disponible"],
  },
  {
    number: "05",
    title: "Processus de fabrication",
    subtitle: "De la conception à la pose",
    description: "Tout commence par une analyse de votre véhicule en atelier. Nous prenons les mesures, discutons de vos objectifs sonores et techniques, puis proposons une solution. La fabrication démarre ensuite : découpe, cintrage, ajustement, soudure, finition. Après vérification d'étanchéité et de tenue mécanique, la pose est effectuée dans notre atelier alsacien. Vous repartez avec une ligne 100% sur mesure.",
    keywords: ["Analyse en atelier", "Fabrication artisanale", "Vérification étanchéité"],
  },
];

export default function ExpertiseSection() {
  return (
    <section
      className="py-24"
      style={{ background: "#060606" }}
      aria-labelledby="expertise-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
        <header className="mb-16 grid md:grid-cols-2 gap-8 items-end">
          <div>
            <div className="text-xs font-bold tracking-widest uppercase text-orange-400 mb-4">
              Savoir-faire
            </div>
            <h2
              id="expertise-heading"
              className="font-oswald text-4xl md:text-5xl font-bold text-white uppercase tracking-wider leading-tight"
            >
              Notre expertise<br />
              <span className="text-orange-400">en détail</span>
            </h2>
          </div>
          <div>
            <p className="text-white/55 text-lg leading-relaxed">
              Fabrication artisanale, soudure TIG, matériaux premium, sonorité personnalisée —
              voici comment PERF&apos;EXHAUST travaille pour produire des échappements sur mesure
              d&apos;exception en Alsace.
            </p>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 mt-4 text-sm font-bold tracking-widest uppercase text-orange-400 hover:text-orange-300 transition-colors"
            >
              Voir tous nos services →
            </Link>
          </div>
        </header>

        <div className="space-y-0 divide-y divide-white/5">
          {EXPERTISES.map((exp, i) => (
            <article key={exp.number} className="group py-8 grid md:grid-cols-4 gap-6 items-start hover:bg-white/[0.02] px-4 -mx-4 transition-colors">
              <div className="md:col-span-1 flex items-start gap-4">
                <span className="font-oswald text-5xl font-bold text-orange-500/20 group-hover:text-orange-500/40 transition-colors leading-none">
                  {exp.number}
                </span>
              </div>
              <div className="md:col-span-3">
                <div className="mb-1 text-xs font-bold tracking-widest uppercase text-orange-400/70">
                  {exp.subtitle}
                </div>
                <h3 className="font-oswald text-2xl font-bold text-white uppercase tracking-wide mb-3">
                  {exp.title}
                </h3>
                <p className="text-white/55 leading-relaxed mb-4 max-w-2xl">
                  {exp.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {exp.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="text-xs px-2.5 py-1 border border-white/10 text-white/40 bg-white/5"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        <footer className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-8 border-t border-white/10">
          <p className="text-white/40 text-sm flex-1">
            Chaque projet est unique. Discutons ensemble de votre véhicule et de vos attentes.
          </p>
          <div className="flex gap-3">
            <Link
              href="/rendez-vous"
              className="inline-flex items-center gap-2 px-5 py-3 bg-orange-500 text-white font-bold text-xs tracking-widest uppercase hover:bg-orange-400 transition-colors"
              style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}
            >
              Demander un devis
            </Link>
            <Link
              href="/realisations"
              className="inline-flex items-center gap-2 px-5 py-3 border border-white/20 text-white/70 font-bold text-xs tracking-widest uppercase hover:border-orange-500 hover:text-orange-400 transition-colors"
            >
              Voir les réalisations
            </Link>
          </div>
        </footer>
      </div>
    </section>
  );
}
