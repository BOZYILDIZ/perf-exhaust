import { NextResponse } from "next/server";

/**
 * Manifest PWA — volontairement scoppé à /admin uniquement (`scope` et
 * `start_url`) : le site public reste un site classique, jamais installable
 * en tant qu'app. Servi comme une route normale (pas la convention spéciale
 * `app/manifest.ts`, qui ne peut vivre qu'à la racine de `app/` et
 * s'appliquerait donc à tout le site) — seule la mise en page /admin y fait
 * référence via `metadata.manifest`, jamais le layout racine public.
 */
export function GET() {
  return NextResponse.json(
    {
      name: "PERF'EXHAUST Admin",
      short_name: "PERF Admin",
      description: "Panel d'administration PERF'EXHAUST — agenda, devis, CRM.",
      start_url: "/admin",
      scope: "/admin",
      display: "standalone",
      background_color: "#0a0a0a",
      theme_color: "#1266eb",
      orientation: "any",
      lang: "fr",
      icons: [
        { src: "/brand/app-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/brand/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } }
  );
}
