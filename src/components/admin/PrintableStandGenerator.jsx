import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Printer, Smartphone, Sparkles, CheckCircle } from 'lucide-react';
import { getActiveBusiness } from '../../services/store';

export default function PrintableStandGenerator() {
  const [activeBiz, setActiveBiz] = useState(getActiveBusiness());
  const [qrUrl, setQrUrl] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState(window.location.origin);

  useEffect(() => {
    const biz = getActiveBusiness();
    setActiveBiz(biz);

    // Use customBaseUrl so the user can paste their localtunnel URL if they are on localhost
    const publicUrl = `${customBaseUrl}/?biz=${biz.id}`;

    QRCode.toDataURL(publicUrl, {
      width: 320,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
    .then(url => setQrUrl(url))
    .catch(err => console.error('QR generation error', err));
  }, [customBaseUrl]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="no-print" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>Stand Imprimible para Mostrador / Mesas</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
          Imprime este aviso y colócalo en la caja o en las mesas de tu local para que los clientes escaneen y obtengan su tarjeta digital en segundos.
        </p>

        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1rem', borderRadius: '12px', marginBottom: '1.25rem', textAlign: 'left', border: '1px solid var(--border-color)' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Enlace público del QR (Ej. tu URL de Localtunnel):
          </label>
          <input 
            type="text" 
            className="form-input" 
            value={customBaseUrl} 
            onChange={(e) => setCustomBaseUrl(e.target.value)}
            placeholder="https://tu-url.loca.lt"
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
            Si abriste este panel desde <strong>localhost</strong> pero quieres que el cliente escanee desde su celular, pega aquí tu enlace público de Localtunnel.
          </p>
        </div>

        <button 
          onClick={handlePrint}
          className="cashier-action-btn btn-stamp"
          style={{ width: 'auto', display: 'inline-flex', margin: '0 auto', padding: '0.85rem 1.75rem', fontSize: '1rem' }}
        >
          <Printer size={20} /> Imprimir Stand (Formato A5 / Mostrador)
        </button>
      </div>

      {/* Printable Display Card */}
      <div className="printable-stand">
        <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>{activeBiz.logo}</div>
        
        <h1 style={{ fontSize: '2.2rem', color: '#0f172a', fontWeight: 800, marginBottom: '0.2rem' }}>
          {activeBiz.name}
        </h1>
        
        <p style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>
          Programa de Fidelización Digital
        </p>

        <div style={{ 
          background: '#f8fafc', 
          border: '3px solid #e2e8f0', 
          borderRadius: '24px', 
          padding: '1.5rem',
          display: 'inline-block',
          marginBottom: '1.5rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.05)'
        }}>
          {qrUrl ? (
            <img src={qrUrl} alt="QR de Alta de Cliente" style={{ width: '220px', height: '220px', display: 'block', margin: '0 auto' }} />
          ) : (
            <div style={{ width: '220px', height: '220px', background: '#eee' }}>Cargando QR...</div>
          )}
        </div>

        <h3 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: 800, marginBottom: '0.5rem' }}>
          ¡ESCANEA Y GANA TU REGALO! 🎁
        </h3>

        <p style={{ fontSize: '1rem', color: '#334155', fontWeight: 600, marginBottom: '1.5rem' }}>
          {activeBiz.rewardTitle}
        </p>

        <div style={{ 
          display: 'flex', 
          justify: 'center', 
          gap: '1.5rem', 
          fontSize: '0.85rem', 
          color: '#475569',
          borderTop: '1px solid #e2e8f0',
          paddingTop: '1.25rem'
        }}>
          <div>
            <span style={{ fontWeight: 800, color: '#0f172a' }}>1. Escanea</span>
            <div>Con tu cámara</div>
          </div>
          <div>
            <span style={{ fontWeight: 800, color: '#0f172a' }}>2. Guarda</span>
            <div>Apple o Google Wallet</div>
          </div>
          <div>
            <span style={{ fontWeight: 800, color: '#0f172a' }}>3. Acumula</span>
            <div>Sellos en cada visita</div>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
          ⚡ Sin descargar ninguna aplicación • Cero almacenamiento consumido
        </div>
      </div>
    </div>
  );
}
