import React, { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { Product } from '../types/database';
import { formatRupiah, formatPercent } from '../lib/formatters';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Plus, Edit2, Search } from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ProductsPage: React.FC = () => {
  const { products, loading, saveProduct } = useProducts();
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'aktif' | 'nonaktif'>('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filtered = products.filter(p => {
    const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setModalOpen(true);
  };

  const handleSave = async (data: Partial<Product>) => {
    setIsSaving(true);
    try {
      await saveProduct(editingProduct ? { ...data, id: editingProduct.id } : data);
      setModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Memuat master produk..." />;
  }

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Master Produk & HPP</h2>
          <p className="text-[11px] text-slate-500">25 Varian Produk (21 Aktif, 4 Nonaktif)</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-1" />
          Tambah
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari varian..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div className="flex gap-2">
          {(['all', 'aktif', 'nonaktif'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all ${
                selectedStatus === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              {st === 'all' ? 'Semua' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="space-y-2">
        {filtered.map((item) => {
          const marginRp = item.selling_price && item.hpp_per_pcs ? item.selling_price - item.hpp_per_pcs : null;
          const marginPct = item.selling_price && marginRp ? marginRp / item.selling_price : null;

          return (
            <div
              key={item.id}
              className={`bg-white p-3 rounded-2xl border transition-all flex items-center justify-between ${
                item.status === 'nonaktif' ? 'opacity-60 border-dashed border-slate-300' : 'border-slate-200/80 shadow-xs'
              }`}
            >
              <div className="flex-1 pr-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                    {item.category}
                  </span>
                  <Badge variant={item.status === 'aktif' ? 'success' : 'neutral'} size="sm">
                    {item.status}
                  </Badge>
                </div>
                <h4 className="text-xs font-bold text-slate-800 leading-tight">{item.name}</h4>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                  <span>Jual: <strong className="text-slate-800">{formatRupiah(item.selling_price)}</strong></span>
                  <span>HPP: <strong className="text-slate-600">{formatRupiah(item.hpp_per_pcs)}</strong></span>
                  {marginPct && (
                    <span className="text-emerald-600 font-semibold">
                      +{formatPercent(marginPct)}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleOpenEdit(item)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      <ProductFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        product={editingProduct}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
};
