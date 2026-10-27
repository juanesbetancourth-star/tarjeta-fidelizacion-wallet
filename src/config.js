// ============================================================
// CONFIGURACIÓN CENTRALIZADA DE LA API / BACKEND
// ============================================================
// En desarrollo local (puerto 3000): apunta a http://<hostname>:3001
// En producción (con dominio propio):
//   1. Si defines VITE_BACKEND_URL en .env, usa ese valor (ej. https://api.tudominio.com)
//   2. Si no, usa window.location.origin (asumiendo reverse proxy Nginx con /api)

const envBackend = import.meta.env.VITE_BACKEND_URL;

export const BACKEND_URL = envBackend
  ? envBackend.replace(/\/$/, '')
  : (typeof window !== 'undefined' && window.location.port === '3000'
      ? `http://${window.location.hostname}:3001`
      : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'));

export default { BACKEND_URL };
