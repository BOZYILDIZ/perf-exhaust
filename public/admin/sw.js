/**
 * Service worker de l'admin PERF'EXHAUST — volontairement minimal et
 * explicite plutôt qu'un plugin de build (voir le rapport de mission : les
 * intégrations Serwist testées ne supportent pas encore Turbopack, bundler
 * par défaut de ce projet). Servi depuis /admin/sw.js, donc sa portée
 * (`scope`) par défaut est /admin/ et en-dessous — jamais le site public.
 *
 * Règle de sécurité absolue : ne met JAMAIS en cache une réponse dynamique
 * (pages admin authentifiées, API, Pennylane, sessions). Seule une liste
 * fixe de ressources statiques (icônes, manifest, page hors-ligne) est
 * précachée à l'installation — aucune logique de cache au moment des
 * requêtes runtime, donc aucune fuite de donnée possible après logout : il
 * n'y a jamais eu de donnée dans le cache pour commencer.
 */

const CACHE_NAME = "perfexhaust-admin-shell-v1";
const PRECACHE_URLS = [
  "/admin/offline",
  "/admin/manifest.webmanifest",
  "/brand/app-icon-192.png",
  "/brand/app-icon-512.png",
  "/brand/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Jamais rien d'autre qu'une requête GET n'est interceptée — toute
  // mutation (POST/PATCH/DELETE) part toujours directement au réseau,
  // sans passer par ce gestionnaire.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Navigation (changement de page) : réseau d'abord, page hors-ligne
  // précachée en dernier recours — jamais une page admin obsolète servie
  // comme si elle était à jour.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/admin/offline"))
    );
    return;
  }

  // Tout le reste (API, données) : réseau uniquement, jamais de cache —
  // seules les ressources listées dans PRECACHE_URLS peuvent être servies
  // depuis le cache, et seulement si le réseau échoue.
  if (PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
  }
});
