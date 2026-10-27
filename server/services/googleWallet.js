// ============================================================
// SERVICIO DE GOOGLE WALLET — Genera pases reales para Android
// ============================================================
// Documentación oficial: https://developers.google.com/wallet/loyalty
// ============================================================

import { GoogleAuth } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import config from '../config.js';

let credentials = null;
let httpClient = null;

// Intentar cargar credenciales de Google
function loadCredentials() {
  try {
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      console.log('✅ Google Wallet: Credenciales cargadas desde variable de entorno GOOGLE_SERVICE_ACCOUNT_JSON.');
      return true;
    } else if (fs.existsSync(config.google.serviceAccountKeyPath)) {
      const raw = fs.readFileSync(config.google.serviceAccountKeyPath, 'utf8');
      credentials = JSON.parse(raw);
      console.log('✅ Google Wallet: Credenciales de Service Account cargadas correctamente.');
      return true;
    } else {
      console.warn('⚠️  Google Wallet: No se encontró el archivo de credenciales en:', config.google.serviceAccountKeyPath);
      console.warn('   → La API funcionará en MODO DEMO (genera enlaces simulados).');
      console.warn('   → Para activar pases reales, sigue las instrucciones en config.js');
      return false;
    }
  } catch (err) {
    console.error('❌ Google Wallet: Error al leer credenciales:', err.message);
    return false;
  }
}

// Obtener cliente HTTP autenticado de Google
async function getHttpClient() {
  if (!credentials) return null;
  if (httpClient) return httpClient;

  const auth = new GoogleAuth({
    credentials: credentials,
    scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
  });
  httpClient = await auth.getClient();
  return httpClient;
}

// ============================================================
// CREAR O ACTUALIZAR CLASE DE PASE (una por negocio)
// ============================================================
export async function createOrUpdateLoyaltyClass(business) {
  const client = await getHttpClient();
  if (!client) return null;

  const safeBizId = business.id.replace(/[^a-zA-Z0-9]/g, '');
  const classId = `${config.google.issuerId}.${safeBizId}_loyalty`;
  console.log('🔧 createOrUpdateLoyaltyClass -> classId:', classId);

  const loyaltyClass = {
    id: classId,
    issuerName: business.name,
    programName: `Tarjeta de Sellos — ${business.name}`,
    programLogo: {
      sourceUri: { uri: business.headerImage || 'https://via.placeholder.com/200' },
      contentDescription: { defaultValue: { language: 'es', value: business.name } },
    },
    hexBackgroundColor: business.bgColor || '#2C1810',
    heroImage: {
      sourceUri: { uri: business.headerImage || 'https://via.placeholder.com/600x200' },
      contentDescription: { defaultValue: { language: 'es', value: 'Banner del negocio' } },
    },
    reviewStatus: 'UNDER_REVIEW',
    countryCode: 'CO',
    // 📍 Geolocalización: el pase aparece en pantalla al llegar al local
    ...(business.latitude && business.longitude ? {
      locations: [{
        latitude: parseFloat(business.latitude),
        longitude: parseFloat(business.longitude),
      }],
    } : {}),
    // 🔔 Messages for broadcast
    messages: business.lastBroadcastMessage ? [{
      header: business.name,
      body: business.lastBroadcastMessage,
      id: `msg_${Date.now()}`,
    }] : [],
  };

  try {
    // Try to get existing class first
    const getRes = await client.request({
      url: `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass/${classId}`,
      method: 'GET',
    });

    // Class exists → update it
    await client.request({
      url: `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass/${classId}`,
      method: 'PUT',
      data: loyaltyClass,
    });
    console.log(`✅ Google Wallet: Clase actualizada: ${classId}`);
  } catch (err) {
    if (err.response && err.response.status === 404) {
      // Class doesn't exist → create it
      await client.request({
        url: 'https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass',
        method: 'POST',
        data: loyaltyClass,
      });
      console.log(`✅ Google Wallet: Clase creada: ${classId}`);
    } else {
      console.error('❌ Google Wallet: Error al gestionar la clase:', err.message);
      throw err;
    }
  }

  return classId;
}

// ============================================================
// CREAR OBJETO DE PASE (uno por cliente)
// ============================================================
export async function createLoyaltyObject(business, client) {
  const safeBizId2 = business.id.replace(/[^a-zA-Z0-9]/g, '');
  const classId = `${config.google.issuerId}.${safeBizId2}_loyalty`;
  const objectId = `${config.google.issuerId}.${client.passId.replace(/[^a-zA-Z0-9]/g, '')}`;

  const loyaltyObject = {
    id: objectId,
    classId: classId,
    state: 'ACTIVE',
    accountId: client.email,
    accountName: client.name,
    loyaltyPoints: {
      label: 'Sellos',
      balance: {
        int: client.stamps || 0,
      },
    },
    barcode: {
      type: 'QR_CODE',
      value: client.passId,
      alternateText: client.passId,
    },
    heroImage: {
      sourceUri: { uri: business.headerImage || 'https://via.placeholder.com/600x200' },
      contentDescription: { defaultValue: { language: 'es', value: business.name } },
    },
    textModulesData: [
      {
        header: 'Premio',
        body: business.rewardTitle || 'Completa tus sellos para ganar',
        id: 'reward',
      },
      {
        header: 'Avance',
        body: `${client.stamps || 0} de ${business.totalStampsRequired || 8} sellos`,
        id: 'progress',
      },
    ],
    linksModuleData: {
      uris: [
        {
          uri: `http://localhost:3000/?biz=${business.id}`,
          description: 'Ver mi tarjeta digital',
          id: 'web_link',
        },
      ],
    },
    // Geofence / proximity notification
    locations: business.lat && business.lng ? [
      {
        latitude: business.lat,
        longitude: business.lng,
      },
    ] : [],
    messages: business.lastBroadcastMessage ? [{
      header: business.name,
      body: business.lastBroadcastMessage,
      id: `msg_${Date.now()}`,
    }] : [],
  };

  return { objectId, loyaltyObject };
}

// ============================================================
// GENERAR ENLACE "GUARDAR EN GOOGLE WALLET" (JWT)
// ============================================================
export async function generateSaveLink(business, clientData) {
  const hasCredentials = loadCredentials();

  if (!hasCredentials) {
    // MODO DEMO: generar un enlace simulado
    return {
      success: true,
      mode: 'demo',
      saveUrl: `https://pay.google.com/gp/v/save/NOT_CONFIGURED`,
      message: 'Modo demo: Para generar enlaces reales de Google Wallet, coloca tu archivo google-service-account.json en server/credentials/ y configura tu Issuer ID en config.js',
    };
  }

  try {
    // Asegurar que la clase existe
    await createOrUpdateLoyaltyClass(business);

    // Crear el objeto del pase
    const { objectId, loyaltyObject } = await createLoyaltyObject(business, clientData);

    // Crear el JWT firmado
    const claims = {
      iss: credentials.client_email,
      aud: 'google',
      origins: ['http://localhost:3000'],
      typ: 'savetowallet',
      payload: {
        loyaltyObjects: [loyaltyObject],
      },
    };

    const token = jwt.sign(claims, credentials.private_key, {
      algorithm: 'RS256',
    });

    const saveUrl = `https://pay.google.com/gp/v/save/${token}`;

    console.log(`✅ Google Wallet: Enlace generado para ${clientData.name} (${clientData.passId})`);

    return {
      success: true,
      mode: 'production',
      saveUrl,
      objectId,
      message: 'Enlace de Google Wallet generado correctamente.',
    };
  } catch (err) {
    console.error('❌ Google Wallet: Error al generar enlace:', err.message);
    return {
      success: false,
      mode: 'error',
      error: err.message,
      message: 'Error al generar el pase de Google Wallet.',
    };
  }
}

// ============================================================
// ACTUALIZAR SELLOS EN UN PASE EXISTENTE
// ============================================================
export async function updatePassStamps(business, clientData) {
  const client = await getHttpClient();
  if (!client) {
    return { success: true, mode: 'demo', message: 'Modo demo: sello registrado localmente.' };
  }

  const objectId = `${config.google.issuerId}.${clientData.passId.replace(/-/g, '_')}`;

  try {
    await client.request({
      url: `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${objectId}`,
      method: 'PATCH',
      data: {
        loyaltyPoints: {
          label: 'Sellos',
          balance: {
            int: clientData.stamps,
          },
        },
        textModulesData: [
          {
            header: 'Premio',
            body: business.rewardTitle,
            id: 'reward',
          },
          {
            header: 'Avance',
            body: `${clientData.stamps} de ${business.totalStampsRequired} sellos`,
            id: 'progress',
          },
        ],
      },
    });

    console.log(`✅ Google Wallet: Pase actualizado (${clientData.stamps}/${business.totalStampsRequired} sellos) para ${clientData.name}`);
    return { success: true, mode: 'production', message: 'Pase de Google Wallet actualizado.' };
  } catch (err) {
    console.error('❌ Google Wallet: Error al actualizar pase:', err.message);
    return { success: false, error: err.message };
  }
}

// ============================================================
// ENVIAR MENSAJE MASIVO (actualizar clase con nuevo mensaje)
// ============================================================
export async function sendBroadcast(business, messageText) {
  const client = await getHttpClient();
  if (!client) {
    return { success: true, mode: 'demo', message: 'Modo demo: mensaje registrado localmente.' };
  }

  const classId = `${config.google.issuerId}.${business.id}_${config.google.classIdSuffix}`;

  try {
    // Add message to the class — all objects of this class get notified
    await client.request({
      url: `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass/${classId}/addMessage`,
      method: 'POST',
      data: {
        message: {
          header: business.name,
          body: messageText,
          id: `broadcast_${Date.now()}`,
        },
      },
    });

    console.log(`✅ Google Wallet: Mensaje masivo enviado a clase ${classId}`);
    return { success: true, mode: 'production', message: 'Mensaje enviado a todos los pases de Google Wallet.' };
  } catch (err) {
    console.error('❌ Google Wallet: Error al enviar mensaje masivo:', err.message);
    return { success: false, error: err.message };
  }
}

// Inicializar al importar
loadCredentials();
