// Service worker : réseau d'abord pour le document HTML (toujours la dernière version quand il y
// a internet — sinon la page ouvre une ancienne version qui pointe vers des fichiers JS/CSS
// renommés, qui n'existent plus sur GitHub Pages après un nouveau déploiement, et l'app reste
// blanche), cache d'abord pour le reste (JS/CSS/images : noms hachés par le build, donc leur
// contenu ne change jamais pour un nom donné — sûr à garder tel quel). Permet le mode hors ligne
// ("Ajouter à l'écran d'accueil") : après un premier chargement en ligne, tout reste jouable.
const CACHE = "hockey-gm-v2";

self.addEventListener("install", () => self.skipWaiting());

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
    event.respondWith(
      fetch(request)
        .then((res) => { caches.open(CACHE).then((cache) => cache.put(request, res.clone())); return res; })
        .catch(() => caches.open(CACHE).then((cache) => cache.match(request)))
    );
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
