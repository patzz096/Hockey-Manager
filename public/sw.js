// Service worker PWA ("Ajouter à l'écran d'accueil") — précache complet et atomique par version.
//
// Bug corrigé ici : l'ancienne version mettait en cache le document HTML dès qu'il arrivait du
// réseau (stratégie « réseau d'abord »), AVANT que les fichiers JS/CSS qu'il référence (noms
// hachés, différents à chaque déploiement) soient eux-mêmes en cache. Si la connexion tombait
// entre les deux (cas réel : ouverture rapide de l'app juste avant de passer en mode avion), le
// document mis en cache pointait vers un bundle jamais mis en cache — page blanche hors ligne,
// même si une version précédente, elle, était complète en cache.
//
// Ici, CACHE_VERSION et PRECACHE_URLS sont injectés par scripts/sw-manifest.mjs après le build
// (voir build:pages) : la liste exacte des fichiers d'UNE build donnée. `install` les met tous en
// cache en une seule opération atomique (`cache.addAll`) — soit tout réussit et cette version
// devient active, soit un seul fichier échoue (coupure réseau en plein téléchargement) et
// l'installation entière échoue sans toucher au service worker/cache déjà actif, qui reste donc
// pleinement fonctionnel hors ligne. Le nom du cache inclut la version : chaque déploiement vit
// dans son propre cache, jamais de mélange partiel entre deux versions.
const CACHE_VERSION = "__CACHE_VERSION__";
const PRECACHE_URLS = __PRECACHE_URLS__;
const CACHE = `hockey-gm-${CACHE_VERSION}`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

const isDocument = (req) => req.mode === "navigate" || req.destination === "document" || req.url.endsWith("/") || req.url.endsWith(".html");

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const { request } = event;
  if (isDocument(request)) {
    // Réseau d'abord (dernière version quand il y a internet) ; repli sur le précache, complet
    // et cohérent par construction, donc toujours jouable hors ligne.
    event.respondWith(fetch(request).catch(() => caches.open(CACHE).then((cache) => cache.match(request))));
    return;
  }
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const res = await fetch(request);
      if (res.ok) cache.put(request, res.clone());
      return res;
    })
  );
});
