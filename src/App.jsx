import React, { useState, useEffect } from 'react';
import HeaderNavigation from './components/HeaderNavigation';
import ClientPassPage from './components/client/ClientPassPage';
import CashierScannerPwa from './components/scanner/CashierScannerPwa';
import AdminDashboard from './components/admin/AdminDashboard';
import PrintableStandGenerator from './components/admin/PrintableStandGenerator';
import { getStoreData, saveStoreData } from './services/store';

export default function App() {
  const [activeTab, setActiveTab] = useState('client');
  const [isPublicMode, setIsPublicMode] = useState(false);

  useEffect(() => {
    // Detect if client scanned the QR (URL has ?biz= parameter)
    const params = new URLSearchParams(window.location.search);
    const bizId = params.get('biz');
    const tab = params.get('tab');
    const msg = params.get('msg');

    if (bizId) {
      // Switch to that business and enter public client-only mode
      const store = getStoreData();
      const bizExists = store.businesses.find(b => b.id === bizId);
      if (bizExists) {
        store.activeBusinessId = bizId;
        saveStoreData(store);
      }
      setIsPublicMode(true);
      setActiveTab('client');
    }

    // Si viene de una notificación push (?tab=client o ?msg=), ir directo a la tarjeta en modo público
    if (tab === 'client' || msg) {
      setIsPublicMode(true);
      setActiveTab('client');
    }
  }, []);

  // PUBLIC MODE: Client scanned QR o abrió desde notificación push → SOLO la tarjeta (sin tabs de admin)
  if (isPublicMode) {
    return (
      <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <main className="main-body" style={{ paddingTop: '1rem', flex: 1 }}>
          <ClientPassPage isPublicOnly={true} />
        </main>

        <footer style={{
          textAlign: 'center',
          padding: '1.25rem',
          color: 'var(--text-dim)',
          fontSize: '0.75rem'
        }}>
          Impulsado por LoyaltyWallet — Tarjeta Digital sin App
        </footer>
      </div>
    );
  }

  // ADMIN MODE: Full app with all tabs
  return (
    <div className="app-container">
      <HeaderNavigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      <main className="main-body">
        {activeTab === 'client' && <ClientPassPage />}
        {activeTab === 'scanner' && <CashierScannerPwa />}
        {activeTab === 'admin' && <AdminDashboard />}
        {activeTab === 'stand' && <PrintableStandGenerator />}
      </main>

      <footer className="no-print" style={{
        textAlign: 'center',
        padding: '1.5rem',
        color: 'var(--text-dim)',
        fontSize: '0.8rem',
        borderTop: '1px solid var(--border-color)',
        marginTop: '3rem'
      }}>
        LoyaltyWallet SaaS — Tarjetas Digitales en Apple Wallet & Google Wallet • {new Date().getFullYear()}
      </footer>
    </div>
  );
}
