"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Car, ExternalLink, LogOut } from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/realisations", label: "Réalisations", icon: Car, exact: false },
];

export default function AdminSidebar() {
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
        <span className="hidden sm:block text-white font-bold text-sm tracking-wider" style={{ fontFamily: "Oswald, sans-serif" }}>
          ADMIN
        </span>
      </Link>

      <nav className="flex-1 py-4 space-y-1 px-2 sm:px-3">
        {links.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={[
                "flex items-center gap-3 px-3 py-2.5 text-sm rounded-sm transition-colors",
                active ? "bg-brand-500/15 text-brand-400 font-bold" : "text-gray-400 hover:text-white hover:bg-white/5",
              ].join(" ")}
            >
              <l.icon size={17} className="flex-shrink-0" />
              <span className="hidden sm:block">{l.label}</span>
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
