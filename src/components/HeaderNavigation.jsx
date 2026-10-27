import React from 'react';
import { Smartphone, QrCode, LayoutDashboard, Printer, Store } from 'lucide-react';
import { getStoreData, saveStoreData, getActiveBusiness } from '../services/store';

export default function HeaderNavigation({ activeTab, setActiveTab, onBusinessChange }) {
  const store = getStoreData();
  const activeBiz = getActiveBusiness();

  const handleSelectBusiness = (e) => {
    const bizId = e.target.value;
    store.activeBusinessId = bizId;
    localStorage.setItem('loyalty_wallet_saas_data_v1', JSON.stringify(store));
    window.dispatchEvent(new Event('loyalty_store_updated'));
    if (onBusinessChange) onBusinessChange(bizId);
  };

  return (
    <header className="main-header">
      <div className="header-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <a href="#" className="brand-logo" onClick={(e) => { e.preventDefault(); setActiveTab('client'); }}>
            <span style={{ fontSize: '1.75rem' }}>{activeBiz.logo}</span>
            <div>
              <span>LoyaltyWallet</span>
              <span className="brand-badge" style={{ marginLeft: '0.5rem' }}>SaaS Wallet</span>
            </div>
          </a>

          {/* Business Switcher Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(30, 41, 59, 0.7)', padding: '4px 10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <Store size={15} style={{ color: 'var(--text-muted)' }} />
            <select 
              value={activeBiz.id} 
              onChange={handleSelectBusiness}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {store.businesses.map(b => (
                <option key={b.id} value={b.id} style={{ background: '#1e293b', color: '#fff' }}>
                  {b.logo} {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Surface Navigation Tabs */}
        <nav className="nav-tabs">
          <button 
            className={`nav-tab-btn ${activeTab === 'client' ? 'active' : ''}`}
            onClick={() => setActiveTab('client')}
          >
            <Smartphone size={17} />
            <span>📱 Pase Cliente</span>
          </button>

          <button 
            className={`nav-tab-btn ${activeTab === 'scanner' ? 'active' : ''}`}
            onClick={() => setActiveTab('scanner')}
          >
            <QrCode size={17} />
            <span>📷 Escáner PWA</span>
          </button>

          <button 
            className={`nav-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <LayoutDashboard size={17} />
            <span>📊 Panel Negocio</span>
          </button>

          <button 
            className={`nav-tab-btn ${activeTab === 'stand' ? 'active' : ''}`}
            onClick={() => setActiveTab('stand')}
          >
            <Printer size={17} />
            <span>🖨️ Stand QR</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
