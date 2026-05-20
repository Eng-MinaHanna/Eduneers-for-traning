// Eduneers Service Worker - PWA Support
const CACHE_NAME = 'eduneers-v1.0.11';
const STATIC_CACHE = 'eduneers-static-v1.0.11';
const DYNAMIC_CACHE = 'eduneers-dynamic-v1.0.11';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/grades.html',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://unpkg.com/html5-qrcode',
  'https://accounts.google.com/gsi/client',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) return;

  // Handle local static assets with a Network-First strategy (protect against stale PWA cache)
  const url = new URL(event.request.url);
  const isLocalAsset = url.origin === self.location.origin && 
                       (url.pathname.endsWith('.css') || 
                        url.pathname.endsWith('.js') || 
                        url.pathname.endsWith('.html') ||
                        url.pathname === '/');

  if (isLocalAsset) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // Handle API requests differently (network first, then cache)
  if (event.request.url.includes('script.google.com')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response and cache it
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Return cached version if network fails
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For static assets: cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then((response) => {
            // Don't cache if not successful
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone and cache
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
            
            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Message event - handle messages from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAN_CACHE') {
    caches.open(DYNAMIC_CACHE).then((cache) => {
      cache.keys().then((keys) => {
        keys.forEach((key) => {
          if (key.url.includes('script.google.com')) {
            cache.delete(key);
          }
        });
      });
    });
  }
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncAttendanceData());
  }
});

function syncAttendanceData() {
  // This would sync offline attendance data when back online
  return new Promise((resolve, reject) => {
    // Implementation would go here
    resolve();
  });
}
