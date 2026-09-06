import React from 'react';
import { formatRupiah } from '../../lib/formatters';
import { Card } from '../common/Card';
import { TrendingUp, ShoppingCart, Wallet } from 'lucide-react';

interface SummaryCardsProps {
  totalOmzet: number;
  totalHpp: number;
  pengeluaranPribadi: number;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalOmzet,
  totalHpp,
  pengeluaranPribadi
}) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Card className="p-3 bg-white border border-slate-100 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[10px] font-semibold uppercase">Omzet</span>
          <ShoppingCart className="w-3.5 h-3.5 text-amber-500" />
        </div>
        <p className="text-xs sm:text-sm font-black text-slate-800 truncate">
          {formatRupiah(totalOmzet)}
        </p>
      </Card>

      <Card className="p-3 bg-white border border-slate-100 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[10px] font-semibold uppercase">Total HPP</span>
          <TrendingUp className="w-3.5 h-3.5 text-sky-500" />
        </div>
        <p className="text-xs sm:text-sm font-black text-slate-800 truncate">
          {formatRupiah(totalHpp)}
        </p>
      </Card>

      <Card className="p-3 bg-white border border-slate-100 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[10px] font-semibold uppercase">Keluar Pribadi</span>
          <Wallet className="w-3.5 h-3.5 text-rose-500" />
        </div>
        <p className="text-xs sm:text-sm font-black text-rose-600 truncate">
          {formatRupiah(pengeluaranPribadi)}
        </p>
      </Card>
    </div>
  );
};
