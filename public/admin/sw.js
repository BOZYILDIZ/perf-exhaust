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

/**
 * Notifications push (nouvelle demande de devis) — le payload JSON
 * (title/body/url/data) n'est JAMAIS écrit dans le Cache Storage : il ne
 * vit que dans la mémoire de cet event handler, affiché puis oublié,
 * cohérent avec la règle absolue ci-dessus (aucune donnée dynamique en
 * cache). Aucun son personnalisé n'est configuré — le comportement par
 * défaut du navigateur/OS s'applique.
 */
self.addEventListener("push", (event) => {
  let payload = { title: "PERF'EXHAUST Admin", body: "Nouvelle notification.", url: "/admin", data: {} };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // Payload non-JSON ou absent — on garde le message générique ci-dessus
    // plutôt que de faire échouer l'affichage de la notification.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/brand/app-icon-192.png",
      badge: "/brand/app-icon-192.png",
      data: { url: payload.url, ...payload.data },
    })
  );
});

/** Clic sur la notification : réutilise une fenêtre admin déjà ouverte (focus + navigation) au lieu d'en empiler une nouvelle, sinon en ouvre une. */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : "/admin";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const adminClient = clients.find((c) => new URL(c.url).pathname.startsWith("/admin"));
      if (adminClient) {
        return adminClient.focus().then(() => {
          if ("navigate" in adminClient) return adminClient.navigate(targetUrl);
        });
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
