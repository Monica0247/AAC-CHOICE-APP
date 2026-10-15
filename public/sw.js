// Cache-first for Cloudinary card media only, so a group already opened
// once while online keeps working through a dropped connection mid-session.
// Everything else (app shell, JS/CSS, API calls) falls through to the
// network untouched.
const CACHE_NAME = "aac-media-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (!event.request.url.includes("res.cloudinary.com")) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;

      const response = await fetch(event.request);
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    })
  );
});
