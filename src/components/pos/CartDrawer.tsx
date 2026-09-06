import React from 'react';
import { CartItem } from '../../types/pos';
import { formatRupiah } from '../../lib/formatters';
import { Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '../common/Button';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (productId: string, delta: number) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  isProcessing?: boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQty,
  onClearCart,
  onCheckout,
  isProcessing = false
}) => {
  if (!isOpen) return null;

  const totalOmzet = items.reduce(
    (acc, curr) => acc + (curr.product.selling_price || 0) * curr.qty,
    0
  );
  const totalQty = items.reduce((acc, curr) => acc + curr.qty, 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      <div className="relative z-10 w-full max-w-lg mx-auto bg-white rounded-t-3xl shadow-2xl p-5 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-800">Keranjang Nota</h3>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {totalQty} item
            </span>
          </div>
          {items.length > 0 && (
            <button
              onClick={onClearCart}
              className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Kosongkan
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1 my-3 divide-y divide-slate-100">
          {items.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <ShoppingBag className="w-10 h-10 mx-auto mb-2 stroke-1" />
              <p className="text-sm">Keranjang masih kosong</p>
            </div>
          ) : (
            items.map(({ product, qty }) => (
              <div key={product.id} className="py-3 flex items-center justify-between">
                <div className="flex-1 pr-3">
                  <p className="text-xs font-bold text-slate-800 leading-tight">{product.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {formatRupiah(product.selling_price)} × {qty} = <span className="font-semibold text-slate-700">{formatRupiah((product.selling_price || 0) * qty)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateQty(product.id, -1)}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-95"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold w-5 text-center">{qty}</span>
                  <button
                    onClick={() => onUpdateQty(product.id, 1)}
                    className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-slate-100 pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Omzet Transaksi</span>
              <span className="text-lg font-black text-amber-600">
                {formatRupiah(totalOmzet)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={onClose}>
                Kembali
              </Button>
              <Button
                variant="primary"
                onClick={onCheckout}
                isLoading={isProcessing}
              >
                Simpan Transaksi
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
