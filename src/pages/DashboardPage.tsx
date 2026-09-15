import React, { useState } from 'react';
import { useDailyRecap } from '../hooks/useDailyRecap';
import { useUsahaWithdrawal } from '../hooks/useUsahaWithdrawal';
import { usePribadiWithdrawal } from '../hooks/usePribadiWithdrawal';
import { ModeBanner } from '../components/dashboard/ModeBanner';
import { KantongCard } from '../components/dashboard/KantongCard';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { UsahaWithdrawalModal } from '../components/dashboard/UsahaWithdrawalModal';
import { PribadiWithdrawalModal } from '../components/dashboard/PribadiWithdrawalModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatRupiah } from '../lib/formatters';
import { RefreshCw, RotateCcw, User, PiggyBank, Coins } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { todayRow, loading, refreshRecap } = useDailyRecap();
  const {
    withdrawals,
    loading: wdLoading,
    addWithdrawal,
    deleteWithdrawal
  } = useUsahaWithdrawal();
  const {
    withdrawals: pribadiWithdrawals,
    loading: pribadiWdLoading,
    addWithdrawal: addPribadiWithdrawal,
    deleteWithdrawal: deletePribadiWithdrawal
  } = usePribadiWithdrawal();

  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showPribadiWithdrawalModal, setShowPribadiWithdrawalModal] = useState(false);

  if (loading) {
    return <LoadingSpinner message="Menghitung saldo 3 Kantong..." />;
  }

  const currentMode = todayRow?.mode || 'SEPI';
  const profitKotor = todayRow?.profit_kotor || 0;
  const totalOmzet = todayRow?.total_omzet || 0;
  const totalHpp = todayRow?.total_hpp || 0;
  const pengeluaranPribadi = todayRow?.pengeluaran_pribadi_riil || 0;
  const saldoTabunganUsaha = todayRow?.saldo_tabungan_usaha || 0;
  const saldoKasModal = todayRow?.saldo_kas_modal_putar || 0;
  const saldoJatahHidup = todayRow?.saldo_akumulatif_jatah_hidup || 0;
  const saldoTabunganPribadi = todayRow?.saldo_tabungan_pribadi || 0;
  const totalKasFisik = saldoKasModal + saldoTabunganUsaha + saldoJatahHidup + saldoTabunganPribadi;

  const handleAddWithdrawal: typeof addWithdrawal = async (data) => {
    const result = await addWithdrawal(data);
    refreshRecap();
    return result;
  };

  const handleDeleteWithdrawal = async (id: string) => {
    await deleteWithdrawal(id);
    refreshRecap();
  };

  const handleAddPribadiWithdrawal: typeof addPribadiWithdrawal = async (data) => {
    const result = await addPribadiWithdrawal(data);
    refreshRecap();
    return result;
  };

  const handleDeletePribadiWithdrawal = async (id: string) => {
    await deletePribadiWithdrawal(id);
    refreshRecap();
  };

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
        ambangRamai={parseFloat(localStorage.getItem('cfg_ambang_ramai') || '200000')}
      />

      {/* Top 3 Summary Cards */}
      <SummaryCards
        totalOmzet={totalOmzet}
        totalHpp={totalHpp}
        pengeluaranPribadi={pengeluaranPribadi}
      />

      {/* Total Kas Fisik (Semua Kantong) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-3 rounded-2xl shadow-sm flex items-center justify-between border border-slate-700/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wide">
              Total Kas Fisik (Semua Kantong)
            </span>
            <p className="text-[10px] text-slate-400">
              Kas Modal + Tab. Usaha + Jatah Hidup + Tab. Pribadi
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs sm:text-sm font-black text-amber-400">
            {formatRupiah(totalKasFisik)}
          </p>
          <span className="text-[9px] text-slate-400 block">Uang riil kasir / tangan</span>
        </div>
      </div>

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
          onActionClick={() => setShowPribadiWithdrawalModal(true)}
          actionLabel="Gunakan"
        />

        {/* Kantong 3: Tabungan Usaha */}
        <KantongCard
          nomor={3}
          title="Tabungan Usaha"
          subtitle="Keuntungan bersih usaha (Profit - Gaji)"
          totalSaldo={saldoTabunganUsaha}
          todayAddition={todayRow?.kantong3_tabungan_usaha || 0}
          colorScheme="purple"
          icon={PiggyBank}
          breakdownNotes={[
            { label: 'Profit Kotor', value: todayRow?.profit_kotor || 0 },
            { label: 'Gaji Pemilik Hari Ini', value: todayRow?.kantong2_gaji_pemilik || 0 }
          ]}
          onActionClick={() => setShowWithdrawalModal(true)}
          actionLabel="Gunakan"
        />
      </div>

      {/* Usaha Withdrawal Modal */}
      <UsahaWithdrawalModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        currentSaldo={saldoTabunganUsaha}
        withdrawals={withdrawals}
        loading={wdLoading}
        onAdd={handleAddWithdrawal}
        onDelete={handleDeleteWithdrawal}
      />

      {/* Pribadi Withdrawal Modal */}
      <PribadiWithdrawalModal
        isOpen={showPribadiWithdrawalModal}
        onClose={() => setShowPribadiWithdrawalModal(false)}
        currentSaldo={saldoTabunganPribadi}
        currentSaldoJatah={saldoJatahHidup}
        withdrawals={pribadiWithdrawals}
        loading={pribadiWdLoading}
        onAdd={handleAddPribadiWithdrawal}
        onDelete={handleDeletePribadiWithdrawal}
      />
    </div>
  );
};
