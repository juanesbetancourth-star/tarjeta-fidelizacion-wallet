import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Smartphone, CheckCircle, Bell, MapPin, Download, RefreshCw, AlertCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { getActiveBusiness, registerClient, getStoreData } from '../../services/store';
import { subscribeToPush } from '../../services/pushNotifications';
import { BACKEND_URL } from '../../config.js';

export default function ClientPassPage({ isPublicOnly = false }) {
  const [activeBiz, setActiveBiz] = useState(getActiveBusiness());
  
  // Leer mensaje de notificación si viene desde una notificación push (?msg=...)
  const notifMsg = (() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return p.get('msg') ? decodeURIComponent(p.get('msg')) : null;
    } catch { return null; }
  })();

  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

  const [client, setClient] = useState(() => {
    try {
      const biz = getActiveBusiness();
      const saved = localStorage.getItem('my_client_pass_' + biz.id);
      if (saved) return JSON.parse(saved);
      const store = getStoreData();
      return store.clients.find(c => c.businessId === biz.id) || null;
    } catch { return null; }
  });

  const [walletView, setWalletView] = useState(isAndroid ? 'google' : 'apple'); // 'apple' | 'google' | 'web'
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consentMarketing, setConsentMarketing] = useState(true);
  const [consentLocation, setConsentLocation] = useState(true);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Sync state on store updates
  useEffect(() => {
    const handleUpdate = () => {
      const biz = getActiveBusiness();
      setActiveBiz(biz);
      if (client) {
        const store = getStoreData();
        const updatedClient = store.clients.find(c => c.id === client.id);
        if (updatedClient) setClient(updatedClient);
      }
    };
    window.addEventListener('loyalty_store_updated', handleUpdate);
    return () => window.removeEventListener('loyalty_store_updated', handleUpdate);
  }, [client]);

  // Load sample client or registered client
  useEffect(() => {
    if (!client) {
      try {
        const saved = localStorage.getItem('my_client_pass_' + activeBiz.id);
        if (saved) {
          const parsed = JSON.parse(saved);
          setClient(parsed);
          setWalletView(parsed.walletType || (isAndroid ? 'google' : 'apple'));
          return;
        }
      } catch (e) {}

      const store = getStoreData();
      const existing = store.clients.find(c => c.businessId === activeBiz.id);
      if (existing) {
        setClient(existing);
        setWalletView(existing.walletType || (isAndroid ? 'google' : 'apple'));
      } else {
        // Consultar al backend si hay clientes registrados
        fetch(`${BACKEND_URL}/api/clients`)
          .then(res => res.json())
          .then(list => {
            const found = list.find(c => c.businessId === activeBiz.id);
            if (found) {
              setClient(found);
              setWalletView(found.walletType || (isAndroid ? 'google' : 'apple'));
            } else if (notifMsg) {
              // Si viene por notificación pero no hay cliente registrado aún, crear uno visible
              const fallback = {
                id: 'cli_notif',
                name: 'Cliente VIP',
                email: 'cliente@wallet.app',
                businessId: activeBiz.id,
                stamps: 3,
                passId: `PASS-${activeBiz.id.slice(4).toUpperCase()}-882190`,
                walletType: isAndroid ? 'google' : 'apple'
              };
              setClient(fallback);
            }
          })
          .catch(() => {});
      }
    }
  }, [activeBiz, notifMsg]);

  // Generate QR Code image when client changes
  useEffect(() => {
    const passCode = client?.passId || `PASS-${activeBiz.id.slice(4).toUpperCase()}-123456`;
    QRCode.toDataURL(passCode, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
    .then(url => setQrDataUrl(url))
    .catch(err => console.error('QR generation error', err));
  }, [client, activeBiz]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email) return;

    // 1. Guardar localmente (localStorage del dispositivo)
    const { client: newClient } = registerClient({
      name,
      email,
      phone,
      walletType: walletView,
      consentMarketing,
      consentLocation
    });

    setClient(newClient);
    setFormSubmitted(true);
    try {
      localStorage.setItem('my_client_pass_' + activeBiz.id, JSON.stringify(newClient));
    } catch (e) {}

    // 2. Sincronizar con el backend para que aparezca en el Admin
    try {
      await fetch(`${BACKEND_URL}/api/clients/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          walletType: walletView,
          consentMarketing,
          consentLocation,
          businessId: activeBiz.id,
          passId: newClient.passId,
          stamps: 0,
        }),
      });
      console.log('✅ Cliente sincronizado con el servidor');
    } catch (err) {
      console.warn('⚠️ No se pudo sincronizar con el servidor:', err.message);
    }

    // 3. Pedir permiso de notificaciones push automáticamente al registrarse
    try {
      await subscribeToPush(activeBiz.id, email);
    } catch (err) {
      console.warn('Push no disponible:', err.message);
    }
  };

  const [pushStatus, setPushStatus] = useState(null); // null | 'granted' | 'denied' | 'loading'
  const hasSubscribedRef = React.useRef(false);

  // Verificar si ya tiene permisos al cargar
  useEffect(() => {
    if ('Notification' in window) {
      setPushStatus(Notification.permission === 'granted' ? 'granted' : 
                    Notification.permission === 'denied' ? 'denied' : null);
    }
  }, []);

    // If we already have a client and permission is granted, ensure we are subscribed
    useEffect(() => {
      if (client && pushStatus === 'granted' && !hasSubscribedRef.current) {
        (async () => {
          try {
            await subscribeToPush(activeBiz.id, client.email);
            hasSubscribedRef.current = true;
            console.log('✅ Push subscribed on load (client present)');
          } catch (e) {
            console.warn('Push subscription on load failed:', e);
          }
        })();
      }
    }, [client, pushStatus, activeBiz.id]);

  const currentStamps = client ? client.stamps : 0;
  const totalRequired = activeBiz.totalStampsRequired || 8;
  const isRewardUnlocked = currentStamps >= totalRequired;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>

      {/* Banner de notificación push — solo aparece si se abrió desde una notificación */}
      {notifMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95), rgba(49, 46, 129, 0.95))',
          border: '2px solid #6366f1',
          borderRadius: '16px',
          padding: '1.2rem 1.4rem',
          marginBottom: '1.5rem',
          color: '#fff',
          boxShadow: '0 12px 35px rgba(99, 102, 241, 0.35)'
        }}>
          <div style={{
            fontSize: '1.8rem',
            background: 'rgba(99, 102, 241, 0.25)',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            🔔
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '4px'
            }}>
              <span style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {activeBiz.name}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#c7d2fe', opacity: 0.8 }}>
                Recién llegada
              </span>
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>
              {notifMsg}
            </div>
          </div>
        </div>
      )}

      {/* Intro Header — solo para modo normal sin notificación */}
      {!notifMsg && !isPublicOnly && (
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(99, 102, 241, 0.15)',
          color: '#818cf8',
          padding: '0.35rem 0.9rem',
          borderRadius: '20px',
          fontSize: '0.85rem',
          fontWeight: '600',
          marginBottom: '0.75rem'
        }}>
          <Sparkles size={16} /> Alta en 20 segundos sin descargar ninguna app
        </div>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>
          Tarjeta Digital de {activeBiz.name}
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '560px', margin: '0 auto' }}>
          Guárdala directamente en tu <strong>Apple Wallet</strong> o <strong>Google Wallet</strong>. Recibe sellos en caja escaneando el código QR.
        </p>
      </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'min(100%, 420px)', gap: '1.5rem', alignItems: 'start', justifyContent: 'center' }}>
        
        {/* Registration Form: SOLO si NO hay cliente registrado y NO viene de notificación */}
        {!client && !notifMsg && (
          <div className="glass-card" style={{ borderTop: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '2rem' }}>{activeBiz.logo}</div>
              <div>
                <h3 style={{ fontSize: '1.2rem' }}>Obtén tu Tarjeta de Sellos</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ingresa tus datos para vincular tu pase</p>
              </div>
            </div>

            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">Nombre Completo *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ej. María González"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Correo Electrónico *</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Teléfono (opcional)</label>
                <input 
                  type="tel" 
                  className="form-input" 
                  placeholder="+57 300 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* Device Selector */}
              <div className="form-group">
                <label className="form-label">Selecciona tu dispositivo:</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setWalletView('apple')}
                    style={{
                      padding: '0.6rem',
                      borderRadius: '8px',
                      border: walletView === 'apple' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      background: walletView === 'apple' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                      color: '#fff',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    🍏 iPhone
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalletView('google')}
                    style={{
                      padding: '0.6rem',
                      borderRadius: '8px',
                      border: walletView === 'google' ? '2px solid #4285F4' : '1px solid var(--border-color)',
                      background: walletView === 'google' ? 'rgba(66, 133, 244, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                      color: '#fff',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    🤖 Android
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalletView('web')}
                    style={{
                      padding: '0.6rem',
                      borderRadius: '8px',
                      border: walletView === 'web' ? '2px solid var(--success)' : '1px solid var(--border-color)',
                      background: walletView === 'web' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                      color: '#fff',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    🌐 Web
                  </button>
                </div>
              </div>

              {/* Consent Checkboxes */}
              <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '0.85rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
                <label className="form-checkbox-label" style={{ marginBottom: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    checked={consentMarketing} 
                    onChange={(e) => setConsentMarketing(e.target.checked)} 
                  />
                  <span>Acepto recibir novedades y promociones exclusivas en mi Wallet.</span>
                </label>
                <label className="form-checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={consentLocation} 
                    onChange={(e) => setConsentLocation(e.target.checked)} 
                  />
                  <span>Permitir recordatorio por ubicación cuando esté cerca del local.</span>
                </label>
              </div>

              <button 
                type="submit" 
                className="cashier-action-btn btn-stamp"
                style={{ fontSize: '1rem', padding: '0.9rem' }}
              >
                <Download size={20} /> Guardar mi Tarjeta Digital
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                <ShieldCheck size={14} color="#10b981" /> Protección de datos según Ley 1581 de 2012
              </p>
            </form>
          </div>
        )}

        {/* Digital Wallet Card Display */}
        {client && (
          <div>
            
            {/* Wallet Switcher Tabs — solo en vista completa de desarrollo/admin */}
            {!isPublicOnly && !notifMsg && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <button 
                onClick={() => setWalletView('apple')}
                className={`badge ${walletView === 'apple' ? 'badge-apple' : ''}`}
                style={{ padding: '0.5rem 1rem', cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: '20px' }}
              >
                🍏 Apple Wallet (.pkpass)
              </button>
              <button 
                onClick={() => setWalletView('google')}
                className={`badge ${walletView === 'google' ? 'badge-google' : ''}`}
                style={{ padding: '0.5rem 1rem', cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: '20px' }}
              >
                🤖 Google Wallet (API)
              </button>
              <button 
                onClick={() => setWalletView('web')}
                className={`badge ${walletView === 'web' ? 'badge-web' : ''}`}
                style={{ padding: '0.5rem 1rem', cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: '20px' }}
              >
                🌐 Versión Web
              </button>
            </div>
            )}

            {/* Interactive Pass Container */}
            <div className="pass-wrapper">
              <div 
                className="wallet-card" 
                style={{ 
                  backgroundColor: activeBiz.bgColor || '#2C1810',
                  color: activeBiz.textColor || '#FFF',
                  minHeight: '440px'
                }}
              >
                {/* Header */}
                <div className="wallet-card-header">
                  <div className="wallet-brand-name">
                    <span>{activeBiz.logo}</span>
                    <span>{activeBiz.name}</span>
                  </div>
                  <span className="wallet-pass-type">
                    {walletView === 'apple' ? 'Apple Wallet' : walletView === 'google' ? 'Google Pay' : 'Digital Pass'}
                  </span>
                </div>

                {/* Banner / Header Image */}
                <div 
                  className="wallet-card-banner"
                  style={{ backgroundImage: `url(${activeBiz.headerImage})` }}
                >
                  <div style={{ position: 'absolute', bottom: '10px', left: '15px', right: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 2 }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase', fontWeight: 600 }}>TITULAR DE LA TARJETA</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{client.name}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase', fontWeight: 600 }}>AVANCE</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: activeBiz.accentColor || '#f59e0b' }}>
                        {currentStamps} / {totalRequired}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stamp Grid */}
                <div style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.5rem', fontWeight: 600, textAlign: 'center' }}>
                    {isRewardUnlocked ? '🎉 ¡META ALCANZADA! MUESTRA ESTA TARJETA PARA RECLAMAR' : 'SELLOS ACUMULADOS EN TU VISITA'}
                  </div>

                  <div className="wallet-stamps-grid">
                    {Array.from({ length: totalRequired }).map((_, i) => {
                      const isFilled = i < currentStamps;
                      return (
                        <div 
                          key={i} 
                          className={`stamp-slot ${isFilled ? 'filled' : ''}`}
                          style={{
                            borderColor: isFilled ? (activeBiz.accentColor || '#f59e0b') : 'rgba(255, 255, 255, 0.25)'
                          }}
                        >
                          <span>{isFilled ? activeBiz.stampShape : '⚪'}</span>
                          <span className="stamp-number">{i + 1}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reward Terms Banner */}
                <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(0, 0, 0, 0.25)', fontSize: '0.75rem' }}>
                  <div style={{ fontWeight: 700, color: activeBiz.accentColor || '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    🎁 PREMIO: {activeBiz.rewardTitle}
                  </div>
                  <div style={{ opacity: 0.7, fontSize: '0.7rem', marginTop: '2px' }}>
                    {activeBiz.rewardTerms}
                  </div>
                </div>

                {/* Card Footer with QR code */}
                <div className="wallet-card-footer">
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>ID UNIC DE PASE</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700 }}>{client.passId}</div>
                    {client.totalRedeemed > 0 && (
                      <div style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 600, marginTop: '2px' }}>
                        🏆 {client.totalRedeemed} premios canjeados
                      </div>
                    )}
                  </div>
                  
                  {qrDataUrl && (
                    <div style={{ background: '#fff', padding: '4px', borderRadius: '8px' }}>
                      <img src={qrDataUrl} alt="QR Code" style={{ width: '64px', height: '64px', display: 'block' }} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Wallet Action & Download Button */}
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              {walletView === 'apple' && (
                <button 
                  onClick={async () => {
                    try {
                      const res = await fetch(`${BACKEND_URL}/api/apple-wallet/pass`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ business: activeBiz, client })
                      });
                      
                      const contentType = res.headers.get('content-type');
                      if (contentType && contentType.includes('application/vnd.apple.pkpass')) {
                        const blob = await res.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${client.passId}.pkpass`;
                        a.click();
                      } else {
                        const data = await res.json();
                        alert(`ℹ️ Modo Demo (Apple Wallet):\n\n${data.message || 'Se requiere certificado .p12 de Apple Developer ($99/año) para generar el archivo .pkpass firmado. El backend ya está 100% programado y listo para recibir tus credenciales.'}`);
                      }
                    } catch (err) {
                      alert(`ℹ️ Modo Demo (Apple Wallet):\n\nPara pases reales de Apple se necesita el certificado .p12 de Apple Developer ($99/año). El backend ya está programado en /server/services/appleWallet.js`);
                    }
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    background: '#000',
                    color: '#fff',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.4)'
                  }}
                >
                  <Download size={18} /> Agregar a Apple Wallet (.pkpass)
                </button>
              )}

              {walletView === 'google' && (
                <button 
                  onClick={async () => {
                    try {
                      const res = await fetch(`${BACKEND_URL}/api/google-wallet/save`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ business: activeBiz, client })
                      });
                      const data = await res.json();

                      if (data.saveUrl && data.mode === 'production') {
                        window.open(data.saveUrl, '_blank');
                      } else {
                        alert(`🤖 Modo Demo (Google Wallet):\n\n${data.message || 'Gratis: Solo necesitas crear una Service Account en Google Cloud y poner el archivo .json en /server/credentials/. El backend de Node.js ya está listo.'}`);
                      }
                    } catch (err) {
                      alert(`🤖 Modo Demo (Google Wallet - Gratis):\n\nEl backend Node.js está listo en /server/services/googleWallet.js. Solo requiere colocar tu Service Account JSON de Google Pay Console para abrir el guardado nativo en Android.`);
                    }
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    background: '#4285F4',
                    color: '#fff',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    border: 'none',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(66, 133, 244, 0.4)'
                  }}
                >
                  <Download size={18} /> Guardar en Google Wallet
                </button>
              )}

              {walletView === 'web' && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  🔖 Esta tarjeta queda guardada en el navegador del cliente sin app.
                </div>
              )}

              {/* Aviso si notificaciones bloqueadas */}
              {pushStatus === 'denied' && (
                <div style={{
                  marginTop: '1rem', textAlign: 'center',
                  background: 'rgba(239, 68, 68, 0.12)', color: '#f87171',
                  padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.82rem', lineHeight: 1.5
                }}>
                  ⚠️ <strong>Notificaciones bloqueadas.</strong><br/>
                  En Chrome toca el ícono 🔒 en la barra de dirección → <strong>Configuración del sitio</strong> → <strong>Notificaciones → Permitir</strong>, luego recarga la página.
                </div>
              )}
              {pushStatus === 'granted' && (
                <div style={{
                  marginTop: '1rem', textAlign: 'center',
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(16, 185, 129, 0.12)', color: '#10b981',
                  padding: '0.6rem 1.2rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '600', width: '100%', justifyContent: 'center'
                }}>
                  <Bell size={15} /> Notificaciones activadas ✓
                </div>
              )}
              {/* Botón para activar notificaciones si aún no están concedidas */}
              {pushStatus !== 'granted' && pushStatus !== 'denied' && (
                <button
                  onClick={async () => {
                    setPushStatus('loading');
                    try {
                      const result = await subscribeToPush(activeBiz.id, client.email);
                      if (result) {
                        setPushStatus('granted');
                        hasSubscribedRef.current = true;
                      } else {
                        setPushStatus(Notification.permission === 'denied' ? 'denied' : null);
                      }
                    } catch (e) {
                      setPushStatus(null);
                    }
                  }}
                  style={{
                    marginTop: '1rem', width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '0.5rem',
                    background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8',
                    padding: '0.7rem 1rem', borderRadius: '10px', fontSize: '0.9rem',
                    fontWeight: '600', cursor: 'pointer', border: '1px solid rgba(99,102,241,0.3)'
                  }}
                >
                  <Bell size={16} /> {pushStatus === 'loading' ? 'Activando…' : '🔔 Activar notificaciones push'}
                </button>
              )}
              {/* Si notificaciones concedidas pero ref indica que no se suscribió, reintentar */}
              {pushStatus === 'granted' && !hasSubscribedRef.current && client && (
                <button
                  onClick={async () => {
                    try {
                      await subscribeToPush(activeBiz.id, client.email);
                      hasSubscribedRef.current = true;
                    } catch (e) {
                      console.warn('Reintento de suscripción falló:', e);
                    }
                  }}
                  style={{
                    marginTop: '0.5rem', width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '0.5rem',
                    background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
                    padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.82rem',
                    fontWeight: '600', cursor: 'pointer', border: '1px solid rgba(16,185,129,0.3)'
                  }}
                >
                  🔄 Sincronizar suscripción push
                </button>
              )}
            </div>

            {/* Live Lockscreen Proximity & Mass Message Notification Preview — solo para modo admin/demo */}
            {!isPublicOnly && !notifMsg && (
              <div style={{ marginTop: '2.5rem' }}>
                <h4 style={{ fontSize: '1rem', textAlign: 'center', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                  📲 Simulación de Notificación en Pantalla de Bloqueo
                </h4>

                <div className="lockscreen-preview">
                  <div className="lockscreen-header">
                    <span>9:41 AM</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <MapPin size={13} color="#10b981" />
                      <Bell size={13} />
                    </div>
                  </div>

                  <div className="notification-pill">
                    <div className="notification-top">
                      <div className="notification-title">
                        <span>{activeBiz.logo}</span>
                        <span>{activeBiz.name}</span>
                      </div>
                      <span className="notification-time">Ahora</span>
                    </div>

                    <div className="notification-body">
                      {activeBiz.lastBroadcastMessage || activeBiz.proximityMessage}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
