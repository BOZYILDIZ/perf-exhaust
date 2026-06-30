import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PERF'EXHAUST — Échappements sur mesure en Alsace",
    template: "%s | PERF'EXHAUST",
  },
  description: "Fabrication artisanale d'échappements sur mesure, soudure inox, modification sonore. Alsace — Rountzenheim-Auenheim. Partenaire SHIFTECH.",
  keywords: [
    "échappement sur mesure",
    "soudure inox",
    "ligne d'échappement",
    "modification sonore",
    "Alsace",
    "Bas-Rhin",
    "Rountzenheim",
    "Strasbourg",
    "PERF EXHAUST",
    "préparateur automobile",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "PERF'EXHAUST",
    title: "PERF'EXHAUST — Échappements sur mesure en Alsace",
    description: "Fabrication artisanale d'échappements sur mesure, soudure inox, modification sonore en Alsace.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
