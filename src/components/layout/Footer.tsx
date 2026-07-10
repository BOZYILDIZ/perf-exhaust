import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin, ExternalLink } from "lucide-react";
import type { SiteSettingsData } from "@/lib/settings-repo";

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

const services = [
  "Ligne complète sur mesure",
  "Demi-ligne inox",
  "Silencieux personnalisé",
  "Soudure inox / métal / alu",
  "Réparation échappement",
  "Modification sonore",
];

const pages = [
  { href: "/realisations", label: "Réalisations" },
  { href: "/services", label: "Services" },
  { href: "/a-propos", label: "À propos" },
  { href: "/rendez-vous", label: "Demande de devis" },
  { href: "/contact", label: "Contact" },
  { href: "/mentions-legales", label: "Mentions légales" },
];

export default function Footer({ settings }: { settings: SiteSettingsData }) {
  return (
    <footer style={{ background: "#050505", borderTop: "1px solid #1a1a1a" }}>
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <Image
                src="/brand/logo-icon.png"
                alt="Logo PERF'EXHAUST"
                width={58}
                height={40}
                className="h-10 w-auto"
              />
              <div
                className="text-white font-black text-xl"
                style={{ fontFamily: "var(--font-oswald), sans-serif", letterSpacing: "0.05em" }}
              >
                PERF&apos;EXHAUST
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Fabrication artisanale d&apos;échappements sur mesure en Alsace. Soudure inox, modification sonore, projets personnalisés.
            </p>
            <div className="flex items-center gap-3">
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-sm border border-gray-700 text-gray-400 hover:text-brand-400 hover:border-brand-400 transition-all"
                aria-label="Instagram PERF'EXHAUST"
              >
                <InstagramIcon size={16} />
              </a>
              <a
                href={settings.tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-sm border border-gray-700 text-gray-400 hover:text-brand-400 hover:border-brand-400 transition-all"
                aria-label="TikTok PERF'EXHAUST"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-bold text-sm tracking-widest uppercase mb-5" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
              Services
            </h3>
            <ul className="space-y-2">
              {services.map((s) => (
                <li key={s}>
                  <Link href="/services" className="text-gray-400 text-sm hover:text-brand-400 transition-colors flex items-center gap-2">
                    <span className="w-1 h-1 bg-brand-500 rounded-full flex-shrink-0" />
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-white font-bold text-sm tracking-widest uppercase mb-5" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
              Navigation
            </h3>
            <ul className="space-y-2">
              {pages.map((p) => (
                <li key={p.href}>
                  <Link href={p.href} className="text-gray-400 text-sm hover:text-brand-400 transition-colors flex items-center gap-2">
                    <span className="w-1 h-1 bg-brand-500 rounded-full flex-shrink-0" />
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold text-sm tracking-widest uppercase mb-5" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
              Contact
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-brand-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-300 text-sm font-medium">{settings.city}</p>
                  <p className="text-gray-500 text-xs">Alsace, Bas-Rhin (67)</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-brand-500 flex-shrink-0" />
                <a href={`tel:${settings.phone}`} className="text-gray-300 text-sm hover:text-brand-400 transition-colors">
                  {settings.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-brand-500 flex-shrink-0" />
                <a href={`mailto:${settings.email}`} className="text-gray-300 text-sm hover:text-brand-400 transition-colors">
                  {settings.email}
                </a>
              </li>
            </ul>

            {/* Partner badge */}
            <a
              href={settings.shiftechUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 p-3 border border-gray-800 rounded-sm block hover:border-gray-600 transition-colors"
            >
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Partenaire officiel</p>
              <div className="flex items-center gap-2.5">
                <Image
                  src="/partners/shiftech/shiftech-icon.png"
                  alt="Logo SHIFTECH"
                  width={24}
                  height={24}
                  className="w-6 h-6 flex-shrink-0"
                  style={{ borderRadius: "2px" }}
                />
                <span className="text-white font-bold text-sm" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>SHIFTECH Strasbourg</span>
                <ExternalLink size={12} className="text-gray-500" />
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid #1a1a1a" }}>
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-gray-600 text-xs">
            © {new Date().getFullYear()}{" "}{settings.businessName} — Tous droits réservés.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/mentions-legales" className="text-gray-500 text-xs hover:text-gray-300 transition-colors">
              Mentions légales
            </Link>
            <Link href="/mentions-legales#confidentialite" className="text-gray-500 text-xs hover:text-gray-300 transition-colors">
              Confidentialité
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-gray-600 text-xs">Atelier ouvert sur RDV</span>
          </div>
        </div>
      </div>

      {/* Signature */}
      <div style={{ borderTop: "1px solid #141414" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 text-center">
          <p className="text-[11px] text-gray-600">
            Site conçu et développé par{" "}
            <a
              href="https://www.bicer.fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-brand-500 underline underline-offset-2 transition-colors duration-300"
            >
              Nevora
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
