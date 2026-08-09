import { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/forms/ContactForm";
import { getSiteSettings } from "@/lib/settings-repo";
import { MapPin, Phone, Mail, Clock, Navigation, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact — Atelier PERF'EXHAUST Rountzenheim-Auenheim",
  description: "Contactez PERF'EXHAUST à Rountzenheim-Auenheim (Bas-Rhin). Téléphone : +33 6 36 52 30 58. Email, formulaire. Atelier sur rendez-vous. Devis gratuit en Alsace.",
  keywords: ["contact echappement Alsace", "atelier Rountzenheim téléphone", "PERF EXHAUST contact", "rendez-vous échappement Bas-Rhin"],
  openGraph: {
    title: "Contact — PERF'EXHAUST Rountzenheim-Auenheim",
    description: "Contactez notre atelier à Rountzenheim-Auenheim. Tél: +33 6 36 52 30 58.",
    url: "https://perfexhaust.fr/contact",
    type: "website",
  },
  alternates: { canonical: "https://perfexhaust.fr/contact" },
};

/** Zones desservies — reprises de l'ancienne section homepage LocalSection (retirée de l'accueil, contenu conservé ici). */
const ZONES = [
  { city: "Rountzenheim-Auenheim", dept: "67480", note: "Siège atelier" },
  { city: "Haguenau", dept: "67500", note: "25 min" },
  { city: "Strasbourg", dept: "67000", note: "40 min" },
  { city: "Saverne", dept: "67700", note: "45 min" },
  { city: "Sélestat", dept: "67600", note: "55 min" },
  { city: "Colmar", dept: "68000", note: "1h" },
];

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const fullAddress = `${settings.address}, ${settings.postalCode} ${settings.city}, France`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

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
          <p className="text-gray-400 text-lg max-w-xl mb-8">Une question ? Un projet ? Contactez notre atelier.</p>

          {/* Actions principales — toujours visibles en haut de page, cibles tactiles ≥44px. */}
          <div className="flex flex-wrap gap-3">
            <a
              href={`tel:${settings.phone}`}
              className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] text-sm font-bold tracking-widest uppercase text-white transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #1266ea, #0d54c8)", clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}
            >
              <Phone size={16} /> Appeler
            </a>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] text-sm font-bold tracking-widest uppercase text-white border border-white/20 hover:border-brand-500 hover:text-brand-400 transition-colors"
            >
              <Navigation size={16} /> Itinéraire
            </a>
            <Link
              href="/rendez-vous"
              className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] text-sm font-bold tracking-widest uppercase text-white border border-white/20 hover:border-brand-500 hover:text-brand-400 transition-colors"
            >
              <FileText size={16} /> Demander un devis
            </Link>
          </div>
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
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-white text-sm font-medium hover:text-brand-400 transition-colors">
                      {settings.address}<br />{settings.postalCode} {settings.city}
                    </a>
                    <p className="text-gray-500 text-xs mt-1">Alsace, Bas-Rhin (67)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-brand-500 flex-shrink-0" />
                  <a href={`tel:${settings.phone}`} className="text-gray-300 text-sm hover:text-brand-400 transition-colors">{settings.phone}</a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-brand-500 flex-shrink-0" />
                  <a href={`mailto:${settings.email}`} className="text-gray-300 text-sm hover:text-brand-400 transition-colors">{settings.email}</a>
                </div>
                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-brand-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-300 text-sm">{settings.openingHours}</p>
                    <p className="text-gray-500 text-xs mt-0.5">Atelier sur rendez-vous uniquement</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border" style={{ background: "#0f0f0f", borderColor: "#1e1e1e" }}>
              <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-4" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>Zones desservies</h2>
              <div className="grid grid-cols-2 gap-2">
                {ZONES.map((zone) => (
                  <div key={zone.city} className="p-2.5 border border-white/10 bg-white/5">
                    <div className="font-bold text-white text-xs leading-snug">{zone.city}</div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="text-[11px] text-white/30">{zone.dept}</span>
                      <span className="text-[11px] text-brand-400/70 font-medium">{zone.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
