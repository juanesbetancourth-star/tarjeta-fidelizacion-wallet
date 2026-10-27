// ============================================================
// SERVICIO DE APPLE WALLET — Genera archivos .pkpass para iOS
// ============================================================
// Requiere certificados de Apple Developer (ver config.js)
// ============================================================

import { PKPass } from 'passkit-generator';
import fs from 'fs';
import path from 'path';
import config from '../config.js';

let certs = null;

// Cargar certificados de Apple desde la carpeta credentials
function loadCertificates() {
  try {
    const certPath = path.resolve(config.apple.certPath);
    const keyPath = path.resolve(config.apple.keyPath);
    const wwdrPath = path.resolve(config.apple.wwdrPath);

    if (fs.existsSync(certPath) && fs.existsSync(keyPath) && fs.existsSync(wwdrPath)) {
      certs = {
        wwdr: fs.readFileSync(wwdrPath),
        signerCert: fs.readFileSync(certPath),
        signerKey: fs.readFileSync(keyPath),
        signerKeyPassphrase: config.apple.passphrase || undefined,
      };
      console.log('✅ Apple Wallet: Certificados cargados correctamente.');
      return true;
    } else {
      console.warn('⚠️  Apple Wallet: No se encontraron los certificados .pem en server/credentials/');
      console.warn('   → Para activar pases reales de Apple Wallet, sigue las instrucciones en config.js');
      return false;
    }
  } catch (err) {
    console.error('❌ Apple Wallet: Error al cargar certificados:', err.message);
    return false;
  }
}

// ============================================================
// GENERAR ARTIFACTO .PKPASS DE APPLE WALLET
// ============================================================
export async function generateApplePass(business, clientData) {
  const hasCerts = loadCertificates();

  if (!hasCerts) {
    return {
      success: false,
      mode: 'demo',
      message: 'Modo demo: Se requiere certificado de desarrollador de Apple ($99/año) para firmar pases .pkpass reales.',
    };
  }

  try {
    // Crear objeto de pase (tipo Store Card / Loyalty)
    const pass = new PKPass({}, certs, {
      passTypeIdentifier: config.apple.passTypeIdentifier,
      teamIdentifier: config.apple.teamIdentifier,
      serialNumber: clientData.passId,
      organizationName: business.name,
      description: `Tarjeta de Sellos — ${business.name}`,
      backgroundColor: business.bgColor || 'rgb(44, 24, 16)',
      foregroundColor: 'rgb(255, 255, 255)',
      labelColor: 'rgb(234, 179, 8)',
    });

    // Código QR en el pase
    pass.setBarcodes({
      format: 'PKBarcodeFormatQR',
      message: clientData.passId,
      messageEncoding: 'iso-8859-1',
    });

    // Campos del pase
    pass.headerFields.add({
      key: 'stamps',
      label: 'SELLOS',
      value: `${clientData.stamps || 0}/${business.totalStampsRequired || 8}`,
    });

    pass.primaryFields.add({
      key: 'name',
      label: 'CLIENTE',
      value: clientData.name,
    });

    pass.secondaryFields.add({
      key: 'reward',
      label: 'PREMIO EN JUEGO',
      value: business.rewardTitle || 'Premio de Fidelidad',
    });

    pass.auxiliaryFields.add({
      key: 'passId',
      label: 'CÓDIGO DE SOCIO',
      value: clientData.passId,
    });

    // Notificación por ubicación (Geofencing)
    if (business.lat && business.lng) {
      pass.addLocations({
        longitude: business.lng,
        latitude: business.lat,
        relevantText: `¡Estás cerca de ${business.name}! Presenta tu tarjeta digital y suma sellos.`,
      });
    }

    // Generar buffer del archivo .pkpass
    const buffer = pass.getAsBuffer();

    console.log(`✅ Apple Wallet: Archivo .pkpass generado para ${clientData.name}`);

    return {
      success: true,
      mode: 'production',
      buffer,
      filename: `${clientData.passId}.pkpass`,
    };
  } catch (err) {
    console.error('❌ Apple Wallet: Error al crear .pkpass:', err.message);
    return {
      success: false,
      mode: 'error',
      error: err.message,
    };
  }
}

// Inicializar certificados
loadCertificates();
