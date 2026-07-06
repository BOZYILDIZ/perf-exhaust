import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileCTA from "@/components/ui/MobileCTA";
import HideOnAdmin from "@/components/layout/HideOnAdmin";
import { buildOrganizationSchema, websiteSchema } from "@/lib/jsonld";
import { getSiteSettings } from "@/lib/settings-repo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-oswald",
  display: "swap",
});

const SITE_URL = "https://perfexhaust.fr";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PERF'EXHAUST — Échappements sur mesure en Alsace",
    template: "%s | PERF'EXHAUST Alsace",
  },
  description: "Fabrication artisanale d'échappements sur mesure à Rountzenheim-Auenheim en Alsace. Soudure TIG inox 304L/316L, modification sonore, ligne complète ou demi-ligne. Devis gratuit. Partenaire SHIFTECH.",
  keywords: [
    "échappement sur mesure Alsace",
    "soudure inox Bas-Rhin",
    "ligne d'échappement Strasbourg",
    "modification sonore Haguenau",
    "échappement sport Alsace",
    "fabrication échappement Rountzenheim",
    "inox 304L 316L soudure TIG",
    "sonorité personnalisée véhicule",
    "atelier échappement Bas-Rhin 67",
    "PERF EXHAUST",
    "préparateur automobile Alsace",
    "silencieux sur mesure Grand Est",
  ],
  authors: [{ name: "PERF'EXHAUST", url: SITE_URL }],
  creator: "PERF'EXHAUST",
  publisher: "PERF'EXHAUST",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: "PERF'EXHAUST",
    title: "PERF'EXHAUST — Échappements sur mesure en Alsace",
    description: "Fabrication artisanale d'échappements sur mesure en Alsace. Soudure inox, modification sonore, projets personnalisés. Devis gratuit.",
    images: [{ url: "/brand/og-image.jpg", width: 1200, height: 630, alt: "PERF'EXHAUST — Atelier échappements sur mesure Alsace" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PERF'EXHAUST — Échappements sur mesure en Alsace",
    description: "Fabrication artisanale, soudure inox, sonorité personnalisée en Alsace.",
    images: ["/brand/og-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/brand/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/brand/favicon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/brand/favicon-128.png", sizes: "128x128", type: "image/png" },
      { url: "/brand/favicon-256.png", sizes: "256x256", type: "image/png" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  alternates: { canonical: SITE_URL },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSiteSettings();
  return (
    <html lang="fr" className={`${inter.variable} ${oswald.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganizationSchema(settings)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <HideOnAdmin><Header settings={settings} /></HideOnAdmin>
        <main className="flex-1">{children}</main>
        <HideOnAdmin>
          <Footer settings={settings} />
          <MobileCTA />
        </HideOnAdmin>
      </body>
    </html>
  );
}
