const SITE_URL = "https://perfexhaust.vercel.app";

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "AutomotiveBusiness"],
  "@id": `${SITE_URL}/#organization`,
  name: "PERF'EXHAUST",
  url: SITE_URL,
  logo: `${SITE_URL}/brand/app-icon-512.png`,
  image: `${SITE_URL}/brand/og-image.jpg`,
  description: "Fabrication artisanale d'échappements sur mesure en Alsace. Soudure TIG inox 304L/316L, modification sonore, ligne complète ou demi-ligne. Atelier spécialisé à Rountzenheim-Auenheim, Bas-Rhin.",
  telephone: "+33636523058",
  email: "contact@perfexhaust.fr",
  address: {
    "@type": "PostalAddress",
    streetAddress: "30 Rue de Soufflenheim",
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
    "https://www.instagram.com/perfexhaust67/",
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
