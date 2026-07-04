import { Metadata } from "next";
import ContactForm from "@/components/forms/ContactForm";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact — Atelier PERF'EXHAUST Rountzenheim-Auenheim",
  description: "Contactez PERF'EXHAUST à Rountzenheim-Auenheim (Bas-Rhin). Téléphone : +33 6 36 52 30 58. Email, formulaire. Atelier sur rendez-vous. Devis gratuit en Alsace.",
  keywords: ["contact echappement Alsace", "atelier Rountzenheim téléphone", "PERF EXHAUST contact", "rendez-vous échappement Bas-Rhin"],
  openGraph: {
    title: "Contact — PERF'EXHAUST Rountzenheim-Auenheim",
    description: "Contactez notre atelier à Rountzenheim-Auenheim. Tél: +33 6 36 52 30 58.",
    url: "https://perfexhaust.vercel.app/contact",
    type: "website",
  },
  alternates: { canonical: "https://perfexhaust.vercel.app/contact" },
};

export default function ContactPage() {
  return (
    <div className="pt-20" style={{ background: "#080808" }}>
      <div className="relative py-16" style={{ background: "linear-gradient(135deg, #0a0a0a, #0f0808)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-0.5 bg-brand-500" />
            <span className="text-brand-500 text-xs font-bold tracking-widest uppercase">Nous joindre</span>
          </div>
          <h1 className="font-black text-white mb-4" style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: "clamp(2rem, 5vw, 4rem)", lineHeight: "1" }}>
            CONTACT
          </h1>
          <p className="text-gray-400 text-lg max-w-xl">Une question ? Un projet ? Contactez notre atelier.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 p-8 border" style={{ background: "#0f0f0f", borderColor: "#1e1e1e" }}>
            <ContactForm />
          </div>
          <div className="space-y-5">
            <div className="p-6 border" style={{ background: "#0f0f0f", borderColor: "#1e1e1e" }}>
              <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>Informations</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-brand-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white text-sm font-medium">30 Rue de Soufflenheim<br />67480 Rountzenheim-Auenheim</p>
                    <p className="text-gray-500 text-xs">Alsace, Bas-Rhin (67)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-brand-500 flex-shrink-0" />
                  <a href="tel:+33636523058" className="text-gray-300 text-sm hover:text-brand-400 transition-colors">+33 6 36 52 30 58</a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-brand-500 flex-shrink-0" />
                  <a href="mailto:contact@perfexhaust.fr" className="text-gray-300 text-sm hover:text-brand-400 transition-colors">contact@perfexhaust.fr</a>
                </div>
                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-brand-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-300 text-sm">Sur rendez-vous uniquement</p>
                    <p className="text-gray-500 text-xs">Lun–Ven : 8h–18h</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
