/**
 * RevisionAR · Service Worker v2
 * Cache-first para assets estáticos, Network-first para datos
 */

// En producción, silenciar logs del SW para no contaminar la consola del usuario
const isDev = false; // cambiar a true para depuración
const swLog  = isDev ? console.log.bind(console)  : () => {};
const swWarn = isDev ? console.warn.bind(console) : () => {};

const CACHE_NAME   = 'revisionAR-v2';
const CACHE_STATIC = 'revisionAR-static-v2';
const CACHE_DATA   = 'revisionAR-data-v2';

// Archivos que se cachean al instalar (shell estático de la app)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/portal-editor.html',
  '/portal-revisor.html',
  '/portal-autor.html',
  '/manifest.json',
  '/css/shared.css',
  '/js/db.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ============ INSTALL ============
self.addEventListener('install', event => {
  swLog('[SW] Instalando…');
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache => {
      return cache.addAll(STATIC_ASSETS.map(url => {
        return new Request(url, { cache: 'reload' });
      })).catch(err => {
        swWarn('[SW] Algunos assets no cachearon (normal en desarrollo):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ============ ACTIVATE ============
self.addEventListener('activate', event => {
  swLog('[SW] Activando…');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_STATIC && k !== CACHE_DATA)
          .map(k => {
            swLog('[SW] Borrando cache viejo:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ============ FETCH ============
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar extensiones de Chrome, datos, blobs, etc.
  if (!url.protocol.startsWith('http')) return;

  // Rutas de API → Network-first con fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Fuentes de Google → Cache-first
  if (url.hostname.includes('fonts.')) {
    event.respondWith(cacheFirstStrategy(request, CACHE_STATIC));
    return;
  }

  // Assets estáticos → Cache-first
  event.respondWith(cacheFirstStrategy(request, CACHE_STATIC));
});

/**
 * Cache-first: sirve desde caché; si falla, va a red y actualiza caché.
 */
async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request, { ignoreSearch: false });
  if (cached) return cached;

  try {
    const networkResp = await fetch(request.clone());
    if (networkResp.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResp.clone());
    }
    return networkResp;
  } catch (_) {
    // Offline y no está en caché → página de fallback
    return offlineFallback(request);
  }
}

/**
 * Network-first: intenta red; si falla, sirve desde caché.
 */
async function networkFirstStrategy(request) {
  try {
    const networkResp = await fetch(request.clone());
    if (networkResp.ok) {
      const cache = await caches.open(CACHE_DATA);
      cache.put(request, networkResp.clone());
    }
    return networkResp;
  } catch (_) {
    const cached = await caches.match(request);
    return cached || offlineFallback(request);
  }
}

/**
 * Respuesta de fallback cuando no hay caché ni red.
 */
function offlineFallback(request) {
  if (request.destination === 'document') {
    return caches.match('/index.html');
  }
  return new Response(
    JSON.stringify({ error: 'Sin conexión. Los datos se sincronizarán cuando vuelva internet.' }),
    { status: 503, headers: { 'Content-Type': 'application/json' } }
  );
}

// ============ BACKGROUND SYNC ============
self.addEventListener('sync', event => {
  swLog('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-articulos') {
    event.waitUntil(sincronizarArticulos());
  }

  if (event.tag === 'sync-revisiones') {
    event.waitUntil(sincronizarRevisiones());
  }
});

async function sincronizarArticulos() {
  // Notifica a todos los clientes para que ejecuten su lógica de sync
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach(client => client.postMessage({ type: 'TRIGGER_SYNC', store: 'articulos' }));
  swLog('[SW] Sync de artículos disparado');
}

async function sincronizarRevisiones() {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach(client => client.postMessage({ type: 'TRIGGER_SYNC', store: 'revisiones' }));
  swLog('[SW] Sync de revisiones disparado');
}

// ============ PUSH NOTIFICATIONS ============
self.addEventListener('push', event => {
  let data = { title: 'RevisionAR', body: 'Tienes una nueva notificación', icon: '/icons/icon-192.png' };
  try { data = { ...data, ...event.data.json() }; } catch (_) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:  data.body,
      icon:  data.icon || '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      data:  data,
      actions: data.actions || [],
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      const existing = clientList.find(c => c.url === url && 'focus' in c);
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});

// ============ MENSAJES DESDE LA APP ============
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();

  if (event.data?.type === 'CACHE_ARTICLE') {
    // Cachear artículo específico para lectura offline
    const { url } = event.data;
    caches.open(CACHE_DATA).then(cache => cache.add(url));
  }
});
