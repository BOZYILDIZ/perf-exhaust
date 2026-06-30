const SITE_URL = "https://perfexhaust.vercel.app";

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "AutomotiveBusiness"],
  "@id": `${SITE_URL}/#organization`,
  name: "PERF'EXHAUST",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: `${SITE_URL}/og-image.jpg`,
  description: "Fabrication artisanale d'échappements sur mesure, soudure inox et modification sonore en Alsace. Atelier spécialisé à Rountzenheim-Auenheim, Bas-Rhin.",
  telephone: "+33636523058",
  email: "contact@perfexhaust.fr",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Rountzenheim-Auenheim",
    addressLocality: "Rountzenheim-Auenheim",
    postalCode: "67480",
    addressRegion: "Bas-Rhin",
    addressCountry: "FR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 48.8097,
    longitude: 7.9742,
  },
  areaServed: [
    { "@type": "City", name: "Strasbourg" },
    { "@type": "City", name: "Haguenau" },
    { "@type": "City", name: "Rountzenheim-Auenheim" },
    { "@type": "AdministrativeArea", name: "Bas-Rhin" },
    { "@type": "AdministrativeArea", name: "Alsace" },
    { "@type": "AdministrativeArea", name: "Grand Est" },
  ],
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday"], opens: "08:00", closes: "18:00" },
  ],
  priceRange: "€€",
  currenciesAccepted: "EUR",
  paymentAccepted: "Cash, Virement bancaire",
  sameAs: [
    "https://www.instagram.com/perfexhaust",
    "https://www.tiktok.com/@perfexhaust",
  ],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "PERF'EXHAUST",
  description: "Échappements sur mesure en Alsace — Fabrication artisanale, soudure inox, modification sonore.",
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: "fr-FR",
};

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Combien coûte un échappement sur mesure ?", acceptedAnswer: { "@type": "Answer", text: "Le prix dépend du véhicule, du type de prestation (ligne complète, demi-ligne, silencieux), des matériaux (inox 304L, 316L) et du travail de soudure requis. Nous établissons un devis personnalisé gratuit après analyse de votre véhicule. Contactez-nous pour une estimation." } },
    { "@type": "Question", name: "Pourquoi les prix sont-ils sur devis ?", acceptedAnswer: { "@type": "Answer", text: "Chaque véhicule est unique : dimensions, emplacement, contraintes techniques, matériaux, temps de fabrication... Un forfait fixe ne peut pas refléter la réalité d'un travail artisanal sur mesure. Notre devis est gratuit et sans engagement." } },
    { "@type": "Question", name: "Peut-on choisir la sonorité de l'échappement ?", acceptedAnswer: { "@type": "Answer", text: "Absolument. C'est notre spécialité. Nous pouvons créer des échappements discrets, sportifs, graves, agressifs ou totalement personnalisés selon vos attentes. Certains projets incluent une valve électronique pour moduler la sonorité à la demande." } },
    { "@type": "Question", name: "Travaillez-vous l'inox ?", acceptedAnswer: { "@type": "Answer", text: "Oui, nous sommes spécialisés dans la soudure TIG sur inox 304L et 316L. Nous travaillons également l'aluminium et les métaux ferreux. L'inox est privilégié pour sa durabilité et sa résistance à la corrosion." } },
    { "@type": "Question", name: "Intervenez-vous sur toutes les marques de véhicules ?", acceptedAnswer: { "@type": "Answer", text: "Oui, nous travaillons sur toutes les marques et tous les modèles : volkswagen, BMW, Audi, Mercedes, Porsche, Renault, Peugeot, Ford, Nissan, Toyota et bien d'autres. Chaque ligne est fabriquée sur mesure, aucune contrainte de modèle." } },
    { "@type": "Question", name: "Où se situe l'atelier PERF'EXHAUST ?", acceptedAnswer: { "@type": "Answer", text: "Notre atelier est situé à Rountzenheim-Auenheim, dans le Bas-Rhin (67), en Alsace. Nous intervenons pour des clients de Strasbourg, Haguenau, et toute la région Grand Est. L'atelier fonctionne sur rendez-vous uniquement." } },
    { "@type": "Question", name: "Peut-on envoyer des photos avant le rendez-vous ?", acceptedAnswer: { "@type": "Answer", text: "Oui et nous vous encourageons à le faire. Vous pouvez joindre des photos de votre véhicule et de la ligne existante directement dans notre formulaire de demande de devis. Cela nous permet de préparer une estimation plus précise." } },
    { "@type": "Question", name: "Combien de temps dure une fabrication d'échappement sur mesure ?", acceptedAnswer: { "@type": "Answer", text: "La durée dépend de la complexité du projet. Une réparation peut se faire en une journée. Une ligne complète sur mesure nécessite généralement 1 à 3 jours de travail. Nous vous communiquons le délai exact lors de l'établissement du devis." } },
    { "@type": "Question", name: "Proposez-vous des projets discrets pour une utilisation quotidienne ?", acceptedAnswer: { "@type": "Answer", text: "Absolument. Tous les profils sonores sont possibles, du plus discret au plus sportif. Nous adaptons la conception pour répondre exactement à vos attentes, que vous souhaitiez un léger caractère ou une discrétion totale." } },
    { "@type": "Question", name: "Êtes-vous partenaire de SHIFTECH ?", acceptedAnswer: { "@type": "Answer", text: "Oui, PERF'EXHAUST est partenaire officiel de SHIFTECH, référence européenne en reprogrammation moteur. Cette collaboration nous permet de proposer des projets combinant échappement sur mesure et optimisation moteur complète." } },
  ],
};

export function serviceSchema(name: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    provider: { "@id": `${SITE_URL}/#organization` },
    name,
    description,
    areaServed: { "@type": "AdministrativeArea", name: "Alsace, France" },
    offers: { "@type": "Offer", priceCurrency: "EUR", availability: "https://schema.org/InStock", priceSpecification: { "@type": "PriceSpecification", description: "Prix sur devis personnalisé" } },
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
