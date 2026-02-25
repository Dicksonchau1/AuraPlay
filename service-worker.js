const CACHE_NAME = 'auraplay-v1.0.1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing v1.0.1...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching core assets');
        // Cache assets individually to avoid failure if one is missing
        return Promise.allSettled(
          ASSETS_TO_CACHE.map(url =>
            cache.add(url).catch(err => {
              console.warn('[Service Worker] Failed to cache:', url, err);
              return Promise.resolve(); // Don't fail installation if one asset fails
            })
          )
        );
      })
      .then(() => {
        console.log('[Service Worker] Installation complete, activating...');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Network first for HTML, cache first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests except CDNs
  if (url.origin !== self.location.origin) {
    // Allow CDN resources to pass through
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Strategy: Network first for HTML, cache first for other assets
  const isHTMLRequest = request.headers.get('accept')?.includes('text/html') ||
                        url.pathname.endsWith('.html') ||
                        url.pathname === '/' ||
                        url.pathname === './';

  if (isHTMLRequest) {
    // Network first for HTML to always get latest version
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache the new version
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request).then(cached => {
            if (cached) {
              return cached;
            }
            // Return offline page if nothing in cache
            return new Response(
              '<html><body><h1>Offline</h1><p>Please check your connection and try again.</p></body></html>',
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({ 'Content-Type': 'text/html' })
              }
            );
          });
        })
    );
  } else {
    // Cache first for assets (CSS, JS, images, etc.)
    event.respondWith(
      caches.match(request)
        .then(cached => {
          if (cached) {
            return cached;
          }
          // Not in cache, fetch from network
          return fetch(request).then(response => {
            // Cache if successful
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
        .catch(() => {
          // Network failed, return generic offline response
          return new Response('Resource not available offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        })
    );
  }
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
