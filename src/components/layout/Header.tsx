"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X, Phone } from "lucide-react";
import type { SiteSettingsData } from "@/lib/settings-repo";
import ShiftechPartnerBadge from "@/components/ui/ShiftechPartnerBadge";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/services", label: "Services" },
  { href: "/realisations", label: "Réalisations" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

/** Page courante active dans la nav : exact pour "/", préfixe pour les autres (couvre /realisations/[slug]). */
function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header({ settings }: { settings: SiteSettingsData }) {
  const pathname = usePathname();
  // `menuOpen` est dérivé (pathname au moment de l'ouverture, comparé au pathname
  // courant) plutôt que d'être un booléen resynchronisé par un effet à chaque
  // navigation : un changement de route ferme donc le menu automatiquement au
  // rendu, sans jamais appeler setState depuis un effet (voir alternative
  // rejetée ci-dessous — react-hooks/set-state-in-effect).
  const [openedAtPathname, setOpenedAtPathname] = useState<string | null>(null);
  const menuOpen = openedAtPathname !== null && openedAtPathname === pathname;
  const setMenuOpen = (open: boolean) => setOpenedAtPathname(open ? pathname : null);
  const [scrolled, setScrolled] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Comportement standard d'un menu mobile plein écran : bloque le scroll de la
  // page en arrière-plan, ferme sur Échap, place le focus sur le premier lien à
  // l'ouverture et le restitue au bouton bascule à la fermeture (jamais perdu).
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const toggleButton = menuToggleRef.current;
    document.body.style.overflow = "hidden";
    firstMobileLinkRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      // Ferme directement via le setter stable (setOpenedAtPathname) plutôt que
      // le wrapper setMenuOpen, recréé à chaque rendu — évite une dépendance
      // d'effet instable tout en gardant le même effet (menu fermé).
      if (e.key === "Escape") setOpenedAtPathname(null);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      toggleButton?.focus();
    };
  }, [menuOpen]);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? "rgba(8,8,8,0.97)"
          : "rgba(8,8,8,0.7)",
        backdropFilter: "blur(12px)",
        borderBottom: scrolled ? "1px solid rgba(18,102,234,0.15)" : "1px solid transparent",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo + partenaire SHIFTECH (regroupés pour ne pas déséquilibrer le
            justify-between à 3 blocs : logo, nav, CTA) */}
        <div className="flex items-center flex-shrink-0">
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
            <Image
              src="/brand/logo-icon.png"
              alt="Logo PERF'EXHAUST"
              width={58}
              height={40}
              priority
              className="h-10 w-auto"
            />
            <div>
              <div
                className="text-white font-black text-xl leading-none group-hover:text-brand-400 transition-colors"
                style={{ fontFamily: "var(--font-oswald), sans-serif", letterSpacing: "0.05em" }}
              >
                PERF&apos;EXHAUST
              </div>
              <div className="text-brand-500 text-xs font-medium tracking-widest uppercase">
                Alsace
              </div>
            </div>
          </Link>
          {settings.shiftechUrl && (
            <ShiftechPartnerBadge url={settings.shiftechUrl} variant="navbar" />
          )}
        </div>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-6" aria-label="Navigation principale">
          {navLinks.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`text-sm font-medium tracking-wider uppercase transition-colors relative group ${
                  active ? "text-brand-400" : "text-gray-300 hover:text-brand-400"
                }`}
              >
                {link.label}
                <span
                  className={`absolute -bottom-1 left-0 h-0.5 bg-brand-500 transition-all duration-300 ${
                    active ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* CTA */}
        <div className="hidden lg:flex items-center gap-4">
          <a
            href={`tel:${settings.phone}`}
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-brand-400 transition-colors"
          >
            <Phone size={14} />
            <span className="font-medium">Appeler</span>
          </a>
          <Link
            href="/rendez-vous"
            className="text-sm font-bold tracking-wider uppercase text-white px-5 py-2.5 transition-all hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #1266ea, #0d54c8)",
              clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
            }}
          >
            Demander un devis
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          ref={menuToggleRef}
          className="lg:hidden p-2.5 -mr-2 text-gray-300 hover:text-brand-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Menu mobile — reste dans le flux normal du header (pas de position fixe avec
          décalage codé en dur) : robuste face à tout changement futur de hauteur du
          header. Le scroll de la page derrière est bloqué via document.body ci-dessus,
          pas par un positionnement plein écran. */}
      {menuOpen && (
        <div
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navigation"
          // h-[100dvh] (pas max-h) : remplit toujours tout le reste de l'écran quand
          // ouvert — sinon le contenu de la page (et la barre flottante MobileCTA,
          // fixed en bas de viewport) reste visible sous un menu plus court que
          // l'écran. dvh plutôt que vh : suit la barre d'adresse mobile qui
          // rétrécit/grandit au scroll (Safari iOS notamment).
          className="lg:hidden h-[calc(100dvh-76px)] overflow-y-auto motion-safe:animate-[fadeIn_0.15s_ease-out]"
          style={{ background: "rgba(8,8,8,0.98)", borderTop: "1px solid rgba(18,102,234,0.2)" }}
        >
          <nav className="flex flex-col px-6 py-4" aria-label="Navigation mobile">
          {navLinks.map((link, i) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                ref={i === 0 ? firstMobileLinkRef : undefined}
                aria-current={active ? "page" : undefined}
                className={`text-sm font-medium tracking-wider uppercase transition-colors py-3 min-h-[44px] flex items-center border-b border-gray-800 ${
                  active ? "text-brand-400" : "text-gray-300 hover:text-brand-400"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/rendez-vous"
            className="mt-4 text-center text-sm font-bold tracking-wider uppercase text-white px-5 py-3.5 min-h-[44px] flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #1266ea, #0d54c8)",
              clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
            }}
            onClick={() => setMenuOpen(false)}
          >
            Demander un devis
          </Link>
          {settings.shiftechUrl && (
            <ShiftechPartnerBadge
              url={settings.shiftechUrl}
              variant="menu"
              onClick={() => setMenuOpen(false)}
            />
          )}
          <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
          </nav>
        </div>
      )}
    </header>
  );
}
