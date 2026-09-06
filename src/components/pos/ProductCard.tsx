import React from 'react';
import { Product } from '../../types/database';
import { formatRupiah } from '../../lib/formatters';
import { Plus, Minus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantityInCart,
  onAddToCart,
  onRemoveFromCart,
}) => {
  const isSelected = quantityInCart > 0;
  const isTerangBulan = product.category.toLowerCase().includes('terang bulan');

  return (
    <div
      onClick={() => onAddToCart(product)}
      className={`relative p-3 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
        isSelected
          ? 'bg-amber-50/50 border-amber-400 shadow-sm shadow-amber-500/10'
          : 'bg-white border-slate-200/80 hover:border-slate-300'
      }`}
    >
      <div className="flex justify-between items-start mb-1">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
            isTerangBulan
              ? 'bg-amber-100 text-amber-800'
              : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {product.category}
        </span>
        {isSelected && (
          <span className="bg-amber-500 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-sm">
            {quantityInCart}
          </span>
        )}
      </div>

      <h4 className="text-xs font-bold text-slate-800 line-clamp-2 min-h-[32px] mt-1 leading-snug">
        {product.name}
      </h4>

      <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-100">
        <div>
          <p className="text-xs font-black text-amber-600">
            {formatRupiah(product.selling_price)}
          </p>
        </div>

        {isSelected ? (
          <div
            className="flex items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onRemoveFromCart(product)}
              className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center active:bg-slate-300 transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-bold w-4 text-center">
              {quantityInCart}
            </span>
            <button
              onClick={() => onAddToCart(product)}
              className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center active:bg-amber-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white flex items-center justify-center transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        )}
      </div>
    </div>
  );
};
