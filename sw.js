/* Service Worker — Hébreu Biblique
   Permet à l'application de se recharger même sans connexion, une fois
   qu'elle a déjà été ouverte au moins une fois sur cet appareil.
   Ne touche jamais aux requêtes POST (synchronisation avec le Google
   Sheet) : celles-ci passent directement au réseau, et l'application
   elle-même gère leur échec (mode hors-ligne, sauvegarde locale).
   À placer dans le MÊME dossier que index.html sur GitHub Pages. */

const CACHE_NAME = 'hb-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(['./', './index.html']).catch(() => {
        /* la page n'est peut-être pas encore accessible au tout premier
           chargement — sans conséquence, elle sera mise en cache dès la
           première visite réussie via le gestionnaire "fetch" ci-dessous */
      })
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ne jamais intercepter les requêtes vers le Google Apps Script
  // (synchronisation des comptes/progrès) ni aucune requête POST —
  // l'application doit voir leur échec réseau pour activer son propre
  // mode hors-ligne.
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('script.google.com')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
