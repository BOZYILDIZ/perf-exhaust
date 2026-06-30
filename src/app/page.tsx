"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Hero from "@/components/sections/Hero";
import ServicesSection from "@/components/sections/ServicesSection";
import GallerySection from "@/components/sections/GallerySection";
import SocialFeedSection from "@/components/sections/SocialFeedSection";
import ProcessSection from "@/components/sections/ProcessSection";
import PartnersSection from "@/components/sections/PartnersSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import CTASection from "@/components/sections/CTASection";

const WeldingIntro = dynamic(() => import("@/components/animations/WeldingIntro"), { ssr: false });

export default function HomePage() {
  const [showIntro, setShowIntro] = useState(true);
  const [introVisible, setIntroVisible] = useState(true);

  useEffect(() => {
    const seen = sessionStorage.getItem("pe-intro-seen");
    if (seen) {
      setShowIntro(false);
      setIntroVisible(false);
    }
  }, []);

  const handleIntroComplete = () => {
    sessionStorage.setItem("pe-intro-seen", "1");
    setIntroVisible(false);
    setTimeout(() => setShowIntro(false), 400);
  };

  return (
    <>
      {showIntro && (
        <div
          style={{
            opacity: introVisible ? 1 : 0,
            transition: "opacity 0.4s ease",
            pointerEvents: introVisible ? "auto" : "none",
          }}
        >
          <WeldingIntro onComplete={handleIntroComplete} />
        </div>
      )}
      <Hero />
      <ServicesSection />
      <GallerySection />
      <ProcessSection />
      <SocialFeedSection />
      <TestimonialsSection />
      <PartnersSection />
      <CTASection />
    </>
  );
}
