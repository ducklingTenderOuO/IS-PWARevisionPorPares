const CACHE_NAME = 'revista-academica-v2';

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => 
            cache.addAll(['/', '/portal-autor.html', '/manifest.json'])
        )
    );
});

// Background Sync
self.addEventListener('sync', event => {
    if (event.tag === 'sync-articulos') {
        event.waitUntil(
            self.clients.matchAll().then(clients => {
                clients.forEach(client => 
                    client.postMessage({ type: 'TRIGGER_SYNC' })
                );
            })
        );
    }
});

// Manejar mensajes
self.addEventListener('message', event => {
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});