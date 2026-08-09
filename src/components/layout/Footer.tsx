import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin, ExternalLink, Star } from "lucide-react";
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

function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09A6.9 6.9 0 0 1 5.44 12c0-.73.13-1.43.36-2.09V7.07H2.18A11.9 11.9 0 0 0 1 12c0 1.93.46 3.75 1.18 5.09z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.91l3.66 2.84c.87-2.6 3.3-4.37 6.16-4.37z" />
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

            {/* Avis Google — n'apparaît qu'une fois l'URL de la fiche Google Business
                renseignée dans /admin/settings (googleReviewsUrl) : jamais de lien
                inventé ou de faux avis recopiés manuellement. */}
            {settings.googleReviewsUrl && (
              <a
                href={settings.googleReviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2.5 px-4 py-2.5 min-h-[44px] border border-gray-700 rounded-sm hover:border-brand-400 transition-colors"
              >
                <GoogleIcon size={16} />
                <span className="flex items-center gap-1" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={11} className="text-brand-400 fill-brand-400" />
                  ))}
                </span>
                <span className="text-gray-300 text-sm font-medium">Voir nos avis Google</span>
                <ExternalLink size={12} className="text-gray-500" />
              </a>
            )}
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
