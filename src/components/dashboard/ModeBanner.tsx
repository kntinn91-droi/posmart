import React from 'react';
import { ModeType } from '../../types/database';
import { formatRupiah } from '../../lib/formatters';
import { Flame, CloudRain } from 'lucide-react';

interface ModeBannerProps {
  mode: ModeType;
  profitKotor: number;
  ambangRamai: number;
}

export const ModeBanner: React.FC<ModeBannerProps> = ({
  mode,
  profitKotor,
  ambangRamai = 200000
}) => {
  const isRamai = mode === 'RAMAI';
  const progressPercent = Math.min(100, Math.max(0, (profitKotor / ambangRamai) * 100));

  return (
    <div
      className={`rounded-2xl p-4 text-white shadow-md relative overflow-hidden transition-all ${
        isRamai
          ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500'
          : 'bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isRamai ? 'bg-white/20' : 'bg-white/10'}`}>
            {isRamai ? <Flame className="w-6 h-6 text-amber-100" /> : <CloudRain className="w-6 h-6 text-sky-300" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-white/80">Mode Hari Ini</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-black uppercase ${
                isRamai ? 'bg-white text-orange-600' : 'bg-slate-600 text-slate-200'
              }`}>
                {mode}
              </span>
            </div>
            <p className="text-lg font-black mt-0.5">
              Profit Kotor: {formatRupiah(profitKotor)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-[11px] text-white/80 mb-1">
          <span>Target Mode Ramai ({formatRupiah(ambangRamai)})</span>
          <span>{progressPercent.toFixed(0)}%</span>
        </div>
        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isRamai ? 'bg-white' : 'bg-amber-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {!isRamai && (
          <p className="text-[10px] text-slate-300 mt-1.5">
            Kurang {formatRupiah(Math.max(0, ambangRamai - profitKotor))} lagi untuk masuk mode RAMAI.
          </p>
        )}
      </div>
    </div>
  );
};
