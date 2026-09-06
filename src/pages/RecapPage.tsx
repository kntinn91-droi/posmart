import React, { useState } from 'react';
import { useDailyRecap } from '../hooks/useDailyRecap';
import { DailyRecapTable } from '../components/recap/DailyRecapTable';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Download, CalendarDays, RefreshCw } from 'lucide-react';
import { Button } from '../components/common/Button';

export const RecapPage: React.FC = () => {
  const { recapRows, loading, refreshRecap } = useDailyRecap();
  const [filterMonth, setFilterMonth] = useState<string>('');

  const filteredRows = filterMonth
    ? recapRows.filter((r) => r.tanggal.startsWith(filterMonth))
    : recapRows;

  const handleExportCSV = () => {
    if (filteredRows.length === 0) return;
    const headers = [
      'Tanggal', 'Omzet', 'HPP', 'Belanja Bahan', 'Profit Kotor', 'Mode',
      'Kantong 1 (Modal Putar)', 'Kantong 2 (Gaji)', 'Kantong 3 (Tab. Usaha)',
      'Jatah Hidup', 'Jatah Tab. Pribadi', 'Pengeluaran Pribadi',
      'Tab. Pribadi Hari Ini', 'Saldo Modal Putar', 'Saldo Tab. Usaha', 'Saldo Tab. Pribadi'
    ];

    const rows = filteredRows.map(r => [
      r.tanggal, r.total_omzet, r.total_hpp, r.total_belanja_bahan, r.profit_kotor, r.mode,
      r.kantong1_modal_putar, r.kantong2_gaji_pemilik, r.kantong3_tabungan_usaha,
      r.jatah_kebutuhan_hidup, r.jatah_tabungan_pribadi, r.pengeluaran_pribadi_riil,
      r.tabungan_pribadi_hari_ini, r.saldo_kas_modal_putar, r.saldo_tabungan_usaha, r.saldo_tabungan_pribadi
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_martabak_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <LoadingSpinner message="Menghitung rekap harian..." />;
  }

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Rekap Harian</h2>
          <p className="text-[11px] text-slate-500">Agregasi otomatis berdasarkan kalender</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={refreshRecap}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button variant="secondary" size="sm" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5 mr-1" />
            Ekspor
          </Button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-2 bg-white p-2.5 rounded-2xl border border-slate-200/80">
        <CalendarDays className="w-4 h-4 text-slate-400" />
        <span className="text-xs text-slate-500">Filter Bulan:</span>
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="text-xs text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        {filterMonth && (
          <button
            onClick={() => setFilterMonth('')}
            className="text-[11px] text-rose-500 font-semibold ml-auto"
          >
            Reset
          </button>
        )}
      </div>

      {/* Daily Recap Table List */}
      <DailyRecapTable data={filteredRows} />
    </div>
  );
};
