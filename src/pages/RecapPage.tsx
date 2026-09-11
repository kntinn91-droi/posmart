import React from 'react';
import { useDailyRecap } from '../hooks/useDailyRecap';
import { MonthlyRecapView } from '../components/recap/MonthlyRecapView';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '../components/common/Button';

export const RecapPage: React.FC = () => {
  const { recapRows, loading, refreshRecap } = useDailyRecap();

  const handleExportCSV = () => {
    if (recapRows.length === 0) return;
    const headers = [
      'Tanggal', 'Omzet', 'HPP', 'Belanja Bahan', 'Profit Kotor', 'Mode',
      'Kantong 1 (Modal Putar)', 'Kantong 2 (Gaji)', 'Kantong 3 (Tab. Usaha)',
      'Jatah Hidup', 'Jatah Tab. Pribadi', 'Pengeluaran Pribadi',
      'Jatah Hidup Hari Ini', 'Tab. Pribadi Hari Ini',
      'Saldo Modal Putar', 'Saldo Tab. Usaha', 'Saldo Kumulatif Jatah Hidup', 'Saldo Tab. Pribadi', 'Total Kas Fisik'
    ];

    const rows = recapRows.map(r => [
      r.tanggal, r.total_omzet, r.total_hpp, r.total_belanja_bahan, r.profit_kotor, r.mode,
      r.kantong1_modal_putar, r.kantong2_gaji_pemilik, r.kantong3_tabungan_usaha,
      r.jatah_kebutuhan_hidup, r.jatah_tabungan_pribadi, r.pengeluaran_pribadi_riil,
      r.sisa_selisih_jatah_hidup, r.tabungan_pribadi_hari_ini,
      r.saldo_kas_modal_putar, r.saldo_tabungan_usaha, r.saldo_akumulatif_jatah_hidup, r.saldo_tabungan_pribadi,
      (r.saldo_kas_modal_putar + r.saldo_tabungan_usaha + r.saldo_akumulatif_jatah_hidup + r.saldo_tabungan_pribadi)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_keuangan_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <LoadingSpinner message="Menghitung rekap performa..." />;
  }

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Rekap Keuangan</h2>
          <p className="text-[11px] text-slate-500">
            Performa bulanan, grafik harian & Sistem 3 Kantong
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={refreshRecap}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl active:rotate-180 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button variant="secondary" size="sm" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5 mr-1" />
            Ekspor
          </Button>
        </div>
      </div>

      {/* Monthly Recap View with 30-Day Trend Chart, Peak, Weekly Patterns & Full Daily Details */}
      <MonthlyRecapView data={recapRows} />
    </div>
  );
};
