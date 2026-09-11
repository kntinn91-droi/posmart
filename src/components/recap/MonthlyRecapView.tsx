import React, { useState, useMemo } from 'react';
import { DailyRecapRow } from '../../types/database';
import { formatRupiah, formatMonthYearIndo, getDayNameIndo } from '../../lib/formatters';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import {
  TrendingUp,
  Crown,
  Calendar,
  PiggyBank,
  User,
  RotateCcw,
  Sparkles,
  BarChart3
} from 'lucide-react';

interface MonthlyRecapViewProps {
  data: DailyRecapRow[];
}

export const MonthlyRecapView: React.FC<MonthlyRecapViewProps> = ({ data }) => {
  // 1. Ekstrak daftar bulan yang ada (YYYY-MM)
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    data.forEach(r => {
      if (r.tanggal && r.tanggal.length >= 7) {
        monthSet.add(r.tanggal.substring(0, 7));
      }
    });
    return Array.from(monthSet).sort().reverse();
  }, [data]);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return availableMonths[0] || '';
  });

  // Filter baris untuk bulan yang dipilih (diurutkan kronologis ascending untuk grafik)
  const monthRows = useMemo(() => {
    if (!selectedMonth) return [];
    return data
      .filter(r => r.tanggal.startsWith(selectedMonth))
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }, [data, selectedMonth]);

  // Tanggal yang sedang dipilih/diklik di grafik (default hari terakhir atau peak)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // 2. Agregasi total bulanan
  const monthlyStats = useMemo(() => {
    if (monthRows.length === 0) return null;

    let totalOmzet = 0;
    let totalHpp = 0;
    let totalBelanjaBahan = 0;
    let totalProfitKotor = 0;
    let totalModalPutar = 0;
    let totalGajiPemilik = 0;
    let totalTabunganUsaha = 0;
    let totalJatahHidup = 0;
    let totalJatahTabunganPribadi = 0;
    let totalPengeluaranPribadi = 0;
    let totalTabunganPribadiHariIni = 0;

    let peakRow: DailyRecapRow = monthRows[0];
    let minRow: DailyRecapRow = monthRows[0];

    monthRows.forEach(r => {
      totalOmzet += r.total_omzet;
      totalHpp += r.total_hpp;
      totalBelanjaBahan += r.total_belanja_bahan;
      totalProfitKotor += r.profit_kotor;
      totalModalPutar += r.kantong1_modal_putar;
      totalGajiPemilik += r.kantong2_gaji_pemilik;
      totalTabunganUsaha += r.kantong3_tabungan_usaha;
      totalJatahHidup += r.jatah_kebutuhan_hidup;
      totalJatahTabunganPribadi += r.jatah_tabungan_pribadi;
      totalPengeluaranPribadi += r.pengeluaran_pribadi_riil;
      totalTabunganPribadiHariIni += r.tabungan_pribadi_hari_ini;

      if (r.total_omzet > peakRow.total_omzet) {
        peakRow = r;
      }
      if (r.total_omzet < minRow.total_omzet && r.total_omzet > 0) {
        minRow = r;
      }
    });

    const activeDays = monthRows.filter(r => r.total_omzet > 0).length || monthRows.length;
    const avgOmzet = activeDays > 0 ? Math.round(totalOmzet / activeDays) : 0;
    const sisaJatahHidupBulan = totalJatahHidup - totalPengeluaranPribadi;

    // Baris terakhir bulan untuk melihat saldo kumulatif penutupan
    const lastRow = monthRows[monthRows.length - 1];

    return {
      activeDays,
      totalOmzet,
      totalHpp,
      totalBelanjaBahan,
      totalProfitKotor,
      totalModalPutar,
      totalGajiPemilik,
      totalTabunganUsaha,
      totalJatahHidup,
      totalJatahTabunganPribadi,
      totalPengeluaranPribadi,
      totalTabunganPribadiHariIni,
      sisaJatahHidupBulan,
      avgOmzet,
      peakRow,
      minRow,
      lastRow
    };
  }, [monthRows]);

  // 3. Analisis Pola Mingguan (Day of Week Analysis)
  const dayOfWeekStats = useMemo(() => {
    if (monthRows.length === 0) return [];
    const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const map: Record<string, { count: number; totalOmzet: number }> = {};
    dayOrder.forEach(d => { map[d] = { count: 0, totalOmzet: 0 }; });

    monthRows.forEach(r => {
      if (r.total_omzet > 0) {
        const name = getDayNameIndo(r.tanggal);
        if (map[name]) {
          map[name].count += 1;
          map[name].totalOmzet += r.total_omzet;
        }
      }
    });

    return dayOrder.map(dayName => {
      const item = map[dayName];
      const avg = item.count > 0 ? Math.round(item.totalOmzet / item.count) : 0;
      return {
        dayName,
        count: item.count,
        totalOmzet: item.totalOmzet,
        avgOmzet: avg
      };
    });
  }, [monthRows]);

  const maxAvgDay = useMemo(() => {
    if (dayOfWeekStats.length === 0) return null;
    return [...dayOfWeekStats].sort((a, b) => b.avgOmzet - a.avgOmzet)[0];
  }, [dayOfWeekStats]);

  // Max omzet untuk scaling tinggi batang grafik
  const maxChartOmzet = useMemo(() => {
    if (monthRows.length === 0) return 1;
    const max = Math.max(...monthRows.map(r => r.total_omzet));
    return max > 0 ? max : 1;
  }, [monthRows]);

  // Baris yang dipilih untuk detail
  const activeSelectedRow = useMemo(() => {
    if (!selectedDate && monthlyStats) {
      return monthlyStats.peakRow;
    }
    return monthRows.find(r => r.tanggal === selectedDate) || monthRows[0] || null;
  }, [selectedDate, monthRows, monthlyStats]);

  if (!monthlyStats || monthRows.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
        <p className="text-sm">Belum ada data rekap untuk bulan ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* Selector Bulan */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-slate-700">Pilih Bulan:</span>
        </div>
        <select
          value={selectedMonth}
          onChange={e => {
            setSelectedMonth(e.target.value);
            setSelectedDate(null);
          }}
          className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {availableMonths.map(m => (
            <option key={m} value={m}>
              {formatMonthYearIndo(m)}
            </option>
          ))}
        </select>
      </div>

      {/* Ringkasan 4 Kartu Utama */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card className="p-3 bg-white border border-slate-100 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Omzet</span>
          <p className="text-sm font-black text-slate-800 truncate mt-1">
            {formatRupiah(monthlyStats.totalOmzet)}
          </p>
          <span className="text-[10px] text-slate-400 mt-1">{monthlyStats.activeDays} hari aktif</span>
        </Card>

        <Card className="p-3 bg-white border border-slate-100 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-slate-400">Profit Kotor</span>
          <p className="text-sm font-black text-emerald-600 truncate mt-1">
            {formatRupiah(monthlyStats.totalProfitKotor)}
          </p>
          <span className="text-[10px] text-slate-400 mt-1">Laba kotor jualan</span>
        </Card>

        <Card className="p-3 bg-white border border-slate-100 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-slate-400">Tabungan Usaha</span>
          <p className="text-sm font-black text-purple-600 truncate mt-1">
            {formatRupiah(monthlyStats.totalTabunganUsaha)}
          </p>
          <span className="text-[10px] text-purple-600 font-semibold mt-1">Kantong 3 masuk</span>
        </Card>

        <Card className="p-3 bg-white border border-slate-100 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-slate-400">Rata-rata / Hari</span>
          <p className="text-sm font-black text-sky-600 truncate mt-1">
            {formatRupiah(monthlyStats.avgOmzet)}
          </p>
          <span className="text-[10px] text-slate-400 mt-1">Rerata per hari buka</span>
        </Card>
      </div>

      {/* 👑 Kartu Highlight Peak Day */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-amber-950 p-3.5 rounded-2xl shadow-xs border border-amber-300 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-600/20 rounded-xl text-amber-900 border border-amber-600/30">
            <Crown className="w-5 h-5 fill-amber-700 text-amber-700" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-black tracking-wider text-amber-900 block">
              Rekor Penjualan Tertinggi (Peak)
            </span>
            <p className="text-xs font-bold text-amber-950">
              {getDayNameIndo(monthlyStats.peakRow.tanggal)}, {monthlyStats.peakRow.tanggal}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm sm:text-base font-black text-amber-950">
            {formatRupiah(monthlyStats.peakRow.total_omzet)}
          </p>
          <span className="text-[9px] font-semibold bg-amber-900/10 px-1.5 py-0.5 rounded text-amber-900">
            Mode {monthlyStats.peakRow.mode}
          </span>
        </div>
      </div>

      {/* 📊 Grafik Batang Tren Penjualan Harian 30 Hari */}
      <Card className="p-3.5 border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky-500" />
            <h3 className="text-xs font-bold text-slate-800">Tren Performa Harian ({formatMonthYearIndo(selectedMonth)})</h3>
          </div>
          <span className="text-[10px] text-slate-400">Sentuh batang untuk lihat detail</span>
        </div>

        {/* Bar Chart Container */}
        <div className="pt-4 pb-1 overflow-x-auto no-scrollbar">
          <div className="flex items-end gap-1.5 sm:gap-2 min-w-max px-1 h-44">
            {monthRows.map(row => {
              const isPeak = row.tanggal === monthlyStats.peakRow.tanggal;
              const isSelected = activeSelectedRow?.tanggal === row.tanggal;
              const heightPct = Math.max(8, Math.round((row.total_omzet / maxChartOmzet) * 100));
              const dayNum = row.tanggal.split('-')[2] || '';
              const dayShort = getDayNameIndo(row.tanggal).substring(0, 3);

              return (
                <div
                  key={row.tanggal}
                  onClick={() => setSelectedDate(row.tanggal)}
                  className="flex flex-col items-center cursor-pointer group transition-all"
                  style={{ width: '28px' }}
                >
                  {/* Badge Peak di atas batang */}
                  <div className="h-5 flex items-center justify-center">
                    {isPeak && (
                      <span className="text-[9px] bg-amber-500 text-white font-black px-1 rounded-full animate-bounce">
                        👑
                      </span>
                    )}
                  </div>

                  {/* Batang Bar */}
                  <div className="w-full flex items-end justify-center h-28">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-lg transition-all duration-300 relative ${
                        isPeak
                          ? 'bg-gradient-to-t from-amber-500 to-amber-400 shadow-md ring-2 ring-amber-400/60'
                          : isSelected
                            ? 'bg-sky-600 ring-2 ring-slate-800'
                            : 'bg-sky-400 group-hover:bg-sky-500 opacity-90'
                      }`}
                    >
                      {/* Nilai omzet ringkas saat hover / selected */}
                      {isSelected && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap shadow-md z-10">
                          {formatRupiah(row.total_omzet)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Label Tanggal & Hari */}
                  <div className="mt-1 text-center">
                    <span className={`text-[10px] font-bold block ${isSelected ? 'text-sky-600 font-black' : isPeak ? 'text-amber-600 font-black' : 'text-slate-700'}`}>
                      {dayNum}
                    </span>
                    <span className="text-[8px] text-slate-400 block -mt-0.5">
                      {dayShort}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Hari yang Dipilih dari Grafik */}
        {activeSelectedRow && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <div>
                <span className="text-xs font-bold text-slate-900">
                  {getDayNameIndo(activeSelectedRow.tanggal)}, {activeSelectedRow.tanggal}
                </span>
                {activeSelectedRow.tanggal === monthlyStats.peakRow.tanggal && (
                  <span className="ml-2 text-[9px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full border border-amber-300">
                    👑 Peak Bulan Ini
                  </span>
                )}
              </div>
              <Badge variant={activeSelectedRow.mode === 'RAMAI' ? 'warning' : 'neutral'} size="sm">
                {activeSelectedRow.mode}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs pt-2.5">
              <div>
                <span className="text-[10px] text-slate-400">Omzet Harian:</span>
                <p className="font-bold text-slate-800 truncate">{formatRupiah(activeSelectedRow.total_omzet)}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Profit Kotor:</span>
                <p className="font-bold text-emerald-600 truncate">{formatRupiah(activeSelectedRow.profit_kotor)}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Jatah Hidup Hari Ini:</span>
                <p className={`font-bold truncate ${activeSelectedRow.sisa_selisih_jatah_hidup < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatRupiah(activeSelectedRow.sisa_selisih_jatah_hidup)}
                </p>
              </div>
            </div>

            {/* Pembagian 3 Kantong Hari Ini */}
            <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-200/60 mt-2">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold">K1 (Modal)</span>
                <p className="font-bold text-sky-600 truncate">{formatRupiah(activeSelectedRow.kantong1_modal_putar)}</p>
                <span className="text-[9px] text-slate-400 block truncate">HPP: {formatRupiah(activeSelectedRow.total_hpp)}</span>
                <span className="text-[9px] text-slate-400 block truncate">Blnj: {formatRupiah(activeSelectedRow.total_belanja_bahan)}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold">K2 (Gaji)</span>
                <p className="font-bold text-emerald-600 truncate">{formatRupiah(activeSelectedRow.kantong2_gaji_pemilik)}</p>
                <span className="text-[9px] text-slate-400 block truncate">Jatah: {formatRupiah(activeSelectedRow.jatah_kebutuhan_hidup)}</span>
                <span className="text-[9px] text-slate-400 block truncate">Blnj: {formatRupiah(activeSelectedRow.pengeluaran_pribadi_riil)}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-bold">K3 (Tab. Usaha)</span>
                <p className="font-bold text-purple-600 truncate">{formatRupiah(activeSelectedRow.kantong3_tabungan_usaha)}</p>
                <span className="text-[9px] text-slate-400 block truncate">Profit - Gaji</span>
              </div>
            </div>

            {/* Saldo Kumulatif Berjalan Hari Tersebut */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 mt-2">
              <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1.5">
                Saldo Kumulatif Berjalan (Posisi Tanggal {activeSelectedRow.tanggal})
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div>
                  <span className="text-slate-500">Kas Modal:</span>
                  <p className="font-bold text-sky-700">{formatRupiah(activeSelectedRow.saldo_kas_modal_putar)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Tab. Usaha:</span>
                  <p className="font-bold text-purple-700">{formatRupiah(activeSelectedRow.saldo_tabungan_usaha)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Jatah Hidup:</span>
                  <p className={`font-bold ${activeSelectedRow.saldo_akumulatif_jatah_hidup < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {formatRupiah(activeSelectedRow.saldo_akumulatif_jatah_hidup)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Tab. Pribadi:</span>
                  <p className="font-bold text-amber-700">{formatRupiah(activeSelectedRow.saldo_tabungan_pribadi)}</p>
                </div>
              </div>

              {/* Total Kas Fisik */}
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-600">Total Kas Fisik Hari Itu</span>
                <span className="text-xs font-black text-slate-900">
                  {formatRupiah(
                    activeSelectedRow.saldo_kas_modal_putar +
                    activeSelectedRow.saldo_tabungan_usaha +
                    activeSelectedRow.saldo_akumulatif_jatah_hidup +
                    activeSelectedRow.saldo_tabungan_pribadi
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 📅 Analisis Pola Mingguan (Hari Terlaris dalam Seminggu) */}
      <Card className="p-3.5 border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-800">Pola Penjualan per Hari (Senin - Minggu)</h3>
          </div>
          {maxAvgDay && maxAvgDay.avgOmzet > 0 && (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Teramai: {maxAvgDay.dayName}
            </span>
          )}
        </div>

        <div className="space-y-2">
          {dayOfWeekStats.map(stat => {
            const isTop = maxAvgDay && maxAvgDay.dayName === stat.dayName && stat.avgOmzet > 0;
            const maxVal = maxAvgDay?.avgOmzet || 1;
            const barWidth = maxVal > 0 ? Math.max(6, Math.round((stat.avgOmzet / maxVal) * 100)) : 0;

            return (
              <div key={stat.dayName} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className={`font-semibold ${isTop ? 'text-amber-700 font-bold flex items-center gap-1' : 'text-slate-600'}`}>
                    {stat.dayName} {isTop && '👑'}
                  </span>
                  <span className="text-slate-700 font-bold">
                    {formatRupiah(stat.avgOmzet)}{' '}
                    <span className="text-[9px] text-slate-400 font-normal">({stat.count}x buka)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    style={{ width: `${barWidth}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      isTop
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                        : 'bg-sky-400'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 💼 Ringkasan 3 Kantong Sebulan & Saldo Akhir */}
      <Card className="p-3.5 border border-slate-200/80 space-y-3">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          Rangkuman Sistem 3 Kantong ({formatMonthYearIndo(selectedMonth)})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Kantong 1 */}
          <div className="bg-sky-50 border border-sky-100 rounded-xl p-2.5">
            <div className="flex items-center gap-1.5 text-sky-700 mb-1">
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase">Kantong 1 (Modal)</span>
            </div>
            <p className="text-xs font-bold text-sky-800">{formatRupiah(monthlyStats.totalModalPutar)}</p>
            <div className="text-[9px] text-sky-600 mt-1 space-y-0.5">
              <p>Total HPP: {formatRupiah(monthlyStats.totalHpp)}</p>
              <p>Total Belanja: {formatRupiah(monthlyStats.totalBelanjaBahan)}</p>
            </div>
          </div>

          {/* Kantong 2 */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5">
            <div className="flex items-center gap-1.5 text-emerald-700 mb-1">
              <User className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase">Kantong 2 (Gaji)</span>
            </div>
            <p className="text-xs font-bold text-emerald-800">{formatRupiah(monthlyStats.totalGajiPemilik)}</p>
            <div className="text-[9px] text-emerald-700 mt-1 space-y-0.5">
              <p>Jatah Hidup: {formatRupiah(monthlyStats.totalJatahHidup)}</p>
              <p>Belanja Riil: {formatRupiah(monthlyStats.totalPengeluaranPribadi)}</p>
              <p className="font-bold">
                Sisa Jatah: {formatRupiah(monthlyStats.sisaJatahHidupBulan)}
              </p>
            </div>
          </div>

          {/* Kantong 3 */}
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-2.5">
            <div className="flex items-center gap-1.5 text-purple-700 mb-1">
              <PiggyBank className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase">Kantong 3 (Tab. Usaha)</span>
            </div>
            <p className="text-xs font-bold text-purple-800">{formatRupiah(monthlyStats.totalTabunganUsaha)}</p>
            <div className="text-[9px] text-purple-600 mt-1 space-y-0.5">
              <p>Profit: {formatRupiah(monthlyStats.totalProfitKotor)}</p>
              <p>Gaji: {formatRupiah(monthlyStats.totalGajiPemilik)}</p>
              <p className="font-bold">Laba Bersih Masuk Tabungan</p>
            </div>
          </div>
        </div>

        {/* Saldo Akhir Penutupan Bulan */}
        {monthlyStats.lastRow && (
          <div className="bg-slate-100 p-2.5 rounded-xl mt-2">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-500">
                Posisi Saldo Penutupan Bulan
              </span>
              <span className="text-[9px] text-slate-400">per {monthlyStats.lastRow.tanggal}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div>
                <span className="text-slate-500">Kas Modal:</span>
                <p className="font-bold text-sky-700">{formatRupiah(monthlyStats.lastRow.saldo_kas_modal_putar)}</p>
              </div>
              <div>
                <span className="text-slate-500">Tab. Usaha:</span>
                <p className="font-bold text-purple-700">{formatRupiah(monthlyStats.lastRow.saldo_tabungan_usaha)}</p>
              </div>
              <div>
                <span className="text-slate-500">Jatah Hidup:</span>
                <p className={`font-bold ${monthlyStats.lastRow.saldo_akumulatif_jatah_hidup < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {formatRupiah(monthlyStats.lastRow.saldo_akumulatif_jatah_hidup)}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Tab. Pribadi:</span>
                <p className="font-bold text-amber-700">{formatRupiah(monthlyStats.lastRow.saldo_tabungan_pribadi)}</p>
              </div>
            </div>

            {/* Total Kas Fisik */}
            <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-700">Total Kas Fisik Akhir Bulan</span>
              <span className="text-xs font-black text-slate-900">
                {formatRupiah(
                  monthlyStats.lastRow.saldo_kas_modal_putar +
                  monthlyStats.lastRow.saldo_tabungan_usaha +
                  monthlyStats.lastRow.saldo_akumulatif_jatah_hidup +
                  monthlyStats.lastRow.saldo_tabungan_pribadi
                )}
              </span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
