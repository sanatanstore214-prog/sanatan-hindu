/* Sanatan Hindu PWA — offline cache.
   Content badalne par CACHE version badha do (v1 -> v2) taaki update aaye. */
var CACHE = "sanatan-v1";
var ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./data/content.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/favicon-64.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }));
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  // Ads/external requests ko network par jaane do
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        // Offline + page request -> home dikhao
        if (req.mode === "navigate") return caches.match("./index.html");
      });
    })
  );
});
