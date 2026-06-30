const SITE_URL = "https://perfexhaust.vercel.app";

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "AutomotiveBusiness"],
  "@id": `${SITE_URL}/#organization`,
  name: "PERF'EXHAUST",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: `${SITE_URL}/og-image.jpg`,
  description: "Fabrication artisanale d'échappements sur mesure en Alsace. Soudure TIG inox 304L/316L, modification sonore, ligne complète ou demi-ligne. Atelier spécialisé à Rountzenheim-Auenheim, Bas-Rhin.",
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
    { "@type": "City", name: "Rountzenheim-Auenheim" },
    { "@type": "City", name: "Haguenau" },
    { "@type": "City", name: "Strasbourg" },
    { "@type": "City", name: "Saverne" },
    { "@type": "City", name: "Sélestat" },
    { "@type": "City", name: "Colmar" },
    { "@type": "AdministrativeArea", name: "Bas-Rhin" },
    { "@type": "AdministrativeArea", name: "Alsace" },
    { "@type": "AdministrativeArea", name: "Grand Est" },
  ],
  knowsAbout: [
    "Fabrication d'échappements sur mesure",
    "Soudure TIG inox",
    "Inox 304L 316L",
    "Modification sonore automobile",
    "Ligne complète inox",
    "Demi-ligne sur mesure",
    "Silencieux sur mesure",
    "Optimisation échappement sport",
    "Préparation automobile Alsace",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Services d'échappements sur mesure",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Ligne complète inox sur mesure",
          description: "Fabrication d'une ligne d'échappement complète en inox 304L, du collecteur au silencieux. Sur mesure pour votre véhicule.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Demi-ligne sur mesure",
          description: "Remplacement de la partie arrière de votre ligne d'échappement en inox. Solution intermédiaire efficace.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Silencieux sur mesure",
          description: "Fabrication d'un silencieux arrière ou central sur mesure, adapté au diamètre et à la sonorité souhaitée.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Modification sonore",
          description: "Personnalisation de la sonorité de votre véhicule : grave, sportif, agressif, discret, avec ou sans valve électronique.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Réparation d'échappement",
          description: "Réparation, remplacement de sections, soudure TIG et remise en état de votre ligne d'échappement existante.",
        },
      },
    ],
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "18:00",
    },
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
  description: "Échappements sur mesure en Alsace — Fabrication artisanale, soudure inox TIG, modification sonore à Rountzenheim-Auenheim (Bas-Rhin).",
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: "fr-FR",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/realisations?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Combien coûte un échappement sur mesure ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Le prix dépend du véhicule, du type de prestation (ligne complète, demi-ligne, silencieux), des matériaux (inox 304L, 316L) et du travail de soudure requis. Nous établissons un devis personnalisé gratuit après analyse de votre véhicule. Contactez-nous pour une estimation.",
      },
    },
    {
      "@type": "Question",
      name: "Pourquoi les prix sont-ils sur devis ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Chaque véhicule est unique : dimensions, emplacement, contraintes techniques, matériaux, temps de fabrication. Un forfait fixe ne peut pas refléter la réalité d'un travail artisanal sur mesure. Notre devis est gratuit et sans engagement.",
      },
    },
    {
      "@type": "Question",
      name: "Peut-on choisir la sonorité de l'échappement ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolument. C'est notre spécialité. Nous pouvons créer des échappements discrets, sportifs, graves, agressifs ou totalement personnalisés. Certains projets incluent une valve électronique pour moduler la sonorité selon l'envie.",
      },
    },
    {
      "@type": "Question",
      name: "Travaillez-vous l'inox ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui, nous sommes spécialisés dans la soudure TIG sur inox 304L et 316L. Nous travaillons également l'aluminium et les métaux ferreux. L'inox est privilégié pour sa durabilité et sa résistance à la corrosion.",
      },
    },
    {
      "@type": "Question",
      name: "Intervenez-vous sur toutes les marques de véhicules ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui, nous travaillons sur toutes les marques : Volkswagen, BMW, Audi, Mercedes, Porsche, Renault, Peugeot, Ford, Nissan, Toyota et bien d'autres. Chaque ligne est fabriquée sur mesure, sans contrainte de modèle.",
      },
    },
    {
      "@type": "Question",
      name: "Où se situe l'atelier PERF'EXHAUST ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Notre atelier est situé à Rountzenheim-Auenheim, dans le Bas-Rhin (67), en Alsace. Nous accueillons des clients de Strasbourg (40 min), Haguenau (25 min), Saverne (45 min), Sélestat et toute la région Grand Est. L'atelier fonctionne sur rendez-vous uniquement.",
      },
    },
    {
      "@type": "Question",
      name: "Peut-on envoyer des photos avant le rendez-vous ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui et nous vous encourageons à le faire. Vous pouvez joindre des photos de votre véhicule et de la ligne existante dans notre formulaire de demande de devis. Cela nous permet de préparer une estimation plus précise.",
      },
    },
    {
      "@type": "Question",
      name: "Combien de temps dure une fabrication d'échappement sur mesure ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "La durée dépend de la complexité. Une réparation peut se faire en une journée. Une ligne complète sur mesure nécessite généralement 1 à 3 jours. Nous vous communiquons le délai exact lors de l'établissement du devis.",
      },
    },
    {
      "@type": "Question",
      name: "Proposez-vous des projets discrets pour une utilisation quotidienne ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolument. Tous les profils sonores sont possibles, du plus discret au plus sportif. Nous adaptons la conception à vos attentes exactes, que vous souhaitiez un léger caractère ou une discrétion totale.",
      },
    },
    {
      "@type": "Question",
      name: "Êtes-vous partenaire de SHIFTECH ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui, PERF'EXHAUST est partenaire officiel de SHIFTECH, référence européenne en reprogrammation moteur. Cette collaboration nous permet de proposer des projets complets : échappement sur mesure + optimisation moteur.",
      },
    },
  ],
};

export function serviceSchema(name: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    provider: { "@id": `${SITE_URL}/#organization` },
    name,
    description,
    areaServed: [
      { "@type": "AdministrativeArea", name: "Alsace" },
      { "@type": "AdministrativeArea", name: "Bas-Rhin" },
      { "@type": "AdministrativeArea", name: "Grand Est" },
    ],
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      priceSpecification: {
        "@type": "PriceSpecification",
        description: "Prix sur devis personnalisé gratuit",
      },
    },
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

export function projectSchema(project: {
  slug: string;
  vehicule: string;
  prestation: string;
  description: string;
  date: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: `${project.prestation} — ${project.vehicule}`,
    description: project.description,
    creator: { "@id": `${SITE_URL}/#organization` },
    dateCreated: project.date,
    url: `${SITE_URL}/realisations/${project.slug}`,
    about: {
      "@type": "Service",
      name: project.prestation,
      provider: { "@id": `${SITE_URL}/#organization` },
    },
  };
}
