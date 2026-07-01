import { Metadata } from "next";
import AppointmentForm from "@/components/forms/AppointmentForm";
import { CheckCircle, Clock, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Demande de devis gratuit — Échappement sur mesure Alsace",
  description: "Demandez votre devis gratuit pour un échappement sur mesure en Alsace. Remplissez le formulaire et PERF'EXHAUST vous répond sous 24-48h. Soudure inox, sonorité personnalisée.",
  keywords: ["devis échappement Alsace", "devis gratuit inox Bas-Rhin", "rendez-vous atelier Rountzenheim", "projet échappement sur mesure"],
  openGraph: {
    title: "Devis gratuit — Échappement sur mesure PERF'EXHAUST Alsace",
    description: "Votre projet d'échappement sur mesure en Alsace. Devis gratuit, réponse sous 48h.",
    url: "https://perfexhaust.vercel.app/rendez-vous",
    type: "website",
  },
  alternates: { canonical: "https://perfexhaust.vercel.app/rendez-vous" },
};

const advantages = [
  { icon: CheckCircle, text: "Devis gratuit et sans engagement" },
  { icon: Clock, text: "Réponse sous 24 à 48h" },
  { icon: Phone, text: "Accompagnement personnalisé" },
];

export default function RendezVousPage() {
  return (
    <div className="pt-20" style={{ background: "#080808" }}>
      {/* Header */}
      <div className="relative py-16 overflow-hidden" style={{ background: "linear-gradient(135deg, #0a0a0a, #0f0808)" }}>
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(18,102,234,1) 1px, transparent 1px), linear-gradient(90deg, rgba(18,102,234,1) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-0.5 bg-orange-500" />
            <span className="text-orange-500 text-xs font-bold tracking-widest uppercase">Devis gratuit</span>
          </div>
          <h1 className="font-black text-white mb-4" style={{ fontFamily: "Oswald, sans-serif", fontSize: "clamp(2rem, 5vw, 4rem)", lineHeight: "1" }}>
            DEMANDE DE DEVIS
          </h1>
          <p className="text-gray-400 text-lg max-w-xl">
            Décrivez votre projet. Notre équipe analyse et vous transmet un devis personnalisé.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="p-4 sm:p-8 border" style={{ background: "#0f0f0f", borderColor: "#1e1e1e", borderRadius: "2px" }}>
              <AppointmentForm />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="p-6 border" style={{ background: "#0f0f0f", borderColor: "#1e1e1e" }}>
              <h3 className="text-white font-bold text-sm tracking-widest uppercase mb-4" style={{ fontFamily: "Oswald, sans-serif" }}>
                Pourquoi nous choisir ?
              </h3>
              <div className="space-y-3">
                {advantages.map((a, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <a.icon size={16} className="text-orange-500 flex-shrink-0" />
                    <span className="text-gray-400 text-sm">{a.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border" style={{ background: "rgba(18,102,234,0.04)", borderColor: "rgba(18,102,234,0.2)" }}>
              <h3 className="text-orange-400 font-bold text-sm tracking-widest uppercase mb-3">Prix sur devis</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Chaque projet est unique. Nos tarifs dépendent du véhicule, des matériaux et des prestations.
                Un devis détaillé vous sera transmis après analyse de votre demande.
              </p>
            </div>

            <div className="p-6 border" style={{ background: "#0f0f0f", borderColor: "#1e1e1e" }}>
              <h3 className="text-white font-bold text-sm tracking-widest uppercase mb-3">Contact direct</h3>
              <div className="space-y-2">
                <a href="tel:+33636523058" className="flex items-center gap-2 text-gray-400 text-sm hover:text-orange-400 transition-colors">
                  <Phone size={14} className="text-orange-500" /> +33 6 36 52 30 58
                </a>
                <a href="mailto:contact@perfexhaust.fr" className="flex items-center gap-2 text-gray-400 text-sm hover:text-orange-400 transition-colors">
                  <span className="text-orange-500 text-xs">✉</span> contact@perfexhaust.fr
                </a>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-800">
                <p className="text-gray-500 text-xs">Rountzenheim-Auenheim, Alsace (67)</p>
                <p className="text-gray-600 text-xs">Sur rendez-vous uniquement</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
