import React, { useState, useEffect } from 'react';
import { Product, ProductStatus } from '../../types/database';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSave: (data: Partial<Product>) => Promise<void>;
  isSaving?: boolean;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  product,
  onSave,
  isSaving = false
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Terang Bulan' | 'Martabak'>('Terang Bulan');
  const [sellingPrice, setSellingPrice] = useState('');
  const [hppPerPcs, setHppPerPcs] = useState('');
  const [status, setStatus] = useState<ProductStatus>('aktif');
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategory(product.category as 'Terang Bulan' | 'Martabak');
      setSellingPrice(product.selling_price ? String(product.selling_price) : '');
      setHppPerPcs(product.hpp_per_pcs ? String(product.hpp_per_pcs) : '');
      setStatus(product.status);
    } else {
      setName('');
      setCategory('Terang Bulan');
      setSellingPrice('');
      setHppPerPcs('');
      setStatus('aktif');
    }
    setError('');
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama produk wajib diisi');
      return;
    }

    const price = status === 'aktif' ? parseFloat(sellingPrice) : null;
    const hpp = status === 'aktif' ? parseFloat(hppPerPcs) : null;

    if (status === 'aktif' && (!price || price <= 0)) {
      setError('Harga jual harus lebih dari 0 untuk produk aktif');
      return;
    }

    try {
      await onSave({
        name: name.trim(),
        category,
        selling_price: price,
        hpp_per_pcs: hpp,
        status
      });
      onClose();
    } catch {
      setError('Gagal menyimpan produk');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Ubah Varian Produk' : 'Tambah Produk Baru'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        <Input
          label="Nama Produk"
          placeholder="Contoh: Terang Bulan Coklat 10k"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Kategori
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCategory('Terang Bulan')}
              className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                category === 'Terang Bulan'
                  ? 'bg-amber-50 border-amber-500 text-amber-800'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              Terang Bulan
            </button>
            <button
              type="button"
              onClick={() => setCategory('Martabak')}
              className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                category === 'Martabak'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              Martabak
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Status Menu
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setStatus('aktif')}
              className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                status === 'aktif'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              Aktif (Siap Jual)
            </button>
            <button
              type="button"
              onClick={() => setStatus('nonaktif')}
              className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                status === 'nonaktif'
                  ? 'bg-slate-100 border-slate-400 text-slate-800'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              Nonaktif (Kosong)
            </button>
          </div>
        </div>

        {status === 'aktif' && (
          <>
            <Input
              label="Harga Jual (Rp)"
              type="number"
              placeholder="Contoh: 15000"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              required
            />
            <Input
              label="HPP per Porsi (Rp)"
              type="number"
              placeholder="Contoh: 6500"
              value={hppPerPcs}
              onChange={(e) => setHppPerPcs(e.target.value)}
            />
          </>
        )}

        <div className="pt-2 flex gap-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary" fullWidth isLoading={isSaving}>
            Simpan
          </Button>
        </div>
      </form>
    </Modal>
  );
};
