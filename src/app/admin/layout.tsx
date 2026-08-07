import type { Metadata, Viewport } from "next";

// PWA installable — posée ici (racine /admin, englobant /admin/login ET le
// panel authentifié) plutôt que uniquement sur le panel : l'installation
// doit être proposable dès l'écran de connexion, pas seulement une fois
// authentifié. Remplace le manifest public (/site.webmanifest, voir
// app/layout.tsx) pour tout ce qui vit sous /admin — jamais l'inverse, le
// site public ne référence jamais ce manifest admin.
export const metadata: Metadata = {
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: {
    title: "PERF Admin",
    statusBarStyle: "black-translucent",
  },
  icons: { apple: "/brand/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#1266eb",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
