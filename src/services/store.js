// Centralized state store with persistence and pre-populated demo dataset

const STORAGE_KEY = 'loyalty_wallet_saas_data_v1';

const DEFAULT_DATA = {
  activeBusinessId: 'biz_macondo',
  businesses: [
    {
      id: 'biz_macondo',
      name: 'Café Macondo',
      category: 'Cafetería & Pastelería',
      logo: '☕',
      headerImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
      bgColor: '#2C1810',
      cardColor: '#3D2314',
      accentColor: '#D4A373',
      textColor: '#FAEDCD',
      stampShape: '☕', // '☕' | '⭐' | '🎯' | '🍕' | '🍔' | '❤️'
      totalStampsRequired: 8,
      rewardTitle: 'Café gratis + Croissant de la casa',
      rewardTerms: 'Válido para consumo en local o para llevar. Vence a los 30 días de completado.',
      address: 'Calle 93 # 12-45, Zona Rosa, Bogotá',
      lat: 4.6782,
      lng: -74.0531,
      proximityRadiusMeters: 400,
      proximityMessage: '¡Estás cerca de Café Macondo! Pasa por tu café del día y suma un sello ☕',
      lastBroadcastMessage: '🎉 ¡Este fin de semana 2x1 en Cappuccino de 3 a 5 PM!',
      broadcastHistory: [
        {
          id: 'msg_1',
          text: '🎉 ¡Este fin de semana 2x1 en Cappuccino de 3 a 5 PM!',
          sentAt: '2026-10-05T15:30:00Z',
          recipientsCount: 14,
          segment: 'Todos los clientes'
        },
        {
          id: 'msg_2',
          text: '⚡ Te falta solo 1 sello para tu premio. ¡Te esperamos hoy!',
          sentAt: '2026-09-28T11:00:00Z',
          recipientsCount: 5,
          segment: 'Cerca del premio'
        }
      ]
    },
    {
      id: 'biz_burger',
      name: 'Burgers & Co.',
      category: 'Restaurante / Hamburguesas',
      logo: '🍔',
      headerImage: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
      bgColor: '#1A1A1A',
      cardColor: '#2A1B1B',
      accentColor: '#E63946',
      textColor: '#F1FAEE',
      stampShape: '🍔',
      totalStampsRequired: 10,
      rewardTitle: 'Combo Doble Queso + Papas Gratis',
      rewardTerms: 'No acumulable con otras promociones.',
      address: 'Carrera 15 # 85-30, Bogotá',
      lat: 4.6690,
      lng: -74.0560,
      proximityRadiusMeters: 300,
      proximityMessage: '🍔 ¿Hambre? Pide tu burger favorita en Burgers & Co.',
      lastBroadcastMessage: '🔥 Nueva Smash Burger disponible hoy. ¡Pruébala!',
      broadcastHistory: []
    }
  ],
  clients: [
    {
      id: 'cli_1',
      businessId: 'biz_macondo',
      name: 'María González',
      email: 'maria.gonzalez@example.com',
      phone: '+57 300 123 4567',
      stamps: 7,
      totalRedeemed: 2,
      createdAt: '2026-08-10T14:20:00Z',
      lastVisitAt: '2026-10-08T18:45:00Z',
      walletType: 'apple', // 'apple' | 'google' | 'web'
      passId: 'PASS-MAC-884920',
      pushToken: 'push_token_apple_112',
      consentMarketing: true,
      consentLocation: true
    },
    {
      id: 'cli_2',
      businessId: 'biz_macondo',
      name: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@example.com',
      phone: '+57 312 987 6543',
      stamps: 8,
      totalRedeemed: 1,
      createdAt: '2026-09-01T10:15:00Z',
      lastVisitAt: '2026-10-07T16:10:00Z',
      walletType: 'google',
      passId: 'PASS-MAC-991204',
      pushToken: 'push_token_google_901',
      consentMarketing: true,
      consentLocation: true
    },
    {
      id: 'cli_3',
      businessId: 'biz_macondo',
      name: 'Andrea Benítez',
      email: 'andrea.benitez@example.com',
      phone: '+57 315 444 3322',
      stamps: 3,
      totalRedeemed: 0,
      createdAt: '2026-09-15T09:30:00Z',
      lastVisitAt: '2026-10-04T12:00:00Z',
      walletType: 'apple',
      passId: 'PASS-MAC-441029',
      pushToken: 'push_token_apple_883',
      consentMarketing: true,
      consentLocation: false
    },
    {
      id: 'cli_4',
      businessId: 'biz_macondo',
      name: 'Felipe Mendoza',
      email: 'felipe.mendoza@example.com',
      phone: '+57 301 555 7788',
      stamps: 1,
      totalRedeemed: 0,
      createdAt: '2026-10-01T17:00:00Z',
      lastVisitAt: '2026-10-01T17:00:00Z',
      walletType: 'google',
      passId: 'PASS-MAC-109283',
      pushToken: 'push_token_google_331',
      consentMarketing: true,
      consentLocation: true
    },
    {
      id: 'cli_5',
      businessId: 'biz_macondo',
      name: 'Laura Restrepo',
      email: 'laura.restrepo@example.com',
      phone: '+57 310 888 2211',
      stamps: 5,
      totalRedeemed: 3,
      createdAt: '2026-07-20T11:00:00Z',
      lastVisitAt: '2026-10-08T19:30:00Z',
      walletType: 'web',
      passId: 'PASS-MAC-559102',
      pushToken: null,
      consentMarketing: false,
      consentLocation: true
    }
  ],
  stampLogs: [
    {
      id: 'log_1',
      clientId: 'cli_1',
      businessId: 'biz_macondo',
      staffName: 'Cajero Juan',
      timestamp: '2026-10-08T18:45:00Z',
      type: 'stamp', // 'stamp' | 'redeem'
      note: 'Sello escaneado con QR'
    },
    {
      id: 'log_2',
      clientId: 'cli_2',
      businessId: 'biz_macondo',
      staffName: 'Cajero Juan',
      timestamp: '2026-10-07T16:10:00Z',
      type: 'stamp',
      note: 'Alcanzó la meta (8/8 sellos)'
    },
    {
      id: 'log_3',
      clientId: 'cli_5',
      businessId: 'biz_macondo',
      staffName: 'Mesera Sofía',
      timestamp: '2026-10-08T19:30:00Z',
      type: 'stamp',
      note: 'Búsqueda por correo'
    }
  ],
  offlineQueue: []
};

// Memory fallback in case localStorage is disabled (e.g. private browsing)
let memoryStore = null;

// Initialize Store
export function getStoreData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveStoreData(DEFAULT_DATA);
      return DEFAULT_DATA;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn('localStorage read error/disabled, using in-memory store', e);
    return memoryStore || DEFAULT_DATA;
  }
}

export function saveStoreData(data) {
  memoryStore = data;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('localStorage write error/disabled', e);
  }
  // Dispatch custom event for cross-component live sync
  try {
    window.dispatchEvent(new Event('loyalty_store_updated'));
  } catch (e) {}
}

export function getActiveBusiness() {
  const store = getStoreData();
  const biz = store.businesses.find(b => b.id === store.activeBusinessId);
  return biz || store.businesses[0];
}

export function updateBusiness(updatedFields) {
  const store = getStoreData();
  const index = store.businesses.findIndex(b => b.id === store.activeBusinessId);
  if (index !== -1) {
    store.businesses[index] = { ...store.businesses[index], ...updatedFields };
    saveStoreData(store);
  }
  return store.businesses[index];
}

export function registerClient({ name, email, phone, walletType, consentMarketing, consentLocation }) {
  const store = getStoreData();
  const activeBiz = getActiveBusiness();

  // Check if client email already exists for this business
  let client = store.clients.find(c => c.businessId === activeBiz.id && c.email.toLowerCase() === email.toLowerCase());

  if (client) {
    // Update wallet preferences if existing
    client.walletType = walletType || client.walletType;
    client.consentMarketing = consentMarketing;
    client.consentLocation = consentLocation;
    saveStoreData(store);
    return { client, isNew: false };
  }

  const passId = `PASS-${activeBiz.id.slice(4).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

  client = {
    id: `cli_${Date.now()}`,
    businessId: activeBiz.id,
    name,
    email,
    phone: phone || '',
    stamps: 0,
    totalRedeemed: 0,
    createdAt: new Date().toISOString(),
    lastVisitAt: new Date().toISOString(),
    walletType: walletType || 'apple',
    passId,
    pushToken: `token_${walletType}_${Date.now()}`,
    consentMarketing: Boolean(consentMarketing),
    consentLocation: Boolean(consentLocation)
  };

  store.clients.unshift(client);
  saveStoreData(store);
  return { client, isNew: true };
}

export function addStampToClient(clientId, staffName = 'Cajero Turno') {
  const store = getStoreData();
  const clientIndex = store.clients.findIndex(c => c.id === clientId);
  if (clientIndex === -1) return { success: false, error: 'Cliente no encontrado' };

  const client = store.clients[clientIndex];
  const activeBiz = getActiveBusiness();

  // Cooldown check (60s warning for potential double scans)
  const now = new Date();
  const lastVisit = new Date(client.lastVisitAt);
  const diffSeconds = (now - lastVisit) / 1000;
  
  if (diffSeconds < 60 && client.stamps > 0) {
    // We allow stamping but record warning tag or allow explicit override
  }

  if (client.stamps >= activeBiz.totalStampsRequired) {
    return { 
      success: false, 
      error: `El cliente ya completó los ${activeBiz.totalStampsRequired} sellos y tiene un premio listo para canjear.` 
    };
  }

  client.stamps += 1;
  client.lastVisitAt = now.toISOString();

  const isRewardReady = client.stamps >= activeBiz.totalStampsRequired;

  const logEntry = {
    id: `log_${Date.now()}`,
    clientId: client.id,
    businessId: activeBiz.id,
    staffName,
    timestamp: now.toISOString(),
    type: 'stamp',
    note: isRewardReady ? `Sello ${client.stamps}/${activeBiz.totalStampsRequired} - ¡PREMIO DESBLOQUEADO!` : `Sello ${client.stamps}/${activeBiz.totalStampsRequired}`
  };

  store.stampLogs.unshift(logEntry);
  saveStoreData(store);

  return {
    success: true,
    client,
    isRewardReady,
    newStamps: client.stamps,
    totalRequired: activeBiz.totalStampsRequired
  };
}

export function redeemReward(clientId, staffName = 'Cajero Turno') {
  const store = getStoreData();
  const clientIndex = store.clients.findIndex(c => c.id === clientId);
  if (clientIndex === -1) return { success: false, error: 'Cliente no encontrado' };

  const client = store.clients[clientIndex];
  const activeBiz = getActiveBusiness();

  if (client.stamps < activeBiz.totalStampsRequired) {
    return { success: false, error: 'El cliente aún no ha alcanzado la meta de sellos.' };
  }

  client.stamps = 0;
  client.totalRedeemed += 1;
  client.lastVisitAt = new Date().toISOString();

  const logEntry = {
    id: `log_${Date.now()}`,
    clientId: client.id,
    businessId: activeBiz.id,
    staffName,
    timestamp: new Date().toISOString(),
    type: 'redeem',
    note: `Premio canjeado: ${activeBiz.rewardTitle}`
  };

  store.stampLogs.unshift(logEntry);
  saveStoreData(store);

  return { success: true, client };
}

export function sendBroadcastMessage({ messageText, segment = 'Todos los clientes' }) {
  const store = getStoreData();
  const activeBiz = getActiveBusiness();

  // Count target recipients based on segment
  const bizClients = store.clients.filter(c => c.businessId === activeBiz.id);
  let targetClients = bizClients;

  if (segment === 'Inactivos > 30 días') {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    targetClients = bizClients.filter(c => new Date(c.lastVisitAt) < cutoff);
  } else if (segment === 'Cerca del premio') {
    targetClients = bizClients.filter(c => c.stamps >= Math.ceil(activeBiz.totalStampsRequired * 0.75));
  }

  // Update business lastBroadcastMessage
  const bizIndex = store.businesses.findIndex(b => b.id === activeBiz.id);
  if (bizIndex !== -1) {
    store.businesses[bizIndex].lastBroadcastMessage = messageText;
    if (!store.businesses[bizIndex].broadcastHistory) {
      store.businesses[bizIndex].broadcastHistory = [];
    }
    store.businesses[bizIndex].broadcastHistory.unshift({
      id: `msg_${Date.now()}`,
      text: messageText,
      sentAt: new Date().toISOString(),
      recipientsCount: targetClients.length,
      segment
    });
  }

  saveStoreData(store);

  return {
    success: true,
    recipientsCount: targetClients.length,
    sentAt: new Date().toISOString()
  };
}

export function exportClientsToCSV() {
  const store = getStoreData();
  const activeBiz = getActiveBusiness();
  const bizClients = store.clients.filter(c => c.businessId === activeBiz.id);

  const headers = ['ID Pase', 'Nombre', 'Correo', 'Teléfono', 'Sellos Actuales', 'Premios Canjeados', 'Wallet', 'Fecha Alta', 'Última Visita'];
  const rows = bizClients.map(c => [
    c.passId,
    `"${c.name.replace(/"/g, '""')}"`,
    c.email,
    c.phone || '',
    c.stamps,
    c.totalRedeemed,
    c.walletType,
    c.createdAt,
    c.lastVisitAt
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' 
    + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `clientes_${activeBiz.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
