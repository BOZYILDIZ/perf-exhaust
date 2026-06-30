import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { organizationSchema, websiteSchema } from "@/lib/jsonld";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_URL = "https://perfexhaust.vercel.app";

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
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "PERF'EXHAUST — Atelier échappements sur mesure Alsace" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PERF'EXHAUST — Échappements sur mesure en Alsace",
    description: "Fabrication artisanale, soudure inox, sonorité personnalisée en Alsace.",
    images: ["/og-image.jpg"],
  },
  alternates: { canonical: SITE_URL },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
