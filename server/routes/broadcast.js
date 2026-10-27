import express from 'express';
import path from 'path';
import { google } from 'googleapis';

const router = express.Router();

async function getWalletClient() {
  const credentialsPath = path.resolve('server', 'credentials', 'google-service-account.json');
  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
  });
  const authClient = await auth.getClient();
  return google.walletobjects({ version: 'v1', auth: authClient });
}

// POST /api/google-wallet/broadcast
router.post('/broadcast', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'Falta el campo "message"' });
    }

    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID || '3388000000023223437';
    const wallet = await getWalletClient();

    // 1. Listar todas las CLASES de fidelización del emisor
    const classesRes = await wallet.loyaltyclass.list({ issuerId, maxResults: 50 });
    const classes = classesRes.data.resources || [];

    if (classes.length === 0) {
      return res.json({ success: true, processed: 0, failed: 0, note: 'No hay clases de pase creadas todavía.' });
    }

    console.log(`📋 Clases encontradas: ${classes.map(c => c.id).join(', ')}`);

    const failures = [];
    let totalProcessed = 0;

    // 2. Para cada clase, listar sus OBJETOS (pases de clientes)
    for (const cls of classes) {
      let pageToken = null;

      do {
        const params = { classId: cls.id, maxResults: 200 };
        if (pageToken) params.token = pageToken;

        const objRes = await wallet.loyaltyobject.list(params);
        const objects = objRes.data.resources || [];
        pageToken = objRes.data.pagination?.nextPageToken || null;

        // 3. Enviar addMessage a cada objeto (pase de cliente)
        for (const obj of objects) {
          try {
            await wallet.loyaltyobject.addmessage({
              resourceId: obj.id,
              requestBody: {
                message: {
                  header: '🔔 Burgers & Co.',
                  body: message,
                  messageType: 'TEXT',
                },
              },
            });
            console.log(`✅ Mensaje enviado a ${obj.id}`);
            totalProcessed++;
          } catch (e) {
            console.warn(`⚠️ Error en ${obj.id}: ${e.message}`);
            failures.push({ id: obj.id, error: e.message });
          }
        }
      } while (pageToken);
    }

    res.json({
      success: true,
      processed: totalProcessed,
      failed: failures.length,
      failures,
    });

  } catch (err) {
    console.error('❌ Broadcast falló:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
