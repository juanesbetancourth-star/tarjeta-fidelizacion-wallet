// Hook para registrar el Service Worker y suscribirse a Web Push
import { BACKEND_URL } from '../config.js';

export async function subscribeToPush(businessId, clientEmail) {
  try {
    // 1. Registrar el service worker
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Web Push no soportado en este navegador');
      return false;
    }

    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // 2. Pedir permiso de notificaciones
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Permiso de notificaciones denegado');
      return false;
    }

    // 3. Obtener la clave pública VAPID del backend
    const keyRes = await fetch(`${BACKEND_URL}/api/push/vapid-public-key`);
    const { publicKey } = await keyRes.json();

    // 4. Crear la suscripción push
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    // 5. Enviar la suscripción al backend
    await fetch(`${BACKEND_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription, businessId, clientEmail }),
    });

    console.log('✅ Suscripción push registrada correctamente');
    return true;
  } catch (err) {
    console.warn('Error al suscribirse a push:', err.message);
    return false;
  }
}

// Convertir base64 a Uint8Array (requerido por la Web Push API)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
}
