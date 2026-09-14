/* Service worker: tiene l'app avviabile anche senza linea.
   I dati (anagrafica, coda di invio, token) stanno in localStorage, non qui.

   Il nome della cache porta il numero di versione: cambiandolo, al primo
   avvio dopo un aggiornamento la vecchia cache viene buttata e il tablet
   riparte pulito. Se modifichi index.html ricordati di alzarlo. */

const CACHE = 'rapportino-carichi-v3';
const FILE = [
  './',
  './index.html',
  './config.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(FILE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(chiavi => Promise.all(chiavi.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;

  // Mai intercettare le chiamate al backend Apps Script.
  if (req.method !== 'GET' || req.url.indexOf('script.google') !== -1 || req.url.indexOf('googleusercontent') !== -1) {
    return;
  }

  // Solo le risorse dell'app stessa.
  if (new URL(req.url).origin !== self.location.origin) return;

  // Rete prima, cache come rete di sicurezza: cosi' gli aggiornamenti arrivano subito.
  e.respondWith(
    fetch(req)
      .then(risposta => {
        const copia = risposta.clone();
        caches.open(CACHE).then(c => c.put(req, copia)).catch(() => {});
        return risposta;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
