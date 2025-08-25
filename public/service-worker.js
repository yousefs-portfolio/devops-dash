const CACHE_NAME = 'devops-dash-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/offline.html'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Handle API requests differently
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Clone the response before caching
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                })
                .catch(() => {
                    // Return cached API response if available
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Network first, fallback to cache strategy for other requests
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Check if valid response
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Clone the response
                const responseToCache = response.clone();

                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            })
            .catch(() => {
                // Fallback to cache
                return caches.match(event.request).then((response) => {
                    if (response) {
                        return response;
                    }

                    // Return offline page for navigation requests
                    if (event.request.mode === 'navigate') {
                        return caches.match('/offline.html');
                    }
                });
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-metrics') {
        event.waitUntil(syncMetrics());
    }
});

async function syncMetrics() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const requests = await cache.keys();

        const pendingRequests = requests.filter(req =>
            req.url.includes('/api/metrics') && req.method === 'POST'
        );

        for (const request of pendingRequests) {
            try {
                await fetch(request);
                await cache.delete(request);
            } catch (error) {
                console.error('Failed to sync:', error);
            }
        }
    } catch (error) {
        console.error('Sync failed:', error);
    }
}

// Push notifications
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'New alert from DevOps Dashboard',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'view',
                title: 'View Alert',
                icon: '/icon-72x72.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/icon-72x72.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('DevOps Alert', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/alerts')
        );
    }
});

// Periodic background sync for metrics
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'fetch-metrics') {
        event.waitUntil(fetchLatestMetrics());
    }
});

async function fetchLatestMetrics() {
    try {
        const response = await fetch('/api/metrics/latest');
        const data = await response.json();

        // Cache the latest metrics
        const cache = await caches.open(CACHE_NAME);
        await cache.put('/api/metrics/latest', new Response(JSON.stringify(data)));

        // Check for critical alerts
        if (data.criticalAlerts > 0) {
            await self.registration.showNotification('Critical Alert', {
                body: `${data.criticalAlerts} critical alerts require attention`,
                icon: '/icon-192x192.png',
                badge: '/icon-72x72.png',
                tag: 'critical-alert',
                requireInteraction: true
            });
        }
    } catch (error) {
        console.error('Failed to fetch metrics:', error);
    }
}