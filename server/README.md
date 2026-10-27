# 🚀 LoyaltyWallet Backend — Guía de Configuración de Wallets Reales

Este backend en Express.js gestiona la integración nativa con **Google Wallet** (Android) y **Apple Wallet** (iOS).

---

## 🟢 1. Configuración de Google Wallet (Android — GRATIS)

1. Ingresa a [Google Pay & Wallet Console](https://pay.google.com/business/console/) con tu cuenta de Google.
2. Solicita acceso como **Emisor de Tarjetas de Fidelidad (Loyalty issuer)**.
3. Una vez aprobado (1-3 días), obtendrás un **Issuer ID** (ej: `3388000000022327859`).
4. Entra a [Google Cloud Console](https://console.cloud.google.com/).
5. Crea un proyecto, ve a **IAM y administración → Cuentas de servicio** (Service Accounts).
6. Crea una cuenta de servicio, dale permisos y genera una clave de tipo **JSON**.
7. Descarga el archivo JSON y guárdalo en la siguiente ruta exacta:
   `server/credentials/google-service-account.json`
8. Abre `server/config.js` y coloca tu **Issuer ID**:
   ```javascript
   issuerId: 'TU_ISSUER_ID_AQUI'
   ```
9. ¡Listo! Al hacer clic en "Guardar en Google Wallet", tus clientes verán el flujo nativo de Google Pay.

---

## 🍎 2. Configuración de Apple Wallet (iOS — $99 USD/año)

1. Ingresa a tu cuenta de desarrollador en [Apple Developer Account](https://developer.apple.com/).
2. Ve a **Certificates, Identifiers & Profiles → Pass Type IDs**.
3. Crea un nuevo Pass Type ID (ej: `pass.com.tunegocio.loyalty`).
4. Genera un certificado `.p12` para ese Pass Type ID y descárgalo.
5. Exporta el archivo `.p12` a formato `.pem` e incluye la clave privada en la carpeta:
   `server/credentials/apple-pass-cert.pem`
   `server/credentials/apple-pass-key.pem`
   `server/credentials/apple-wwdr.pem` (Certificado WWDR de Apple)
6. Abre `server/config.js` y actualiza tu `passTypeIdentifier` y `teamIdentifier`.

---

## 🏃 Cómo Ejecutar el Servidor Backend

Para iniciar el servidor backend independientemente:

```bash
cd server
npm start
```

El servidor escuchará en el puerto **3001** (`http://localhost:3001`).
