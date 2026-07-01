"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, Phone } from "lucide-react";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/realisations", label: "Réalisations" },
  { href: "/services", label: "Services" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div
            className="w-10 h-10 flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #1266ea, #0d54c8)",
              clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
            }}
          >
            <span className="text-white font-black text-sm" style={{ fontFamily: "Oswald, sans-serif" }}>PE</span>
          </div>
          <div>
            <div
              className="text-white font-black text-xl leading-none group-hover:text-brand-400 transition-colors"
              style={{ fontFamily: "Oswald, sans-serif", letterSpacing: "0.05em" }}
            >
              PERF&apos;EXHAUST
            </div>
            <div className="text-brand-500 text-xs font-medium tracking-widest uppercase">
              Alsace
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium tracking-wider uppercase text-gray-300 hover:text-brand-400 transition-colors relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-500 group-hover:w-full transition-all duration-300" />
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden lg:flex items-center gap-4">
          <a
            href="tel:+33636523058"
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
            Devis gratuit
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="lg:hidden text-gray-300 hover:text-brand-400 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="lg:hidden"
          style={{ background: "rgba(8,8,8,0.98)", borderTop: "1px solid rgba(18,102,234,0.2)" }}
        >
          <nav className="flex flex-col px-6 py-4 gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium tracking-wider uppercase text-gray-300 hover:text-brand-400 transition-colors py-2 border-b border-gray-800"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/rendez-vous"
              className="mt-2 text-center text-sm font-bold tracking-wider uppercase text-white px-5 py-3"
              style={{
                background: "linear-gradient(135deg, #1266ea, #0d54c8)",
                clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
              }}
              onClick={() => setMenuOpen(false)}
            >
              Devis gratuit
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
