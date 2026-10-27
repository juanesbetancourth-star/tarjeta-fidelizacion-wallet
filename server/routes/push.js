// ============================================================
// RUTA: Web Push — suscripciones y envío de notificaciones
// ============================================================
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import webpush from 'web-push';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SUBS_PATH = path.resolve(__dirname, '../data/subscriptions.json');

// Claves VAPID (generadas una sola vez o definidas por entorno)
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY || 'BKcNvZcA4EUeDtM06vsDrAxc78OZO4IFscs8rC6xMsgKE-bR6dAaCBToGRq68iiEKFNC6SFCFqW7_I0U7G2iFrg';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '5Q-jj89ONr_Z8M6KohsfUtJjR_HeN1e2ePMBexoze6s';
const VAPID_EMAIL   = process.env.VAPID_EMAIL || 'mailto:admin@loyaltywallet.app';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

function readSubs() {
  if (!fs.existsSync(SUBS_PATH)) return [];
  try { return JSON.parse(fs.readFileSync(SUBS_PATH, 'utf8')); } catch { return []; }
}
function writeSubs(data) {
  const dir = path.dirname(SUBS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SUBS_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// GET /api/push/vapid-public-key — el frontend lo necesita para suscribirse
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC });
});

// POST /api/push/subscribe — guardar suscripción del dispositivo
router.post('/subscribe', (req, res) => {
  const { subscription, businessId, clientEmail } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Suscripción inválida' });
  }
  const subs = readSubs();
  // Evitar duplicados por endpoint
  const exists = subs.findIndex(s => s.subscription.endpoint === subscription.endpoint);
  const entry = { subscription, businessId, clientEmail, createdAt: new Date().toISOString() };
  if (exists !== -1) {
    subs[exists] = entry;
  } else {
    subs.push(entry);
  }
  writeSubs(subs);
  console.log(`✅ Push suscripción guardada: ${clientEmail || 'anónimo'} (${businessId})`);
  res.json({ success: true });
});

// POST /api/push/broadcast — enviar notificación push a todos los suscriptores del negocio
router.post('/broadcast', async (req, res) => {
  const { message, title, businessId } = req.body;
  if (!message) return res.status(400).json({ error: 'Falta "message"' });

  const subs = readSubs();
  const targets = businessId ? subs.filter(s => s.businessId === businessId) : subs;

  const payload = JSON.stringify({
    title: title || '🔔 Notificación',
    body: message,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    url: '/?tab=client',
  });

  let sent = 0, failed = 0;
  const failedSubs = [];

  for (const entry of targets) {
    try {
      await webpush.sendNotification(entry.subscription, payload);
      sent++;
      console.log(`✅ Push enviado a ${entry.clientEmail || 'anónimo'}`);
    } catch (err) {
      console.warn(`⚠️ Push falló para ${entry.clientEmail}: ${err.message}`);
      failed++;
      failedSubs.push(entry.clientEmail);
      // Si el endpoint ya no es válido, eliminar la suscripción
      if (err.statusCode === 410 || err.statusCode === 404) {
        const updated = readSubs().filter(s => s.subscription.endpoint !== entry.subscription.endpoint);
        writeSubs(updated);
      }
    }
  }

  res.json({ success: true, sent, failed, total: targets.length });
});

export { VAPID_PUBLIC };
export default router;
