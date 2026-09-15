import { useState, useEffect } from 'react';
import { DailyRecapRow, SystemSettings, UsahaWithdrawal, PribadiWithdrawal } from '../types/database';
import { localDb } from '../lib/db';
import { calculateKantong } from '../lib/calculations';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getTodayDateString } from '../lib/formatters';

const DEFAULT_SETTINGS: SystemSettings = {
  id: 'default',
  effective_from: '2026-09-01',
  ambang_profit_ramai: 200000,
  rasio_gaji_ramai: 0.50,
  rasio_gaji_sepi: 0.50,
  rasio_hidup_ramai: 0.50,
  rasio_tabungan_pribadi_ramai: 0.50,
  rasio_hidup_sepi: 0.70,
  rasio_tabungan_pribadi_sepi: 0.30,
  created_at: ''
};

export function useDailyRecap() {
  const [recapRows, setRecapRows] = useState<DailyRecapRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecap = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('daily_recap')
          .select('*')
          .order('tanggal', { ascending: false });

        if (!error && data && data.length > 0) {
          setRecapRows(data);
          setLoading(false);
          return;
        }
      }

      // Compute from local IndexedDB data
      const allSales = await localDb.offlineSales.toArray();
      const allExpenses = await localDb.offlineExpenses.toArray();
      const allWithdrawals: UsahaWithdrawal[] = await localDb.usahaWithdrawals.toArray();
      const allPribadiWithdrawals: PribadiWithdrawal[] = await localDb.pribadiWithdrawals.toArray();

      // Collect all dates
      const dateSet = new Set<string>();
      allSales.forEach(s => dateSet.add(s.transaction_date));
      allExpenses.forEach(e => dateSet.add(e.expense_date));
      allWithdrawals.forEach(w => dateSet.add(w.withdrawal_date));
      allPribadiWithdrawals.forEach(w => dateSet.add(w.withdrawal_date));

      // Always include today's date so dashboard always has current data
      dateSet.add(getTodayDateString());

      const dates = Array.from(dateSet).sort();

      // Load custom settings or fall back to defaults
      const ambangRamai = parseFloat(localStorage.getItem('cfg_ambang_ramai') || '200000');
      const rasioGajiRamai = (parseFloat(localStorage.getItem('cfg_rasio_gaji_ramai') || '50')) / 100;
      const rasioGajiSepi = (parseFloat(localStorage.getItem('cfg_rasio_gaji_sepi') || '50')) / 100;
      const rasioHidupSepi = (parseFloat(localStorage.getItem('cfg_rasio_hidup_sepi') || '70')) / 100;
      const rasioHidupRamai = (parseFloat(localStorage.getItem('cfg_rasio_hidup_ramai') || '50')) / 100;

      const activeSettings: SystemSettings = {
        ...DEFAULT_SETTINGS,
        ambang_profit_ramai: ambangRamai,
        rasio_gaji_ramai: rasioGajiRamai,
        rasio_gaji_sepi: rasioGajiSepi,
        rasio_hidup_sepi: rasioHidupSepi,
        rasio_tabungan_pribadi_sepi: 1 - rasioHidupSepi,
        rasio_hidup_ramai: rasioHidupRamai,
        rasio_tabungan_pribadi_ramai: 1 - rasioHidupRamai
      };

      const saldoAwalModal = parseFloat(localStorage.getItem('cfg_saldo_modal') || '0');
      const saldoAwalUsaha = parseFloat(localStorage.getItem('cfg_saldo_usaha') || '0');
      const saldoAwalPribadi = parseFloat(localStorage.getItem('cfg_saldo_pribadi') || '0');

      let runModal = saldoAwalModal;
      let runUsaha = saldoAwalUsaha;
      let runJatahHidup = 0;
      let runPribadi = saldoAwalPribadi;

      const computedRows: DailyRecapRow[] = [];

      for (const tgl of dates) {
        const daySales = allSales.filter(s => s.transaction_date === tgl);
        const dayMaterial = allExpenses.filter(e => e.expense_date === tgl && e.type === 'bahan');
        const dayPersonal = allExpenses.filter(e => e.expense_date === tgl && e.type === 'pribadi');
        const dayWithdrawals = allWithdrawals.filter(w => w.withdrawal_date === tgl);
        const dayPribadiWithdrawals = allPribadiWithdrawals.filter(w => w.withdrawal_date === tgl);

        const total_omzet = daySales.reduce((acc, s) => acc + s.total_omzet, 0);
        const total_hpp = daySales.reduce((acc, s) => acc + s.total_hpp, 0);
        const total_belanja_bahan = dayMaterial.reduce((acc, m) => acc + m.amount, 0);
        const pengeluaran_pribadi_riil = dayPersonal.reduce((acc, p) => acc + p.amount, 0);

        const calc = calculateKantong({
          total_omzet,
          total_hpp,
          total_belanja_bahan,
          pengeluaran_pribadi_riil,
          ...activeSettings
        });

        // Penarikan Tabungan Usaha hari ini
        const totalWdToday = dayWithdrawals.reduce((acc, w) => acc + w.amount, 0);
        const totalWdToModal = dayWithdrawals
          .filter(w => w.type === 'tambah_modal')
          .reduce((acc, w) => acc + w.amount, 0);

        runModal += calc.kantong1_modal_putar + totalWdToModal;
        runUsaha += calc.kantong3_tabungan_usaha - totalWdToday;

        // Penarikan Tabungan Pribadi hari ini
        const totalPribadiWdToday = dayPribadiWithdrawals.reduce((acc, w) => acc + w.amount, 0);
        const totalWdToJatah = dayPribadiWithdrawals
          .filter(w => w.type === 'tutup_defisit_jatah')
          .reduce((acc, w) => acc + w.amount, 0);

        // --- Logika Prioritas Saldo Kumulatif Jatah Hidup & Tabungan Pribadi ---
        // Sisa jatah hidup hari ini = jatah kebutuhan hidup - pengeluaran pribadi riil
        const sisa_selisih_jatah_hidup_hari_ini = calc.jatah_kebutuhan_hidup - pengeluaran_pribadi_riil;

        // Akumulasi saldo berjalan jatah hidup (ditambah pengalihan tabungan pribadi jika ada untuk tutup defisit)
        runJatahHidup += sisa_selisih_jatah_hidup_hari_ini + totalWdToJatah;

        // Tabungan pribadi dikurangi penarikan hari ini
        const tabungan_pribadi_hari_ini = calc.jatah_tabungan_pribadi;
        runPribadi += tabungan_pribadi_hari_ini - totalPribadiWdToday;

        computedRows.push({
          tanggal: tgl,
          total_omzet,
          total_hpp,
          total_belanja_bahan,
          profit_kotor: calc.profit_kotor,
          mode: calc.mode,
          kantong1_modal_putar: calc.kantong1_modal_putar,
          kantong2_gaji_pemilik: calc.kantong2_gaji_pemilik,
          kantong3_tabungan_usaha: calc.kantong3_tabungan_usaha,
          jatah_kebutuhan_hidup: calc.jatah_kebutuhan_hidup,
          jatah_tabungan_pribadi: calc.jatah_tabungan_pribadi,
          pengeluaran_pribadi_riil: calc.pengeluaran_pribadi_riil,
          sisa_selisih_jatah_hidup: sisa_selisih_jatah_hidup_hari_ini,
          tabungan_pribadi_hari_ini,
          saldo_kas_modal_putar: runModal,
          saldo_tabungan_usaha: runUsaha,
          saldo_akumulatif_jatah_hidup: runJatahHidup,
          saldo_tabungan_pribadi: runPribadi
        });
      }

      setRecapRows(computedRows.reverse());
    } catch (err) {
      console.error('Failed to compute recap', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecap();
  }, []);

  const todayStr = getTodayDateString();
  const todayRow = recapRows.find(r => r.tanggal === todayStr) || recapRows[0];

  return {
    recapRows,
    todayRow,
    loading,
    refreshRecap: fetchRecap
  };
}
