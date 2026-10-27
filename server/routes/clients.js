// ============================================================
// RUTA: /api/clients — Sincronización de clientes registrados
// ============================================================
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../data/clients.json');

// Asegurar que el directorio /data exista
function ensureDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, '[]', 'utf8');
}

function readDB() {
  ensureDB();
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return [];
  }
}

function writeDB(data) {
  ensureDB();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// GET /api/clients — Obtener todos los clientes
router.get('/', (req, res) => {
  const clients = readDB();
  res.json({ success: true, clients });
});

// POST /api/clients/register — Registrar o actualizar un cliente
router.post('/register', (req, res) => {
  try {
    const { name, email, phone, walletType, consentMarketing, consentLocation, businessId, passId, stamps } = req.body;

    if (!name || !email || !businessId) {
      return res.status(400).json({ success: false, error: 'Faltan campos obligatorios: name, email, businessId' });
    }

    const clients = readDB();
    const existingIndex = clients.findIndex(
      c => c.businessId === businessId && c.email.toLowerCase() === email.toLowerCase()
    );

    if (existingIndex !== -1) {
      // Actualizar cliente existente
      clients[existingIndex] = {
        ...clients[existingIndex],
        name,
        phone: phone || clients[existingIndex].phone,
        walletType: walletType || clients[existingIndex].walletType,
        consentMarketing: Boolean(consentMarketing),
        consentLocation: Boolean(consentLocation),
        updatedAt: new Date().toISOString(),
      };
      writeDB(clients);
      return res.json({ success: true, client: clients[existingIndex], isNew: false });
    }

    // Nuevo cliente
    const newClient = {
      id: `cli_${Date.now()}`,
      businessId,
      name,
      email,
      phone: phone || '',
      stamps: stamps || 0,
      totalRedeemed: 0,
      createdAt: new Date().toISOString(),
      lastVisitAt: new Date().toISOString(),
      walletType: walletType || 'web',
      passId: passId || `PASS-${businessId.slice(0,4).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
      consentMarketing: Boolean(consentMarketing),
      consentLocation: Boolean(consentLocation),
    };

    clients.unshift(newClient);
    writeDB(clients);

    console.log(`✅ Nuevo cliente registrado: ${name} (${email}) para negocio ${businessId}`);
    res.json({ success: true, client: newClient, isNew: true });
  } catch (err) {
    console.error('❌ Error al registrar cliente:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/clients/:id/stamps — Actualizar sellos desde el cajero
router.patch('/:id/stamps', (req, res) => {
  try {
    const { id } = req.params;
    const { stamps } = req.body;
    const clients = readDB();
    const idx = clients.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
    clients[idx].stamps = stamps;
    clients[idx].lastVisitAt = new Date().toISOString();
    writeDB(clients);
    res.json({ success: true, client: clients[idx] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
