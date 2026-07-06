import { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings-repo";

export const metadata: Metadata = {
  title: "Mentions légales & Confidentialité",
  description: "Mentions légales et politique de confidentialité de PERF'EXHAUST.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://perfexhaust.fr/mentions-legales" },
};

export default async function MentionsLegalesPage() {
  const settings = await getSiteSettings();
  return (
    <div className="pt-20" style={{ background: "#080808" }}>
      <div className="max-w-4xl mx-auto px-6 py-10 sm:py-16">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-8 sm:mb-12" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
          Mentions légales &amp; Confidentialité
        </h1>

        <div className="space-y-10 text-gray-400 text-sm leading-relaxed">
          <Section title="Éditeur du site">
            <p><strong className="text-white">{settings.businessName}</strong></p>
            <p>Adresse : {settings.address}, {settings.postalCode} {settings.city}, France</p>
            <p>Email : {settings.email}</p>
            <p>Téléphone : {settings.phone}</p>
            <p>Forme juridique : {settings.legalForm || "à compléter"}</p>
            <p>SIRET : {settings.siret || "à compléter"}</p>
            {settings.publicationDirector && <p>Directeur de la publication : {settings.publicationDirector}</p>}
          </Section>

          <Section title="Hébergement">
            <p>Ce site est hébergé par Vercel Inc., 440 N Barranca Avenue, Covina, CA 91723, USA.</p>
          </Section>

          <Section title="Conception et développement">
            <p>
              Ce site a été conçu et développé par{" "}
              <a
                href="https://www.bicer.fr/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Nevora — conception et développement web (nouvel onglet)"
                className="text-white font-bold hover:text-brand-500 underline-offset-2 hover:underline transition-colors duration-300"
              >
                Nevora
              </a>
              .
            </p>
          </Section>

          <Section title="Propriété intellectuelle">
            <p>L&apos;ensemble des contenus (textes, images, logos, vidéos) présents sur ce site sont la propriété exclusive de PERF&apos;EXHAUST. Toute reproduction, même partielle, est interdite sans autorisation écrite préalable.</p>
          </Section>

          <Section title="Limitation de responsabilité">
            <p>PERF&apos;EXHAUST s&apos;efforce de maintenir les informations de ce site à jour et exactes. Cependant, nous ne pouvons garantir l&apos;exhaustivité ni l&apos;exactitude des informations présentées.</p>
          </Section>

          <Section title="Politique de confidentialité" id="confidentialite">
            <h3 className="text-white font-bold text-base mb-2">Données collectées</h3>
            <p>Lors de vos demandes de devis ou messages de contact, nous collectons : nom, prénom, email, téléphone, informations sur votre véhicule et projet.</p>
            <h3 className="text-white font-bold text-base mb-2 mt-4">Utilisation des données</h3>
            <p>Ces données sont utilisées exclusivement pour répondre à vos demandes et établir vos devis. Elles ne sont jamais vendues ou partagées avec des tiers commerciaux.</p>
            <h3 className="text-white font-bold text-base mb-2 mt-4">Conservation</h3>
            <p>Vos données sont conservées pendant la durée nécessaire au traitement de votre demande, et au maximum 3 ans.</p>
            <h3 className="text-white font-bold text-base mb-2 mt-4">Vos droits</h3>
            <p>Conformément au RGPD (Règlement 2016/679), vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement et de portabilité de vos données. Pour exercer ces droits : {settings.email}</p>
            <h3 className="text-white font-bold text-base mb-2 mt-4">Cookies</h3>
            <p>Ce site utilise uniquement des cookies techniques nécessaires à son fonctionnement. Aucun cookie publicitaire ou de tracking tiers n&apos;est utilisé.</p>
          </Section>

          <Section title="Loi applicable">
            <p>Ce site et ses mentions légales sont soumis au droit français. En cas de litige, les tribunaux français sont seuls compétents.</p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-0.5 bg-brand-500" />
        <h2 className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>{title}</h2>
      </div>
      <div className="pl-4 sm:pl-9 space-y-2">{children}</div>
    </section>
  );
}
