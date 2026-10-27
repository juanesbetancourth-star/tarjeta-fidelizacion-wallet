// ============================================================
// SERVIDORE EXPRESS BACKEND — LoyaltyWallet SaaS
// ============================================================

import express from 'express';
import cors from 'cors';
import config from './config.js';
import { generateSaveLink, updatePassStamps, sendBroadcast } from './services/googleWallet.js';
import { generateApplePass } from './services/appleWallet.js';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
import broadcastRouter from './routes/broadcast.js';
import clientsRouter from './routes/clients.js';
import pushRouter from './routes/push.js';
app.use('/api/google-wallet', broadcastRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/push', pushRouter);

// Endpoint de prueba / estado
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'LoyaltyWallet API',
    timestamp: new Date().toISOString(),
    googleWalletConfigured: !!process.env.GOOGLE_WALLET_ISSUER_ID,
    appleWalletConfigured: !!process.env.APPLE_TEAM_ID,
  });
});

// ============================================================
// GOOGLE WALLET: Generar enlace JWT de Guardar en Android
// ============================================================
app.post('/api/google-wallet/save', async (req, res) => {
  const { business, client } = req.body;

  if (!business || !client) {
    return res.status(400).json({ error: 'Faltan datos obligatorios (business o client).' });
  }

  try {
    const result = await generateSaveLink(business, client);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// APPLE WALLET: Generar y descargar archivo .pkpass
// ============================================================
app.post('/api/apple-wallet/pass', async (req, res) => {
  const { business, client } = req.body;

  if (!business || !client) {
    return res.status(400).json({ error: 'Faltan datos obligatorios (business o client).' });
  }

  try {
    const result = await generateApplePass(business, client);

    if (result.success && result.buffer) {
      res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      return res.send(result.buffer);
    } else {
      return res.status(200).json(result);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ACTUALIZAR SELLOS EN GOOGLE/APPLE WALLET
// ============================================================
app.post('/api/stamps/update', async (req, res) => {
  const { business, client } = req.body;

  try {
    const googleRes = await updatePassStamps(business, client);
    res.json({
      success: true,
      google: googleRes,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// MENSAJE MASIVO A TODOS LOS PASES
// ============================================================
app.post('/api/broadcast', async (req, res) => {
  const { business, message } = req.body;

  try {
    const googleRes = await sendBroadcast(business, message);
    res.json({
      success: true,
      google: googleRes,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(config.port, '0.0.0.0', () => {
  console.log(`
============================================================
🚀 LoyaltyWallet Backend Server escuchando en puerto ${config.port}
============================================================
• API Health Check: http://localhost:${config.port}/api/health
• Google Wallet Endpoint: http://localhost:${config.port}/api/google-wallet/save
• Apple Wallet Endpoint:  http://localhost:${config.port}/api/apple-wallet/pass
============================================================
  `);
});
