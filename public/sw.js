// Service Worker — maneja notificaciones push en el dispositivo
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = { title: '🔔 Notificación', body: 'Tienes un nuevo mensaje.', url: '/?tab=client' };
  try {
    data = event.data.json();
  } catch (e) {}

  const msgBody = encodeURIComponent(data.body || '');
  const targetUrl = `/?tab=client&msg=${msgBody}`;

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'loyalty-push',
      renotify: true,
      requireInteraction: false,
      data: { url: targetUrl, body: data.body, title: data.title },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const rawUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/?tab=client';

  const fullUrl = new URL(rawUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const c of clientList) {
        if (c.url.includes(self.location.origin) && 'focus' in c) {
          c.navigate(fullUrl);
          return c.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
      }
    })
  );
});
