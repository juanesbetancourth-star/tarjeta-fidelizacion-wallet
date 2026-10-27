// ============================================================
// CONFIGURACIÓN DEL BACKEND — LoyaltyWallet SaaS
// ============================================================
// Instrucciones:
//
// 1. GOOGLE WALLET (Gratis):
//    - Ve a https://pay.google.com/business/console/
//    - Crea una cuenta de emisor y solicita acceso a la API
//    - Luego ve a Google Cloud Console → IAM → Service Accounts
//    - Crea una Service Account y descarga el archivo JSON de credenciales
//    - Coloca ese archivo en: server/credentials/google-service-account.json
//    - Copia el Issuer ID de Google Pay Console y pégalo abajo
//
// 2. APPLE WALLET ($99 USD/año):
//    - Ve a https://developer.apple.com/account/
//    - Crea un Pass Type ID en Certificates, Identifiers & Profiles
//    - Genera y descarga el certificado .p12
//    - Descarga el certificado WWDR de Apple
//    - Coloca ambos en: server/credentials/
//    - Llena los datos abajo
// ============================================================

const config = {
  // Puerto del servidor backend
  port: process.env.PORT || 3001,

  // URL del frontend (para CORS)
  frontendUrl: process.env.FRONTEND_URL || '*',

  // ================= GOOGLE WALLET =================
  google: {
    // Ruta al archivo JSON de la Service Account de Google Cloud
    serviceAccountKeyPath: new URL('../server/credentials/google-service-account.json', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'),

    // ID del emisor — lo encuentras en https://pay.google.com/business/console/
    // Ejemplo: '3388000000022327859'
    issuerId: process.env.GOOGLE_WALLET_ISSUER_ID || '3388000000023223437',

    // ID de la clase de pase (se crea automáticamente si no existe)
    // Formato recomendado: issuerId.nombreNegocio
    classIdSuffix: 'loyalty_card',
  },

  // ================= APPLE WALLET =================
  apple: {
    // Ruta al certificado .pem del Pass Type (convertido desde .p12)
    certPath: './credentials/apple-pass-cert.pem',

    // Ruta a la llave privada .pem
    keyPath: './credentials/apple-pass-key.pem',

    // Contraseña del certificado .p12 (si tiene)
    passphrase: process.env.APPLE_CERT_PASSPHRASE || '',

    // Ruta al certificado WWDR de Apple
    wwdrPath: './credentials/apple-wwdr.pem',

    // Pass Type Identifier — lo creas en developer.apple.com
    // Ejemplo: 'pass.com.tunegocio.loyalty'
    passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID || 'pass.com.loyaltywallet.demo',

    // Team Identifier — lo encuentras en tu cuenta de Apple Developer
    teamIdentifier: process.env.APPLE_TEAM_ID || 'TU_TEAM_ID',
  }
};

export default config;
