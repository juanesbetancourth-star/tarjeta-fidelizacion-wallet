// Script de prueba para el broadcast
import fetch from 'node-fetch';

const res = await fetch('http://localhost:3001/api/google-wallet/broadcast', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: '🔥 Prueba de notificacion real - Burgers & Co.' })
});

const data = await res.json();
console.log('Respuesta del broadcast:');
console.log(JSON.stringify(data, null, 2));
