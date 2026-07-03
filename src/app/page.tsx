import IntroGate from "@/components/animations/IntroGate";
import Hero from "@/components/sections/Hero";
import ServicesSection from "@/components/sections/ServicesSection";
import GallerySection from "@/components/sections/GallerySection";
import ProcessSection from "@/components/sections/ProcessSection";
import SocialFeedSection from "@/components/sections/SocialFeedSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import PartnersSection from "@/components/sections/PartnersSection";
import CTASection from "@/components/sections/CTASection";
import FAQSection from "@/components/sections/FAQSection";
import LocalSection from "@/components/sections/LocalSection";
import WhyChooseSection from "@/components/sections/WhyChooseSection";
import ExpertiseSection from "@/components/sections/ExpertiseSection";

// ISR : les réalisations mises en avant (admin) apparaissent sans redéploiement.
export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      <IntroGate />
      <Hero />
      <ServicesSection />
      <GallerySection />
      <WhyChooseSection />
      <ProcessSection />
      <ExpertiseSection />
      <LocalSection />
      <SocialFeedSection />
      <FAQSection />
      <TestimonialsSection />
      <PartnersSection />
      <CTASection />
    </>
  );
}
