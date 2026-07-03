"use client";

import { usePathname } from "next/navigation";

/** Masque le chrome public (Header/Footer/MobileCTA) sur les routes /admin. */
export default function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <>{children}</>;
}
