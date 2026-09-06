import React from 'react';
import { useDailyRecap } from '../hooks/useDailyRecap';
import { ModeBanner } from '../components/dashboard/ModeBanner';
import { KantongCard } from '../components/dashboard/KantongCard';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { RefreshCw, RotateCcw, User, PiggyBank } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { todayRow, loading, refreshRecap } = useDailyRecap();

  if (loading) {
    return <LoadingSpinner message="Menghitung saldo 3 Kantong..." />;
  }

  const currentMode = todayRow?.mode || 'SEPI';
  const profitKotor = todayRow?.profit_kotor || 0;
  const totalOmzet = todayRow?.total_omzet || 0;
  const totalHpp = todayRow?.total_hpp || 0;
  const pengeluaranPribadi = todayRow?.pengeluaran_pribadi_riil || 0;

  return (
    <div className="space-y-3.5">
      {/* Header action */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Sistem 3 Kantong</h2>
          <p className="text-[11px] text-slate-500">Perhitungan real-time tanpa tombol tutup buku</p>
        </div>
        <button
          onClick={refreshRecap}
          className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl active:rotate-180 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Status Banner (Sepi / Ramai) */}
      <ModeBanner
        mode={currentMode}
        profitKotor={profitKotor}
        ambangRamai={200000}
      />

      {/* Top 3 Summary Cards */}
      <SummaryCards
        totalOmzet={totalOmzet}
        totalHpp={totalHpp}
        pengeluaranPribadi={pengeluaranPribadi}
      />

      {/* 3 Kantong Detailed Cards */}
      <div className="space-y-3 pt-1">
        {/* Kantong 1: Modal Putar */}
        <KantongCard
          nomor={1}
          title="Modal Putar"
          subtitle="Utang modal bahan (HPP - Belanja Riil)"
          totalSaldo={todayRow?.saldo_kas_modal_putar || 0}
          todayAddition={todayRow?.kantong1_modal_putar || 0}
          colorScheme="blue"
          icon={RotateCcw}
          breakdownNotes={[
            { label: 'HPP Hari Ini', value: todayRow?.total_hpp || 0 },
            { label: 'Belanja Bahan Riil', value: todayRow?.total_belanja_bahan || 0 }
          ]}
        />

        {/* Kantong 2: Gaji Pemilik */}
        <KantongCard
          nomor={2}
          title="Gaji Pemilik"
          subtitle="Jatah hidup harian & tabungan pribadi"
          totalSaldo={todayRow?.saldo_tabungan_pribadi || 0}
          todayAddition={todayRow?.tabungan_pribadi_hari_ini || 0}
          colorScheme="green"
          icon={User}
          breakdownNotes={[
            { label: 'Jatah Kebutuhan Hidup', value: todayRow?.jatah_kebutuhan_hidup || 0 },
            { label: 'Pengeluaran Pribadi Riil', value: todayRow?.pengeluaran_pribadi_riil || 0 },
            { label: 'Jatah Tabungan Pribadi', value: todayRow?.jatah_tabungan_pribadi || 0 },
            { label: 'Sisa/Selisih Jatah Hidup', value: todayRow?.sisa_selisih_jatah_hidup || 0 },
          ]}
        />

        {/* Kantong 3: Tabungan Usaha */}
        <KantongCard
          nomor={3}
          title="Tabungan Usaha"
          subtitle="Keuntungan bersih usaha (Profit - Gaji)"
          totalSaldo={todayRow?.saldo_tabungan_usaha || 0}
          todayAddition={todayRow?.kantong3_tabungan_usaha || 0}
          colorScheme="purple"
          icon={PiggyBank}
          breakdownNotes={[
            { label: 'Profit Kotor', value: todayRow?.profit_kotor || 0 },
            { label: 'Gaji Pemilik Hari Ini', value: todayRow?.kantong2_gaji_pemilik || 0 }
          ]}
        />
      </div>
    </div>
  );
};
