import React, { useState } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { MobileLayout } from './components/layout/MobileLayout';
import { NavTab } from './components/layout/BottomNav';
import { PosPage } from './pages/PosPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { RecapPage } from './pages/RecapPage';
import { ProductsPage } from './pages/ProductsPage';
import { SettingsPage } from './pages/SettingsPage';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('pos');
  const { totalQty } = useCart();

  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    pos: { title: 'Kasir Martabak', subtitle: 'Pilih varian untuk nota baru' },
    expenses: { title: 'Catat Pengeluaran', subtitle: 'Belanja bahan & keperluan pribadi' },
    dashboard: { title: 'Sistem 3 Kantong', subtitle: 'Modal Putar • Gaji • Tabungan Usaha' },
    recap: { title: 'Rekap Harian', subtitle: 'Laporan per tanggal real-time' },
    products: { title: 'Master Produk & HPP', subtitle: 'Daftar harga jual & modal per pcs' },
    settings: { title: 'Pengaturan', subtitle: 'Parameter rasio & koneksi sistem' },
  };

  return (
    <MobileLayout
      activeTab={activeTab}
      onChangeTab={setActiveTab}
      cartCount={totalQty}
      title={titles[activeTab].title}
      subtitle={titles[activeTab].subtitle}
    >
      {activeTab === 'pos' && <PosPage />}
      {activeTab === 'expenses' && <ExpensesPage />}
      {activeTab === 'dashboard' && <DashboardPage />}
      {activeTab === 'recap' && <RecapPage />}
      {activeTab === 'products' && <ProductsPage />}
      {activeTab === 'settings' && <SettingsPage />}
    </MobileLayout>
  );
};

export function App() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}

export default App;
