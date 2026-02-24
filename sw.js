const CACHE_NAME = 'revista-academica-v1';
const urlsToCache = [
  '/',
  '/portal-autor.html',
  '/manifest.json'
];

// Instalación
self.addEventListener('install', event => {
  event.waitUntil(
      caches.open(CACHE_NAME)
          .then(cache => {
            console.log('✅ Cache abierto');
            return cache.addAll(urlsToCache);
          })
  );
});

// Activación - limpiar caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
            cacheNames.map(cacheName => {
              if (cacheName !== CACHE_NAME) {
                console.log('🗑️ Eliminando cache viejo:', cacheName);
                return caches.delete(cacheName);
              }
            })
        );
      })
  );
});

// Interceptar peticiones
self.addEventListener('fetch', event => {
  event.respondWith(
      caches.match(event.request)
          .then(response => {
            // Si está en cache, devolverlo
            if (response) {
              return response;
            }

            // Si no, buscar en red
            return fetch(event.request)
                .then(response => {
                  // Verificar si es válido
                  if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                  }

                  // Clonar y guardar en cache
                  const responseToCache = response.clone();
                  caches.open(CACHE_NAME)
                      .then(cache => {
                        cache.put(event.request, responseToCache);
                      });

                  return response;
                })
                .catch(() => {
                  // Si falla la red y es página, mostrar offline
                  if (event.request.mode === 'navigate') {
                    return caches.match('/portal-autor.html');
                  }
                });
          })
  );
});