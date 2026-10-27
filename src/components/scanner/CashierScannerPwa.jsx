import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { QrCode, Search, PlusCircle, Gift, Check, AlertTriangle, Wifi, WifiOff, User, History, ArrowRight } from 'lucide-react';
import { getActiveBusiness, getStoreData, addStampToClient, redeemReward } from '../../services/store';
import { playStampSound, playRewardSound } from '../../services/audio';

export default function CashierScannerPwa() {
  const [activeBiz, setActiveBiz] = useState(getActiveBusiness());
  const [storeData, setStoreDataState] = useState(getStoreData());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);
  const [cooldownWarning, setCooldownWarning] = useState(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [staffName, setStaffName] = useState('Cajero Juan');

  useEffect(() => {
    const handleUpdate = () => {
      setActiveBiz(getActiveBusiness());
      const data = getStoreData();
      setStoreDataState(data);
      if (selectedClient) {
        const updated = data.clients.find(c => c.id === selectedClient.id);
        if (updated) setSelectedClient(updated);
      }
    };
    window.addEventListener('loyalty_store_updated', handleUpdate);
    return () => window.removeEventListener('loyalty_store_updated', handleUpdate);
  }, [selectedClient]);

  // Filter clients by search query
  const bizClients = storeData.clients.filter(c => c.businessId === activeBiz.id);
  const filteredClients = searchQuery.trim() === '' 
    ? bizClients 
    : bizClients.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        c.passId.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setCooldownWarning(null);
    setActionSuccessMsg(null);
  };

  const handleAddStamp = () => {
    if (!selectedClient) return;

    // Call store addStampToClient
    const result = addStampToClient(selectedClient.id, staffName);

    if (!result.success) {
      alert(result.error);
      return;
    }

    playStampSound();

    if (result.isRewardReady) {
      playRewardSound();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setActionSuccessMsg(`🎉 ¡PREMIO DESBLOQUEADO! ${selectedClient.name} completó ${result.newStamps}/${result.totalRequired} sellos.`);
    } else {
      setActionSuccessMsg(`✅ +1 Sello registrado. ${selectedClient.name} lleva ${result.newStamps} de ${result.totalRequired} sellos.`);
    }

    // Auto clear success msg after 4s
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleRedeem = () => {
    if (!selectedClient) return;

    const result = redeemReward(selectedClient.id, staffName);
    if (result.success) {
      playRewardSound();
      confetti({ particleCount: 80, spread: 60 });
      setActionSuccessMsg(`🏆 Premio de ${selectedClient.name} marcado como CANJEADO. La tarjeta se ha reiniciado a 0 sellos.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } else {
      alert(result.error);
    }
  };

  const currentStamps = selectedClient ? selectedClient.stamps : 0;
  const totalRequired = activeBiz.totalStampsRequired || 8;
  const isRewardReady = currentStamps >= totalRequired;

  return (
    <div className="scanner-container">
      {/* Top Cashier Bar */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '1.5rem' }}>{activeBiz.logo}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{activeBiz.name} — Escáner PWA</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={12} /> Turno: 
              <input 
                type="text" 
                value={staffName} 
                onChange={(e) => setStaffName(e.target.value)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '0.75rem', outline: 'none', width: '110px' }}
              />
            </div>
          </div>
        </div>

        <button 
          onClick={() => setIsOfflineMode(!isOfflineMode)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.75rem',
            borderRadius: '20px',
            border: 'none',
            fontSize: '0.75rem',
            fontWeight: 700,
            background: isOfflineMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            color: isOfflineMode ? '#f87171' : '#34d399',
            cursor: 'pointer'
          }}
        >
          {isOfflineMode ? <WifiOff size={14} /> : <Wifi size={14} />}
          {isOfflineMode ? 'Modo Offline (Cola)' : 'En Línea'}
        </button>
      </div>

      {/* Camera QR Scanner Box */}
      <div className="glass-card" style={{ textAlign: 'center', marginBottom: '1.25rem', position: 'relative' }}>
        {!isCameraActive ? (
          <div style={{ padding: '1.5rem 0' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '24px', 
              background: 'rgba(99, 102, 241, 0.15)', 
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              <QrCode size={40} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>Escanear QR de Pase</h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Apunta la cámara del celular al código QR de la tarjeta Apple/Google Wallet del cliente.
            </p>

            <button 
              className="nav-tab-btn active"
              onClick={() => setIsCameraActive(true)}
              style={{ margin: '0 auto', padding: '0.75rem 1.5rem', fontSize: '1rem' }}
            >
              📷 Activar Cámara Escáner
            </button>
          </div>
        ) : (
          <div style={{ padding: '1rem' }}>
            <div style={{ 
              position: 'relative', 
              width: '100%', 
              height: '240px', 
              background: '#000', 
              borderRadius: '16px', 
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--primary)'
            }}>
              {/* Simulated Camera Viewfinder Frame */}
              <div style={{
                position: 'absolute',
                width: '160px',
                height: '160px',
                border: '3px dashed #6366f1',
                borderRadius: '16px',
                animation: 'pulse 1.5s infinite'
              }}></div>
              <p style={{ color: '#fff', fontSize: '0.85rem', zIndex: 10, background: 'rgba(0,0,0,0.6)', padding: '0.4rem 0.8rem', borderRadius: '8px' }}>
                Buscando código QR del cliente...
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button 
                onClick={() => {
                  // Simulate scanning client 1 (María)
                  const mariac = bizClients.find(c => c.name.includes('María')) || bizClients[0];
                  if (mariac) handleSelectClient(mariac);
                  setIsCameraActive(false);
                }}
                className="nav-tab-btn"
                style={{ flex: 1, background: 'rgba(99, 102, 241, 0.2)', color: '#fff', justifyContent: 'center' }}
              >
                ⚡ Simular Escaneo Exitoso
              </button>
              <button 
                onClick={() => setIsCameraActive(false)}
                className="nav-tab-btn"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Search Bar */}
      <div className="glass-card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="🔍 Buscar por Nombre, Email, Teléfono o ID Pase..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        {/* Quick select client chips */}
        {searchQuery.trim() !== '' && (
          <div style={{ marginTop: '0.75rem', maxHeight: '180px', overflowY: 'auto' }}>
            {filteredClients.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.5rem' }}>No se encontraron clientes con esa búsqueda.</div>
            ) : (
              filteredClients.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => handleSelectClient(c)}
                  style={{
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    background: selectedClient?.id === c.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    marginBottom: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{c.name}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{c.email} • {c.passId}</div>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{c.stamps}/{totalRequired} sellos</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected Client Stamping Interface */}
      {selectedClient ? (
        <div className="glass-card" style={{ border: isRewardReady ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>CLIENTE SELECCIONADO</div>
              <h2 style={{ fontSize: '1.4rem' }}>{selectedClient.name}</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedClient.email} • {selectedClient.passId}</div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SELLOS ACUMULADOS</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: isRewardReady ? 'var(--accent-gold)' : 'var(--primary)' }}>
                {currentStamps} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {totalRequired}</span>
              </div>
            </div>
          </div>

          {/* Action Success Alert Banner */}
          {actionSuccessMsg && (
            <div style={{
              background: isRewardReady ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              border: isRewardReady ? '1px solid var(--accent-gold)' : '1px solid var(--success)',
              color: '#fff',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 600,
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Check size={18} color={isRewardReady ? '#f59e0b' : '#34d399'} />
              <span>{actionSuccessMsg}</span>
            </div>
          )}

          {/* Main Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {!isRewardReady ? (
              <button 
                onClick={handleAddStamp}
                className="cashier-action-btn btn-stamp"
              >
                <PlusCircle size={24} /> +1 SELLO EN 1 TOQUE
              </button>
            ) : (
              <button 
                onClick={handleRedeem}
                className="cashier-action-btn btn-redeem"
              >
                <Gift size={26} /> 🎁 CANJEAR PREMIO ({activeBiz.rewardTitle})
              </button>
            )}
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.85rem' }}>
            ⏱️ Tiempo promedio de procesamiento: <strong>1.8 segundos</strong> • Confirmación sonora activa
          </p>
        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          <User size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
          <p>Selecciona un cliente de la lista de arriba o escanea un código QR para otorgar sellos.</p>
        </div>
      )}
    </div>
  );
}
