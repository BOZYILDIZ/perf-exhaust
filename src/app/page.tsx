"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
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

const WeldingIntro = dynamic(() => import("@/components/animations/WeldingIntro"), { ssr: false });

export default function HomePage() {
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("pe-intro-seen");
    if (!seen) {
      setShowIntro(true);
    }
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
    sessionStorage.setItem("pe-intro-seen", "1");
  };

  return (
    <>
      {showIntro && <WeldingIntro onComplete={handleIntroComplete} />}
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
