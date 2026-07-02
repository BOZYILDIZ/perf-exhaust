"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const faqs = [
  { q: "Combien coûte un échappement sur mesure ?", a: "Le prix dépend du véhicule, du type de prestation (ligne complète, demi-ligne, silencieux), des matériaux (inox 304L, 316L) et du travail de soudure requis. Nous établissons un devis personnalisé gratuit après analyse de votre véhicule. Contactez-nous pour une estimation." },
  { q: "Pourquoi les prix sont-ils sur devis ?", a: "Chaque véhicule est unique : dimensions, emplacement, contraintes techniques, matériaux, temps de fabrication... Un forfait fixe ne peut pas refléter la réalité d'un travail artisanal sur mesure. Notre devis est gratuit et sans engagement." },
  { q: "Peut-on choisir la sonorité de l'échappement ?", a: "Absolument. C'est notre spécialité. Nous pouvons créer des échappements discrets, sportifs, graves, agressifs ou totalement personnalisés selon vos attentes. Certains projets incluent une valve électronique pour moduler la sonorité à la demande." },
  { q: "Travaillez-vous l'inox ?", a: "Oui, nous sommes spécialisés dans la soudure TIG sur inox 304L et 316L. Nous travaillons également l'aluminium et les métaux ferreux. L'inox est privilégié pour sa durabilité et sa résistance à la corrosion." },
  { q: "Intervenez-vous sur toutes les marques de véhicules ?", a: "Oui, nous travaillons sur toutes les marques et tous les modèles : Volkswagen, BMW, Audi, Mercedes, Porsche, Renault, Peugeot, Ford, Nissan, Toyota et bien d'autres. Chaque ligne est fabriquée sur mesure, aucune contrainte de modèle." },
  { q: "Où se situe l'atelier PERF'EXHAUST ?", a: "Notre atelier est situé à Rountzenheim-Auenheim, dans le Bas-Rhin (67), en Alsace. Nous intervenons pour des clients de Strasbourg, Haguenau, et toute la région Grand Est. L'atelier fonctionne sur rendez-vous uniquement." },
  { q: "Peut-on envoyer des photos avant le rendez-vous ?", a: "Oui et nous vous encourageons à le faire. Après votre demande de devis, envoyez des photos de votre véhicule et de la ligne existante à contact@perfexhaust.fr. Cela nous permet de préparer une estimation plus précise." },
  { q: "Combien de temps dure une fabrication d'échappement sur mesure ?", a: "La durée dépend de la complexité du projet. Une réparation peut se faire en une journée. Une ligne complète sur mesure nécessite généralement 1 à 3 jours de travail. Nous vous communiquons le délai exact lors de l'établissement du devis." },
  { q: "Proposez-vous des projets discrets pour une utilisation quotidienne ?", a: "Absolument. Tous les profils sonores sont possibles, du plus discret au plus sportif. Nous adaptons la conception pour répondre exactement à vos attentes, que vous souhaitiez un léger caractère ou une discrétion totale." },
  { q: "Êtes-vous partenaire de SHIFTECH ?", a: "Oui, PERF'EXHAUST est partenaire officiel de SHIFTECH, référence européenne en reprogrammation moteur. Cette collaboration nous permet de proposer des projets combinant échappement sur mesure et optimisation moteur complète." },
];

// Schema FAQPage généré depuis le tableau `faqs` ci-dessus : le contenu
// structuré reste toujours identique au contenu visible (exigence Google).
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24" style={{ background: "#080808" }} aria-label="Foire aux questions">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-16 text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-brand-400 mb-4">FAQ</div>
          <h2 className="font-oswald text-4xl md:text-5xl font-bold text-white uppercase tracking-wider mb-4">
            Questions fréquentes
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">
            Tout ce que vous devez savoir sur la fabrication d&apos;échappements sur mesure en Alsace.
          </p>
        </div>

        <div className="space-y-2" role="list">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-white/10 overflow-hidden" role="listitem">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left gap-4 hover:bg-white/5 transition-colors"
                aria-expanded={open === i}
                aria-controls={"faq-answer-" + i}
              >
                <span className="font-medium text-white leading-snug pr-4">{faq.q}</span>
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center border border-white/20 text-brand-400">
                  {open === i ? <Minus size={12} /> : <Plus size={12} />}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    id={"faq-answer-" + i}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                    role="region"
                  >
                    <div className="px-5 pb-5 border-t border-white/5">
                      <p className="text-white/60 leading-relaxed pt-4">{faq.a}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-white/40 mb-4">Vous ne trouvez pas la réponse à votre question ?</p>
          <a href="/contact" className="inline-flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-brand-400 hover:text-brand-300 transition-colors">
            Contactez-nous directement →
          </a>
        </div>
      </div>
    </section>
  );
}
