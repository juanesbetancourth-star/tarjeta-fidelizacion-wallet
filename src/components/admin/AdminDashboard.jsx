import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Award, Gift, Send, MapPin, Palette, Download, Sparkles, 
  Search, Sliders, CheckCircle, Smartphone, Bell, AlertTriangle, ShieldCheck, History 
} from 'lucide-react';
import { getActiveBusiness, getStoreData, updateBusiness, sendBroadcastMessage, exportClientsToCSV } from '../../services/store';
import { BACKEND_URL } from '../../config.js';

export default function AdminDashboard() {
  const [activeBiz, setActiveBiz] = useState(getActiveBusiness());
  const [storeData, setStoreDataState] = useState(getStoreData());
  const [adminTab, setAdminTab] = useState('metrics'); // 'metrics' | 'clients' | 'broadcast' | 'geofence' | 'customize'
  const [serverClients, setServerClients] = useState([]); // clientes del backend

  // Broadcast state
  const [broadcastText, setBroadcastText] = useState(activeBiz.lastBroadcastMessage || '');
  const [broadcastSegment, setBroadcastSegment] = useState('Todos los clientes');
  const [broadcastSuccessMsg, setBroadcastSuccessMsg] = useState(null);

  // Customizer state
  const [bgColor, setBgColor] = useState(activeBiz.bgColor || '#2C1810');
  const [accentColor, setAccentColor] = useState(activeBiz.accentColor || '#D4A373');
  const [stampShape, setStampShape] = useState(activeBiz.stampShape || '☕');
  const [totalStamps, setTotalStamps] = useState(activeBiz.totalStampsRequired || 8);
  const [rewardTitle, setRewardTitle] = useState(activeBiz.rewardTitle || '');
  const [rewardTerms, setRewardTerms] = useState(activeBiz.rewardTerms || '');
  const [customizerSaved, setCustomizerSaved] = useState(false);

  // Geofence state
  const [address, setAddress] = useState(activeBiz.address || '');
  const [latitude, setLatitude] = useState(activeBiz.latitude || '');
  const [longitude, setLongitude] = useState(activeBiz.longitude || '');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [proximityRadius, setProximityRadius] = useState(activeBiz.proximityRadiusMeters || 400);
  const [proximityMessage, setProximityMessage] = useState(activeBiz.proximityMessage || '');
  const [geofenceSaved, setGeofenceSaved] = useState(false);

  // Client search state
  const [clientFilter, setClientFilter] = useState('');

  // Cargar clientes del backend (sincronizados desde celulares)
  const fetchServerClients = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/clients`);
      const data = await res.json();
      if (data.success) setServerClients(data.clients);
    } catch (err) {
      console.warn('No se pudo conectar al backend para cargar clientes:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchServerClients();
    // Recargar cada 10 segundos para ver nuevos registros en tiempo real
    const interval = setInterval(fetchServerClients, 10000);
    return () => clearInterval(interval);
  }, [fetchServerClients]);

  useEffect(() => {
    const handleUpdate = () => {
      const biz = getActiveBusiness();
      const data = getStoreData();
      setActiveBiz(biz);
      setStoreDataState(data);
    };
    window.addEventListener('loyalty_store_updated', handleUpdate);
    return () => window.removeEventListener('loyalty_store_updated', handleUpdate);
  }, []);

  // Mezclar clientes del localStorage con los del backend (evitando duplicados por email)
  const localClients = storeData.clients.filter(c => c.businessId === activeBiz.id);
  const serverBizClients = serverClients.filter(c => c.businessId === activeBiz.id);
  const mergedEmails = new Set(localClients.map(c => c.email.toLowerCase()));
  const newFromServer = serverBizClients.filter(c => !mergedEmails.has(c.email.toLowerCase()));
  const bizClients = [...localClients, ...newFromServer];
  const filteredClients = clientFilter.trim() === ''
    ? bizClients
    : bizClients.filter(c => 
        c.name.toLowerCase().includes(clientFilter.toLowerCase()) ||
        c.email.toLowerCase().includes(clientFilter.toLowerCase()) ||
        c.passId.toLowerCase().includes(clientFilter.toLowerCase())
      );

  const totalStampsIssued = storeData.stampLogs
    .filter(l => l.businessId === activeBiz.id && l.type === 'stamp')
    .length;

  const totalRedeemed = bizClients.reduce((acc, c) => acc + (c.totalRedeemed || 0), 0);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;

    // 1. Guardar en localStorage (actualiza la vista local)
    const result = sendBroadcastMessage({
      messageText: broadcastText,
      segment: broadcastSegment
    });

    // 2. Enviar al backend → Google Wallet addMessage (notificación real en Android)
    try {
      const res = await fetch(`${BACKEND_URL}/api/google-wallet/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: broadcastText, segment: broadcastSegment }),
      });
      const data = await res.json();

      // 3. También enviar Web Push (notificación en barra del celular)
      const pushRes = await fetch(`${BACKEND_URL}/api/push/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `🔔 ${activeBiz.name}`,
          message: broadcastText,
          businessId: activeBiz.id,
        }),
      });
      const pushData = await pushRes.json();

      setBroadcastSuccessMsg(
        `✅ Notificación enviada: ${pushData.sent || 0} dispositivo(s) recibieron la alerta. Google Wallet: ${data.processed || 0} pase(s) actualizados.`
      );
    } catch (err) {
      // Si el backend no está disponible, al menos mostrar resultado local
      if (result.success) {
        setBroadcastSuccessMsg(`✅ Mensaje guardado localmente (${result.recipientsCount} clientes). El backend no respondió.`);
      }
    }

    setTimeout(() => setBroadcastSuccessMsg(null), 7000);
  };

  const handleSaveCustomization = (e) => {
    e.preventDefault();
    updateBusiness({
      bgColor,
      accentColor,
      stampShape,
      totalStampsRequired: Number(totalStamps),
      rewardTitle,
      rewardTerms
    });
    setCustomizerSaved(true);
    setTimeout(() => setCustomizerSaved(false), 3000);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setDetectingLocation(false);
      },
      () => {
        alert('No se pudo obtener la ubicación. Asegúrate de dar permiso en el navegador.');
        setDetectingLocation(false);
      }
    );
  };

  const handleSaveGeofence = (e) => {
    e.preventDefault();
    updateBusiness({
      address,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      proximityRadiusMeters: Number(proximityRadius),
      proximityMessage
    });
    setGeofenceSaved(true);
    setTimeout(() => setGeofenceSaved(false), 3000);
  };

  return (
    <div>
      {/* Top Admin Bar Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>{activeBiz.logo}</span> Panel de Control — {activeBiz.name}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            SaaS de fidelización digital sin app • Datos del negocio 100% exportables
          </p>
        </div>

        <button 
          onClick={exportClientsToCSV}
          className="nav-tab-btn"
          style={{ background: 'linear-gradient(135deg, var(--success), #059669)', color: '#fff', padding: '0.65rem 1.25rem' }}
        >
          <Download size={18} /> Exportar Clientes a CSV
        </button>
      </div>

      {/* Admin Nav Subtabs */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
        <button 
          className={`nav-tab-btn ${adminTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setAdminTab('metrics')}
        >
          <Award size={16} /> Métricas
        </button>

        <button 
          className={`nav-tab-btn ${adminTab === 'clients' ? 'active' : ''}`}
          onClick={() => setAdminTab('clients')}
        >
          <Users size={16} /> Clientes ({bizClients.length})
        </button>

        <button 
          className={`nav-tab-btn ${adminTab === 'broadcast' ? 'active' : ''}`}
          onClick={() => setAdminTab('broadcast')}
        >
          <Send size={16} /> Mensajes Masivos
        </button>

        <button 
          className={`nav-tab-btn ${adminTab === 'geofence' ? 'active' : ''}`}
          onClick={() => setAdminTab('geofence')}
        >
          <MapPin size={16} /> Geocerca & Cercanía
        </button>

        <button 
          className={`nav-tab-btn ${adminTab === 'customize' ? 'active' : ''}`}
          onClick={() => setAdminTab('customize')}
        >
          <Palette size={16} /> Personalizar Tarjeta
        </button>
      </div>

      {/* -------------------- TAB 1: METRICS -------------------- */}
      {adminTab === 'metrics' && (
        <div>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon"><Users size={24} /></div>
              <div>
                <div className="metric-value">{bizClients.length}</div>
                <div className="metric-label">Clientes Registrados</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}><Award size={24} /></div>
              <div>
                <div className="metric-value">{totalStampsIssued}</div>
                <div className="metric-label">Sellos Otorgados</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}><Gift size={24} /></div>
              <div>
                <div className="metric-value">{totalRedeemed}</div>
                <div className="metric-label">Premios Canjeados</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}><Sparkles size={24} /></div>
              <div>
                <div className="metric-value">84.2%</div>
                <div className="metric-label">Tasa de Recompra</div>
              </div>
            </div>
          </div>

          {/* Quick activity logs */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} /> Historial de Actividad Reciente (Caja)
            </h3>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Fecha / Hora</th>
                    <th>Cliente</th>
                    <th>Acción</th>
                    <th>Personal de Caja</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {storeData.stampLogs.filter(l => l.businessId === activeBiz.id).slice(0, 5).map(log => {
                    const clientObj = storeData.clients.find(c => c.id === log.clientId);
                    return (
                      <tr key={log.id}>
                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                        <td style={{ fontWeight: 700 }}>{clientObj ? clientObj.name : 'Cliente'}</td>
                        <td>
                          <span className={`badge ${log.type === 'stamp' ? 'badge-apple' : 'badge-web'}`}>
                            {log.type === 'stamp' ? '+1 Sello' : '🎁 Premio'}
                          </span>
                        </td>
                        <td>{log.staffName}</td>
                        <td>{log.note}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- TAB 2: CLIENT DIRECTORY -------------------- */}
      {adminTab === 'clients' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem' }}>Directorio de Clientes ({filteredClients.length})</h3>

            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Filtrar por nombre o email..."
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                style={{ paddingLeft: '2.2rem', padding: '0.5rem 0.5rem 0.5rem 2.2rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID Pase</th>
                  <th>Cliente</th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th>Sellos</th>
                  <th>Premios</th>
                  <th>Wallet</th>
                  <th>Consentimiento</th>
                  <th>Última Visita</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{c.passId}</td>
                    <td style={{ fontWeight: 700 }}>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.phone || '-'}</td>
                    <td>
                      <span style={{ fontWeight: 800, color: 'var(--primary)' }}>
                        {c.stamps} / {activeBiz.totalStampsRequired}
                      </span>
                    </td>
                    <td>🏆 {c.totalRedeemed}</td>
                    <td>
                      <span className={`badge ${c.walletType === 'apple' ? 'badge-apple' : c.walletType === 'google' ? 'badge-google' : 'badge-web'}`}>
                        {c.walletType}
                      </span>
                    </td>
                    <td>
                      {c.consentMarketing ? (
                        <span style={{ color: '#34d399', fontSize: '0.75rem' }}>✓ Mensajes y Ubicación</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Solo Tarjeta</span>
                      )}
                    </td>
                    <td>{new Date(c.lastVisitAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------- TAB 3: BROADCAST MESSAGES -------------------- */}
      {adminTab === 'broadcast' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Send size={20} color="var(--primary)" /> Enviar Mensaje Masivo a Wallet
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Los mensajes se envían como notificaciones de cambio en el pase de Apple Wallet y Google Wallet. Cero costo por mensaje.
            </p>

            {broadcastSuccessMsg && (
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid var(--success)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', color: '#fff' }}>
                {broadcastSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSendBroadcast}>
              <div className="form-group">
                <label className="form-label">Seleccionar Segmento de Clientes</label>
                <select 
                  className="form-select"
                  value={broadcastSegment}
                  onChange={(e) => setBroadcastSegment(e.target.value)}
                >
                  <option value="Todos los clientes">Todos los clientes ({bizClients.length} pases)</option>
                  <option value="Inactivos > 30 días">Inactivos sin visita en &gt;30 días</option>
                  <option value="Cerca del premio">Clientes cerca de completar el premio (&gt;= 75% sellos)</option>
                </select>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="form-label">Mensaje para la Pantalla de Bloqueo</label>
                  <span style={{ fontSize: '0.75rem', color: broadcastText.length > 120 ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {broadcastText.length} / 120 car.
                  </span>
                </div>
                <textarea 
                  className="form-textarea"
                  rows={4}
                  placeholder="Ej. 🎉 ¡2x1 en Cappuccino hoy hasta las 5 PM! Muestra tu pase en caja para aprovechar."
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  maxLength={140}
                  required
                />
              </div>

              <button type="submit" className="cashier-action-btn btn-stamp" style={{ fontSize: '1rem', padding: '0.85rem' }}>
                <Send size={18} /> Confirmar y Enviar Notificación
              </button>
            </form>
          </div>

          {/* Live Mobile Lockscreen Simulator */}
          <div>
            <h4 style={{ fontSize: '1rem', textAlign: 'center', marginBottom: '1rem', color: 'var(--text-muted)' }}>
              📱 Vista previa del aviso en la pantalla de bloqueo del cliente
            </h4>

            <div className="lockscreen-preview">
              <div className="lockscreen-header">
                <span>9:41 AM</span>
                <div style={{ display: 'flex', gap: '4px' }}>
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
                  {broadcastText || 'Escribe un mensaje a la izquierda para ver cómo se desplegará en la pantalla del usuario.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- TAB 4: GEOFENCE / PROXIMITY -------------------- */}
      {adminTab === 'geofence' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={20} color="#10b981" /> Recordatorio por Ubicación (Geocerca)
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Muestra un aviso automático en la pantalla de bloqueo del cliente cuando camina o pasa cerca de tu local.
            </p>

            {geofenceSaved && (
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid var(--success)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', color: '#fff' }}>
                ✅ Configuración de ubicación guardada correctamente.
              </div>
            )}

            <form onSubmit={handleSaveGeofence}>
              <div className="form-group">
                <label className="form-label">Dirección del Local (Referencia)</label>
                <input 
                  type="text"
                  className="form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej. Calle 93 # 12-45, Bogotá"
                />
              </div>

              <div className="form-group">
                <label className="form-label">📍 Coordenadas GPS del Local</label>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detectingLocation}
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.6rem 1.2rem', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '0.75rem', width: '100%' }}
                >
                  {detectingLocation ? '⏳ Detectando ubicación...' : '🌐 Detectar Mi Ubicación Actual'}
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Latitud</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="Ej. 4.710989"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Longitud</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="Ej. -74.072092"
                    />
                  </div>
                </div>
                {latitude && longitude && (
                  <p style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '0.4rem' }}>✅ Coordenadas guardadas: {latitude}, {longitude}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Radio de Cercanía Deseado (Metros)</label>
                <select 
                  className="form-select"
                  value={proximityRadius}
                  onChange={(e) => setProximityRadius(e.target.value)}
                >
                  <option value={200}>200 metros (Inmediación)</option>
                  <option value={400}>400 metros (Recomendado)</option>
                  <option value={800}>800 metros (Zona comercial)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Mensaje de Notificación de Cercanía</label>
                <textarea 
                  className="form-textarea"
                  rows={3}
                  value={proximityMessage}
                  onChange={(e) => setProximityMessage(e.target.value)}
                  placeholder="Ej. ¡Estás cerca! Pasa por tu café del día y suma un sello ☕"
                />
              </div>

              <button type="submit" className="cashier-action-btn btn-stamp" style={{ fontSize: '1rem', padding: '0.85rem' }}>
                💾 Guardar Configuración de Geocerca
              </button>
            </form>
          </div>

          {/* Educational Comparison Box (Honest Technical Limits from PRD Section 6) */}
          <div className="glass-card" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
            <h4 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={18} color="var(--primary)" /> Límites Técnicos Reales (Wallet Specs)
            </h4>

            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '0.75rem' }}>
                🍏 <strong>Apple Wallet:</strong> Altamente fiable. Permite configurar hasta 10 puntos de geolocalización por pase. El radio de ~400 m funciona directamente en la pantalla de bloqueo de iOS sin consumir batería.
              </p>
              <p style={{ marginBottom: '0.75rem' }}>
                🤖 <strong>Google Wallet:</strong> Google decide el radio y la frecuencia del aviso según el nivel de señal GPS y densidad urbana del dispositivo Android.
              </p>
              <p style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                💡 <em>Recomendación de producto:</em> En el panel se presenta como "Recordatorio por Ubicación" y requiere que el cliente tenga activado los servicios de localización.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- TAB 5: CARD CUSTOMIZER -------------------- */}
      {adminTab === 'customize' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Palette size={20} color="var(--primary)" /> Diseñador de Tarjeta y Reglas
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Personaliza los colores de tu marca, figura del sello, meta de sellos y recompensas.
            </p>

            {customizerSaved && (
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid var(--success)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', color: '#fff' }}>
                ✅ Marca y diseño actualizados en tiempo real.
              </div>
            )}

            <form onSubmit={handleSaveCustomization}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Color de Fondo Pase</label>
                  <input 
                    type="color" 
                    value={bgColor} 
                    onChange={(e) => setBgColor(e.target.value)}
                    style={{ width: '100%', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Color de Acento / Sellos</label>
                  <input 
                    type="color" 
                    value={accentColor} 
                    onChange={(e) => setAccentColor(e.target.value)}
                    style={{ width: '100%', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Figura del Sello</label>
                  <select 
                    className="form-select"
                    value={stampShape}
                    onChange={(e) => setStampShape(e.target.value)}
                  >
                    <option value="☕">☕ Taza de Café</option>
                    <option value="⭐">⭐ Estrella</option>
                    <option value="🎯">🎯 Círculo / Diana</option>
                    <option value="🍕">🍕 Pizza</option>
                    <option value="🍔">🍔 Hamburguesa</option>
                    <option value="❤️">❤️ Corazón</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Cantidad de Sellos (Meta)</label>
                  <select 
                    className="form-select"
                    value={totalStamps}
                    onChange={(e) => setTotalStamps(e.target.value)}
                  >
                    <option value={5}>5 Sellos</option>
                    <option value={6}>6 Sellos</option>
                    <option value={8}>8 Sellos (Estándar)</option>
                    <option value={10}>10 Sellos</option>
                    <option value={12}>12 Sellos</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Título del Premio Final</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={rewardTitle}
                  onChange={(e) => setRewardTitle(e.target.value)}
                  placeholder="Ej. Café Gratis + Postre de la casa"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Condiciones / Términos del Premio</label>
                <textarea 
                  className="form-textarea"
                  rows={2}
                  value={rewardTerms}
                  onChange={(e) => setRewardTerms(e.target.value)}
                  placeholder="Ej. Válido por 30 días en cualquier sede."
                />
              </div>

              <button type="submit" className="cashier-action-btn btn-stamp" style={{ fontSize: '1rem', padding: '0.85rem' }}>
                Guardar y Aplicar Cambios de Marca
              </button>
            </form>
          </div>

          {/* Live Card Preview */}
          <div>
            <h4 style={{ fontSize: '1rem', textAlign: 'center', marginBottom: '1rem', color: 'var(--text-muted)' }}>
              👁️ Previsualización en Vivo de la Tarjeta Digital
            </h4>

            <div 
              className="wallet-card"
              style={{
                backgroundColor: bgColor,
                color: '#fff',
                maxWidth: '340px',
                margin: '0 auto'
              }}
            >
              <div className="wallet-card-header">
                <span style={{ fontWeight: 800 }}>{activeBiz.logo} {activeBiz.name}</span>
                <span className="wallet-pass-type">Apple Wallet</span>
              </div>

              <div className="wallet-stamps-grid">
                {Array.from({ length: Number(totalStamps) }).map((_, i) => {
                  const isFilled = i < 3; // Demo fill first 3
                  return (
                    <div 
                      key={i} 
                      className={`stamp-slot ${isFilled ? 'filled' : ''}`}
                      style={{ borderColor: isFilled ? accentColor : 'rgba(255,255,255,0.2)' }}
                    >
                      <span>{isFilled ? stampShape : '⚪'}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.3)', fontSize: '0.75rem' }}>
                <div style={{ color: accentColor, fontWeight: 700 }}>🎁 PREMIO: {rewardTitle}</div>
                <div style={{ opacity: 0.7, fontSize: '0.7rem' }}>{rewardTerms}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
