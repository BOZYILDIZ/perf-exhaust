export interface PublicFAQ {
  question: string
  answer: string
}

/**
 * Contenu historique de la FAQ — utilisé tant qu'aucune question publiée
 * n'existe en base (voir src/lib/faq-repo.ts § getPublishedFAQs) et pour
 * amorcer la base (scripts/seed-faq.ts).
 */
export const DEFAULT_FAQS: PublicFAQ[] = [
  { question: "Combien coûte un échappement sur mesure ?", answer: "Le prix dépend du véhicule, du type de prestation (ligne complète, demi-ligne, silencieux), des matériaux (inox 304L, 316L) et du travail de soudure requis. Nous établissons un devis personnalisé gratuit après analyse de votre véhicule. Contactez-nous pour une estimation." },
  { question: "Pourquoi les prix sont-ils sur devis ?", answer: "Chaque véhicule est unique : dimensions, emplacement, contraintes techniques, matériaux, temps de fabrication... Un forfait fixe ne peut pas refléter la réalité d'un travail artisanal sur mesure. Notre devis est gratuit et sans engagement." },
  { question: "Peut-on choisir la sonorité de l'échappement ?", answer: "Absolument. C'est notre spécialité. Nous pouvons créer des échappements discrets, sportifs, graves, agressifs ou totalement personnalisés selon vos attentes. Certains projets incluent une valve électronique pour moduler la sonorité à la demande." },
  { question: "Travaillez-vous l'inox ?", answer: "Oui, nous sommes spécialisés dans la soudure TIG sur inox 304L et 316L. Nous travaillons également l'aluminium et les métaux ferreux. L'inox est privilégié pour sa durabilité et sa résistance à la corrosion." },
  { question: "Intervenez-vous sur toutes les marques de véhicules ?", answer: "Oui, nous travaillons sur toutes les marques et tous les modèles : Volkswagen, BMW, Audi, Mercedes, Porsche, Renault, Peugeot, Ford, Nissan, Toyota et bien d'autres. Chaque ligne est fabriquée sur mesure, aucune contrainte de modèle." },
  { question: "Où se situe l'atelier PERF'EXHAUST ?", answer: "Notre atelier est situé à Rountzenheim-Auenheim, dans le Bas-Rhin (67), en Alsace. Nous intervenons pour des clients de Strasbourg, Haguenau, et toute la région Grand Est. L'atelier fonctionne sur rendez-vous uniquement." },
  { question: "Peut-on envoyer des photos avant le rendez-vous ?", answer: "Oui et nous vous encourageons à le faire. Après votre demande de devis, envoyez des photos de votre véhicule et de la ligne existante à contact@perfexhaust.fr. Cela nous permet de préparer une estimation plus précise." },
  { question: "Combien de temps dure une fabrication d'échappement sur mesure ?", answer: "La durée dépend de la complexité du projet. Une réparation peut se faire en une journée. Une ligne complète sur mesure nécessite généralement 1 à 3 jours de travail. Nous vous communiquons le délai exact lors de l'établissement du devis." },
  { question: "Proposez-vous des projets discrets pour une utilisation quotidienne ?", answer: "Absolument. Tous les profils sonores sont possibles, du plus discret au plus sportif. Nous adaptons la conception pour répondre exactement à vos attentes, que vous souhaitiez un léger caractère ou une discrétion totale." },
  { question: "Êtes-vous partenaire de SHIFTECH ?", answer: "Oui, PERF'EXHAUST est partenaire officiel de SHIFTECH, référence européenne en reprogrammation moteur. Cette collaboration nous permet de proposer des projets combinant échappement sur mesure et optimisation moteur complète." },
]
