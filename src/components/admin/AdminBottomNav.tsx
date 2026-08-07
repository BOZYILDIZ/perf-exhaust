"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, MessageSquareText, CalendarDays, Car, MoreHorizontal, X, Wrench, FileQuestion, Settings, ExternalLink, LogOut } from "lucide-react";

const PRIMARY = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/agenda", label: "Agenda", icon: CalendarDays, exact: false },
  { href: "/admin/devis", label: "Devis", icon: MessageSquareText, exact: false, badgeKey: "newQuotesCount" as const },
  { href: "/admin/realisations", label: "Réalisations", icon: Car, exact: false },
];

const MORE = [
  { href: "/admin/services", label: "Services", icon: Wrench },
  { href: "/admin/faq", label: "FAQ", icon: FileQuestion },
  { href: "/admin/settings", label: "Paramètres", icon: Settings },
];

/**
 * Navigation mobile dédiée — la sidebar desktop (icônes + libellés) devient
 * peu adaptée sous 640px (prend une largeur fixe permanente sur un écran déjà
 * étroit) ; remplacée ici par une barre inférieure fixe, pattern standard
 * des apps mobiles/PWA installées. Cachée à partir de `sm` (voir
 * AdminSidebar, qui prend le relais). Cibles tactiles ≥44px.
 */
export default function AdminBottomNav({ newQuotesCount = 0 }: { newQuotesCount?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const moreActive = MORE.some((l) => pathname.startsWith(l.href));

  return (
    <>
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-30 flex items-stretch border-t"
        style={{ background: "#0d0d0d", borderColor: "#1e1e1e", paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Navigation principale"
      >
        {PRIMARY.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
          const badge = l.badgeKey === "newQuotesCount" ? newQuotesCount : 0;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] relative ${active ? "text-brand-400" : "text-gray-500"}`}
            >
              <span className="relative">
                <l.icon size={20} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-brand-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider">{l.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] ${moreActive ? "text-brand-400" : "text-gray-500"}`}
          aria-haspopup="true"
          aria-expanded={moreOpen}
        >
          <MoreHorizontal size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Plus</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="sm:hidden fixed inset-0 z-40 flex flex-col justify-end">
          <button type="button" aria-label="Fermer" onClick={() => setMoreOpen(false)} className="absolute inset-0 bg-black/70" />
          <div
            className="relative border-t rounded-t-2xl p-4"
            style={{ background: "#0d0d0d", borderColor: "#1e1e1e", paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-white font-bold text-xs uppercase tracking-widest">Plus</span>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label="Fermer" className="text-gray-500 hover:text-white p-2 -m-2">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-1">
              {MORE.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 min-h-[44px] text-sm text-gray-300 hover:bg-white/5 rounded-sm"
                >
                  <l.icon size={18} /> {l.label}
                </Link>
              ))}
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-3 min-h-[44px] text-sm text-gray-300 hover:bg-white/5 rounded-sm"
              >
                <ExternalLink size={18} /> Voir le site
              </a>
              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-3 min-h-[44px] text-sm text-red-400 hover:bg-red-500/5 rounded-sm"
              >
                <LogOut size={18} /> Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
