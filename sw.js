// REPS Service Worker — v1
const CACHE = 'reps-v1';

// Files to cache for offline use
const PRECACHE = [
  './REPS_workout_app_v5.html',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// Install: cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => {
      // Cache the app shell; CDN assets cached on first network hit
      return cache.add('./REPS_workout_app_v5.html').catch(() => {});
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for app shell, network-first for everything else
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always go to network for YouTube, Google, CDN video requests
  if (url.hostname.includes('youtube') ||
      url.hostname.includes('googlevideo') ||
      url.hostname.includes('instagram') ||
      url.hostname.includes('facebook') ||
      url.hostname.includes('tiktok') ||
      url.hostname.includes('vimeo')) {
    return; // let browser handle media normally
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful GET responses for static assets
        if (event.request.method === 'GET' && response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback — serve app shell for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./REPS_workout_app_v5.html');
        }
      });
    })
  );
});
