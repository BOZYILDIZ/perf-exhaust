import IntroGate from "@/components/animations/IntroGate";
import Hero from "@/components/sections/Hero";
import ServicesSection from "@/components/sections/ServicesSection";
import GallerySection from "@/components/sections/GallerySection";
import AboutTeaser from "@/components/sections/AboutTeaser";
import CTASection from "@/components/sections/CTASection";

// ISR : les réalisations mises en avant (admin) apparaissent sans redéploiement.
export const revalidate = 60;

/**
 * Accueil — aperçu volontairement court, chaque section renvoie vers sa page
 * dédiée pour le détail complet (voir /services, /realisations, /a-propos) :
 * plus de recopie intégrale de ces pages ici (refonte multi-pages du
 * 2026-08-09). Le contenu retiré (expertise détaillée, processus,
 * zones desservies, FAQ, avis, réseaux sociaux, partenaires) n'a jamais été
 * supprimé — il vit désormais sur /a-propos, /services, /contact et le footer.
 */
export default function HomePage() {
  return (
    <>
      <IntroGate />
      <Hero />
      <ServicesSection limit={4} />
      <GallerySection />
      <AboutTeaser />
      <CTASection />
    </>
  );
}
