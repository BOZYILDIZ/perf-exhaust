"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Car, Wrench, FileQuestion, MessageSquareText, Settings, ExternalLink, LogOut } from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/realisations", label: "Réalisations", icon: Car, exact: false },
  { href: "/admin/devis", label: "Devis", icon: MessageSquareText, exact: false, badgeKey: "newQuotesCount" as const },
  { href: "/admin/services", label: "Services", icon: Wrench, exact: false },
  { href: "/admin/faq", label: "FAQ", icon: FileQuestion, exact: false },
  { href: "/admin/settings", label: "Paramètres", icon: Settings, exact: false },
];

export default function AdminSidebar({ newQuotesCount = 0 }: { newQuotesCount?: number }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <aside
      className="w-16 sm:w-56 flex-shrink-0 flex flex-col border-r"
      style={{ background: "#0d0d0d", borderColor: "#1e1e1e" }}
    >
      <Link href="/admin" className="flex items-center gap-3 px-3 sm:px-5 py-5 border-b" style={{ borderColor: "#1e1e1e" }}>
        <Image src="/brand/logo-icon.png" alt="Logo PERF'EXHAUST" width={36} height={25} className="h-7 w-auto" />
        <span className="hidden sm:block text-white font-bold text-sm tracking-wider" style={{ fontFamily: "var(--font-oswald), sans-serif" }}>
          ADMIN
        </span>
      </Link>

      <nav className="flex-1 py-4 space-y-1 px-2 sm:px-3">
        {links.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
          const badge = l.badgeKey === "newQuotesCount" ? newQuotesCount : 0;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={[
                "flex items-center gap-3 px-3 py-2.5 text-sm rounded-sm transition-colors relative",
                active ? "bg-brand-500/15 text-brand-400 font-bold" : "text-gray-400 hover:text-white hover:bg-white/5",
              ].join(" ")}
            >
              <span className="relative flex-shrink-0">
                <l.icon size={17} />
                {badge > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 sm:hidden flex items-center justify-center w-3.5 h-3.5 rounded-full bg-brand-500 text-white text-[9px] font-bold"
                    aria-hidden="true"
                  />
                )}
              </span>
              <span className="hidden sm:flex items-center gap-2 flex-1">
                {l.label}
                {badge > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand-500 text-white text-[10px] font-bold">
                    {badge}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="px-2 sm:px-3 pb-4 space-y-1 border-t pt-4" style={{ borderColor: "#1e1e1e" }}>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-sm transition-colors"
        >
          <ExternalLink size={17} className="flex-shrink-0" />
          <span className="hidden sm:block">Voir le site</span>
        </a>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/5 rounded-sm transition-colors"
        >
          <LogOut size={17} className="flex-shrink-0" />
          <span className="hidden sm:block">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
