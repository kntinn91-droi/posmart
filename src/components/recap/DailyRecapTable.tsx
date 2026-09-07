import React, { useState } from 'react';
import { DailyRecapRow } from '../../types/database';
import { formatRupiah, formatDateIndo } from '../../lib/formatters';
import { Badge } from '../common/Badge';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DailyRecapTableProps {
  data: DailyRecapRow[];
}

export const DailyRecapTable: React.FC<DailyRecapTableProps> = ({ data }) => {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const toggleExpand = (date: string) => {
    setExpandedDate(expandedDate === date ? null : date);
  };

  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
        <p className="text-sm">Belum ada data rekap transaksi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {data.map((row) => {
        const isExpanded = expandedDate === row.tanggal;
        const isRamai = row.mode === 'RAMAI';

        return (
          <div
            key={row.tanggal}
            className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs transition-all"
          >
            <div
              onClick={() => toggleExpand(row.tanggal)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    {formatDateIndo(row.tanggal)}
                  </span>
                  <Badge variant={isRamai ? 'warning' : 'neutral'} size="sm">
                    {row.mode}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Omzet: <span className="font-semibold text-slate-800">{formatRupiah(row.total_omzet)}</span> • Profit: <span className="font-semibold text-emerald-600">{formatRupiah(row.profit_kotor)}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-[10px] text-slate-400">Tab. Usaha</p>
                  <p className="text-xs font-black text-purple-600">
                    {formatRupiah(row.kantong3_tabungan_usaha)}
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs animate-in slide-in-from-top-1 duration-150">
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Kantong 1 (Modal Putar)</span>
                    <p className="font-bold text-sky-600">{formatRupiah(row.kantong1_modal_putar)}</p>
                    <span className="text-[10px] text-slate-400">HPP: {formatRupiah(row.total_hpp)} - Belanja: {formatRupiah(row.total_belanja_bahan)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Kantong 2 (Gaji Pemilik)</span>
                    <p className="font-bold text-emerald-600">{formatRupiah(row.kantong2_gaji_pemilik)}</p>
                    <span className="text-[10px] text-slate-400">Jatah Hidup: {formatRupiah(row.jatah_kebutuhan_hidup)}</span>
                  </div>
                </div>

                <div className="bg-amber-50/60 p-2.5 rounded-xl space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Pengeluaran Pribadi Riil:</span>
                    <span className="font-semibold text-rose-600">{formatRupiah(row.pengeluaran_pribadi_riil)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Selisih Jatah Hidup:</span>
                    <span className={`font-semibold ${row.sisa_selisih_jatah_hidup >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatRupiah(row.sisa_selisih_jatah_hidup)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-800 font-bold border-t border-amber-200/50 pt-1">
                    <span>Tabungan Pribadi Hari Ini:</span>
                    <span className="text-amber-700">{formatRupiah(row.tabungan_pribadi_hari_ini)}</span>
                  </div>
                </div>

                <div className="bg-slate-100 p-2.5 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Saldo Kumulatif Berjalan</p>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div>
                      <span className="text-slate-500">Kas Modal:</span>
                      <p className="font-bold text-sky-700">{formatRupiah(row.saldo_kas_modal_putar)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Tab. Usaha:</span>
                      <p className="font-bold text-purple-700">{formatRupiah(row.saldo_tabungan_usaha)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Jatah Hidup:</span>
                      <p className="font-bold text-emerald-700">{formatRupiah(row.saldo_akumulatif_jatah_hidup)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Tab. Pribadi:</span>
                      <p className="font-bold text-amber-700">{formatRupiah(row.saldo_tabungan_pribadi)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
