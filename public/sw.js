// Service worker minimal : cache-avec-repli-réseau (stale-while-revalidate) sur toutes les
// requêtes GET, pour que l'app (chargée une première fois en ligne) reste jouable hors ligne
// ensuite — utile pour "Ajouter à l'écran d'accueil" sur iPhone. Pas de préchargement d'une
// liste de fichiers : les noms des fichiers JS/CSS de build sont hachés et changent à chaque
// déploiement, donc on met en cache au fil des requêtes réelles plutôt qu'une liste figée.
const CACHE = "hockey-gm-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(event.request);
      const network = fetch(event.request)
        .then((res) => { if (res.ok) cache.put(event.request, res.clone()); return res; })
        .catch(() => cached);
      return cached || network;
    })
  );
});
