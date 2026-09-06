import React, { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../context/CartContext';
import { CategoryFilter } from '../components/pos/CategoryFilter';
import { ProductCard } from '../components/pos/ProductCard';
import { CartDrawer } from '../components/pos/CartDrawer';
import { ReceiptModal } from '../components/pos/ReceiptModal';
import { ReceiptData } from '../types/pos';
import { formatRupiah, getTodayDateString } from '../lib/formatters';
import { localDb } from '../lib/db';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ShoppingBag, Search, History } from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { SalesHistoryModal } from '../components/pos/SalesHistoryModal';

export const PosPage: React.FC = () => {
  const { activeProducts, loading } = useProducts();
  const { cart, addToCart, removeFromCart, updateQty, clearCart, totalQty, totalOmzet } = useCart();

  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const categories = ['Semua', 'Terang Bulan', 'Martabak'];

  const filteredProducts = activeProducts.filter((product) => {
    const matchesCat = selectedCategory === 'Semua' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getProductCartQty = (id: string) => {
    const item = cart.find(c => c.product.id === id);
    return item ? item.qty : 0;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    const todayDate = getTodayDateString();
    const transactionNo = `${Date.now().toString().slice(-4)}`;
    const transactionId = 'trx_' + Date.now();

    const saleItems = cart.map(item => ({
      product_id: item.product.id,
      product_name: item.product.name,
      qty: item.qty,
      unit_price: item.product.selling_price || 0,
      unit_hpp: item.product.hpp_per_pcs || 0,
      subtotal_omzet: (item.product.selling_price || 0) * item.qty,
      subtotal_hpp: (item.product.hpp_per_pcs || 0) * item.qty,
    }));

    const totalHpp = saleItems.reduce((acc, i) => acc + i.subtotal_hpp, 0);

    try {
      // 1. Save to local Dexie database (works offline)
      await localDb.offlineSales.add({
        local_id: transactionId,
        transaction_date: todayDate,
        transaction_no: transactionNo,
        items: saleItems,
        total_omzet: totalOmzet,
        total_hpp: totalHpp,
        synced: isSupabaseConfigured ? 1 : 0,
        created_at: new Date().toISOString()
      });

      // 2. Sync to Supabase if configured
      if (isSupabaseConfigured) {
        const { data: trxData, error: trxErr } = await supabase
          .from('sale_transactions')
          .insert([{
            transaction_date: todayDate,
            transaction_no: transactionNo
          }])
          .select()
          .single();

        if (!trxErr && trxData) {
          const itemsPayload = cart.map(item => ({
            transaction_id: trxData.id,
            product_id: item.product.id,
            qty: item.qty,
            unit_price: item.product.selling_price || 0,
            unit_hpp: item.product.hpp_per_pcs || 0
          }));
          await supabase.from('sale_items').insert(itemsPayload);
        }
      }

      // Show Receipt
      setReceipt({
        transaction_id: transactionId,
        transaction_no: transactionNo,
        transaction_date: todayDate,
        items: cart.map(item => ({
          name: item.product.name,
          qty: item.qty,
          unit_price: item.product.selling_price || 0,
          subtotal: (item.product.selling_price || 0) * item.qty
        })),
        total_omzet: totalOmzet,
        created_at: new Date().toISOString()
      });

      clearCart();
      setIsCartOpen(false);
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Terjadi kesalahan saat memproses transaksi');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Menyiapkan daftar menu..." />;
  }

  return (
    <div className="space-y-3">
      {/* Search Bar & Riwayat Nota Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Terang Bulan atau Martabak..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 px-3 py-2.5 rounded-2xl text-xs font-semibold text-slate-700 shadow-xs active:scale-95 transition-all"
          title="Lihat Riwayat Nota Hari Ini"
        >
          <History className="w-4 h-4 text-amber-500" />
          <span>Riwayat</span>
        </button>
      </div>

      {/* Category Pills */}
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            quantityInCart={getProductCartQty(product.id)}
            onAddToCart={addToCart}
            onRemoveFromCart={removeFromCart}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <p className="text-xs">Tidak ada produk yang cocok dengan pencarian.</p>
        </div>
      )}

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-30">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xs">
                {totalQty}
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-400">Total Nota</p>
                <p className="text-sm font-bold text-amber-400">{formatRupiah(totalOmzet)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/10 px-3 py-1.5 rounded-xl">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Lihat Nota</span>
            </div>
          </button>
        </div>
      )}

      {/* Cart Drawer & Receipt Modal */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQty={updateQty}
        onClearCart={clearCart}
        onCheckout={handleCheckout}
        isProcessing={isProcessing}
      />

      <ReceiptModal
        receipt={receipt}
        onClose={() => setReceipt(null)}
      />

      <SalesHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onViewReceipt={(r) => {
          setIsHistoryOpen(false);
          setReceipt(r);
        }}
      />
    </div>
  );
};
