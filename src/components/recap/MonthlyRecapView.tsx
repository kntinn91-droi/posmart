import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DailyRecapRow, Product } from '../../types/database';
import { formatRupiah, formatMonthYearIndo, getDayNameIndo, getTodayDateString } from '../../lib/formatters';
import { localDb, OfflineSaleTransaction } from '../../lib/db';
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
  BarChart3,
  ShoppingBag,
  Trophy,
  ChevronDown,
  ChevronUp,
  ArrowUpDown
} from 'lucide-react';

type ProductSortOption = 'qty_desc' | 'qty_asc' | 'omzet_desc' | 'name_asc';
type CategoryFilterOption = 'Semua' | 'Terang Bulan' | 'Martabak';

interface SoldItemSummary {
  name: string;
  category: 'Terang Bulan' | 'Martabak' | 'Lainnya';
  qty: number;
  omzet: number;
}

interface PeriodSalesStats {
  tbQty: number;
  tbOmzet: number;
  martabakQty: number;
  martabakOmzet: number;
  totalQty: number;
  totalOmzet: number;
  items: SoldItemSummary[];
}

function resolveCategory(
  productId: string,
  productName: string,
  catMap: Map<string, string>
): 'Terang Bulan' | 'Martabak' | 'Lainnya' {
  const cat = catMap.get(productId);
  if (cat) {
    if (cat.toLowerCase().includes('terang bulan')) return 'Terang Bulan';
    if (cat.toLowerCase().includes('martabak')) return 'Martabak';
  }
  const name = productName.toLowerCase();
  if (name.includes('terang bulan') || name.includes('terang-bulan') || name.includes('tb ') || name.includes('manis')) {
    return 'Terang Bulan';
  }
  if (name.includes('martabak') || name.includes('telur')) {
    return 'Martabak';
  }
  return 'Lainnya';
}

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
    const todayMonth = getTodayDateString().substring(0, 7);
    if (availableMonths.includes(todayMonth)) {
      return todayMonth;
    }
    return availableMonths[0] || todayMonth;
  });

  useEffect(() => {
    if (!selectedMonth && availableMonths.length > 0) {
      const todayMonth = getTodayDateString().substring(0, 7);
      setSelectedMonth(availableMonths.includes(todayMonth) ? todayMonth : availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  // Filter baris untuk bulan yang dipilih (diurutkan kronologis ascending untuk grafik)
  const monthRows = useMemo(() => {
    if (!selectedMonth) return [];
    return data
      .filter(r => r.tanggal.startsWith(selectedMonth))
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }, [data, selectedMonth]);

  // Tanggal yang sedang dipilih/diklik di grafik (default hari ini saat membuka rekap)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Data transaksi penjualan offline untuk rincian produk/kategori
  const [salesTransactions, setSalesTransactions] = useState<OfflineSaleTransaction[]>([]);
  const [productCategoryMap, setProductCategoryMap] = useState<Map<string, string>>(new Map());
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // Kontrol sorting & filter kategori untuk daftar penjualan menu sebulan
  const [productSortBy, setProductSortBy] = useState<ProductSortOption>('qty_desc');
  const [productCatFilter, setProductCatFilter] = useState<CategoryFilterOption>('Semua');

  // Kontrol buka-tutup rincian menu agar tidak makan tempat (default tertutup)
  const [showDayItemDetails, setShowDayItemDetails] = useState(false);
  const [showMonthRanking, setShowMonthRanking] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadSales = async () => {
      try {
        const [sales, products] = await Promise.all([
          localDb.offlineSales.toArray(),
          localDb.products.toArray(),
        ]);
        if (isMounted) {
          setSalesTransactions(sales);
          setAllProducts(products);
          const map = new Map<string, string>();
          products.forEach(p => map.set(p.id, p.category));
          setProductCategoryMap(map);
        }
      } catch (err) {
        console.error('Failed to load sales data for recap:', err);
      }
    };
    loadSales();
    return () => {
      isMounted = false;
    };
  }, [data]);

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

  // Baris yang dipilih untuk detail (default hari ini saat buka rekap)
  const activeSelectedRow = useMemo(() => {
    if (selectedDate) {
      const found = monthRows.find(r => r.tanggal === selectedDate);
      if (found) return found;
    }

    // Default hari ini ketika pertama kali membuka rekap
    const today = getTodayDateString();
    const todayRow = monthRows.find(r => r.tanggal === today);
    if (todayRow) {
      return todayRow;
    }

    // Jika hari ini tidak ada di bulan ini (misal melihat riwayat bulan lalu),
    // default ke hari terakhir di bulan tersebut
    return monthRows[monthRows.length - 1] || null;
  }, [selectedDate, monthRows]);

  const selectedBarRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll grafik horizontal ke batang yang sedang aktif/terpilih
  useEffect(() => {
    if (selectedBarRef.current) {
      selectedBarRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [activeSelectedRow?.tanggal]);

  // Statistik produk terjual pada hari yang dipilih
  const daySalesStats = useMemo<PeriodSalesStats>(() => {
    if (!activeSelectedRow) {
      return { tbQty: 0, tbOmzet: 0, martabakQty: 0, martabakOmzet: 0, totalQty: 0, totalOmzet: 0, items: [] };
    }
    const dayTrx = salesTransactions.filter(t => t.transaction_date === activeSelectedRow.tanggal);
    const itemMap = new Map<string, SoldItemSummary>();
    let tbQty = 0;
    let tbOmzet = 0;
    let martabakQty = 0;
    let martabakOmzet = 0;

    dayTrx.forEach(trx => {
      trx.items.forEach(item => {
        const cat = resolveCategory(item.product_id, item.product_name, productCategoryMap);
        const qty = item.qty || 0;
        const omzet = item.subtotal_omzet || (item.unit_price * qty) || 0;

        if (cat === 'Terang Bulan') {
          tbQty += qty;
          tbOmzet += omzet;
        } else if (cat === 'Martabak') {
          martabakQty += qty;
          martabakOmzet += omzet;
        }

        const existing = itemMap.get(item.product_name);
        if (existing) {
          existing.qty += qty;
          existing.omzet += omzet;
        } else {
          itemMap.set(item.product_name, {
            name: item.product_name,
            category: cat,
            qty,
            omzet,
          });
        }
      });
    });

    const items = Array.from(itemMap.values()).sort((a, b) => b.qty - a.qty);
    const totalQty = tbQty + martabakQty;
    const totalOmzet = tbOmzet + martabakOmzet;

    return { tbQty, tbOmzet, martabakQty, martabakOmzet, totalQty, totalOmzet, items };
  }, [salesTransactions, activeSelectedRow, productCategoryMap]);

  // Statistik produk terjual sebulan penuh (seluruh menu terdaftar termasuk 0 penjualan)
  const monthSalesStats = useMemo(() => {
    if (!selectedMonth) {
      return { tbQty: 0, tbOmzet: 0, martabakQty: 0, martabakOmzet: 0, totalQty: 0, totalOmzet: 0, allItems: [] as SoldItemSummary[] };
    }
    const monthTrx = salesTransactions.filter(t => t.transaction_date.startsWith(selectedMonth));
    const itemMap = new Map<string, SoldItemSummary>();
    let tbQty = 0;
    let tbOmzet = 0;
    let martabakQty = 0;
    let martabakOmzet = 0;

    // 1. Masukkan semua produk master yang aktif agar yang 0 pcs penjualan tetap terdata
    allProducts
      .filter(p => p.status !== 'nonaktif')
      .forEach(p => {
        const cat = resolveCategory(p.id, p.name, productCategoryMap);
        itemMap.set(p.name, {
          name: p.name,
          category: cat,
          qty: 0,
          omzet: 0,
        });
      });

    // 2. Akumulasi dari transaksi penjualan bulan ini
    monthTrx.forEach(trx => {
      trx.items.forEach(item => {
        const cat = resolveCategory(item.product_id, item.product_name, productCategoryMap);
        const qty = item.qty || 0;
        const omzet = item.subtotal_omzet || (item.unit_price * qty) || 0;

        if (cat === 'Terang Bulan') {
          tbQty += qty;
          tbOmzet += omzet;
        } else if (cat === 'Martabak') {
          martabakQty += qty;
          martabakOmzet += omzet;
        }

        const existing = itemMap.get(item.product_name);
        if (existing) {
          existing.qty += qty;
          existing.omzet += omzet;
        } else {
          itemMap.set(item.product_name, {
            name: item.product_name,
            category: cat,
            qty,
            omzet,
          });
        }
      });
    });

    const allItems = Array.from(itemMap.values());
    const totalQty = tbQty + martabakQty;
    const totalOmzet = tbOmzet + martabakOmzet;

    return { tbQty, tbOmzet, martabakQty, martabakOmzet, totalQty, totalOmzet, allItems };
  }, [salesTransactions, selectedMonth, allProducts, productCategoryMap]);

  // Daftar menu yang difilter dan di-sort sesuai pilihan user
  const processedMonthItems = useMemo(() => {
    let list = [...monthSalesStats.allItems];

    if (productCatFilter !== 'Semua') {
      list = list.filter(it => it.category === productCatFilter);
    }

    list.sort((a, b) => {
      if (productSortBy === 'qty_desc') {
        return b.qty - a.qty || b.omzet - a.omzet || a.name.localeCompare(b.name);
      }
      if (productSortBy === 'qty_asc') {
        return a.qty - b.qty || a.omzet - b.omzet || a.name.localeCompare(b.name);
      }
      if (productSortBy === 'omzet_desc') {
        return b.omzet - a.omzet || b.qty - a.qty || a.name.localeCompare(b.name);
      }
      if (productSortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return list;
  }, [monthSalesStats.allItems, productCatFilter, productSortBy]);

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
                  ref={isSelected ? selectedBarRef : undefined}
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
                          ? isSelected
                            ? 'bg-gradient-to-t from-amber-500 to-amber-400 shadow-md ring-2 ring-slate-800'
                            : 'bg-gradient-to-t from-amber-500 to-amber-400 shadow-md ring-2 ring-amber-400/60'
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

            {/* Ringkasan Pcs Terjual Hari Ini */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 mt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                  <ShoppingBag className="w-3 h-3 text-amber-500" />
                  Produk Terjual Hari Ini
                </span>
                <span className="text-xs font-black text-slate-800">
                  Total: {daySalesStats.totalQty} pcs
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-amber-50/70 border border-amber-100/80 rounded-lg p-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-amber-700 font-semibold block">🥞 Terang Bulan</span>
                    <span className="text-xs font-black text-amber-900">{daySalesStats.tbQty} pcs</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700">{formatRupiah(daySalesStats.tbOmzet)}</span>
                </div>
                <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-lg p-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-700 font-semibold block">🥩 Martabak</span>
                    <span className="text-xs font-black text-emerald-900">{daySalesStats.martabakQty} pcs</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700">{formatRupiah(daySalesStats.martabakOmzet)}</span>
                </div>
              </div>

              {/* Toggle Rincian Menu Hari Ini (Default Tertutup) */}
              {daySalesStats.items.length > 0 && (
                <div className="mt-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowDayItemDetails(!showDayItemDetails)}
                    className="w-full py-1.5 px-2 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      {showDayItemDetails ? 'Sembunyikan Rincian Menu' : `Lihat Rincian Menu Terjual (${daySalesStats.items.length} menu)`}
                    </span>
                    {showDayItemDetails ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                  </button>

                  {showDayItemDetails && (
                    <div className="mt-2 space-y-1 max-h-48 overflow-y-auto pr-1 animate-in fade-in duration-150">
                      {daySalesStats.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-slate-50/80 text-[11px]">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-[10px]">{it.category === 'Terang Bulan' ? '🥞' : '🥩'}</span>
                            <span className="font-semibold text-slate-700 truncate">{it.name}</span>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <span className="font-black text-slate-800">{it.qty} pcs</span>
                            <span className="text-[10px] text-slate-400 ml-1.5">({formatRupiah(it.omzet)})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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

      {/* 🥞🥩 Performa Penjualan Produk & Menu Terlaris Bulanan (Gabungan 2 & 3) */}
      <Card className="p-3.5 border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-800">
              Performa Produk & Menu Terlaris ({formatMonthYearIndo(selectedMonth)})
            </h3>
          </div>
          <Badge variant="neutral" size="sm">
            Total {monthSalesStats.totalQty} pcs
          </Badge>
        </div>

        {/* Akumulasi 2 Kategori Utama Sebulan */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-amber-50/80 border border-amber-200/70 rounded-xl p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-amber-800 uppercase flex items-center gap-1">
                🥞 Terang Bulan
              </span>
              <span className="text-[10px] font-bold text-amber-700">
                {monthSalesStats.totalQty > 0 ? Math.round((monthSalesStats.tbQty / monthSalesStats.totalQty) * 100) : 0}%
              </span>
            </div>
            <p className="text-base font-black text-amber-900">
              {monthSalesStats.tbQty} <span className="text-xs font-semibold">pcs</span>
            </p>
            <p className="text-[11px] font-bold text-amber-700/90 mt-0.5">{formatRupiah(monthSalesStats.tbOmzet)}</p>
          </div>

          <div className="bg-emerald-50/80 border border-emerald-200/70 rounded-xl p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                🥩 Martabak
              </span>
              <span className="text-[10px] font-bold text-emerald-700">
                {monthSalesStats.totalQty > 0 ? Math.round((monthSalesStats.martabakQty / monthSalesStats.totalQty) * 100) : 0}%
              </span>
            </div>
            <p className="text-base font-black text-emerald-900">
              {monthSalesStats.martabakQty} <span className="text-xs font-semibold">pcs</span>
            </p>
            <p className="text-[11px] font-bold text-emerald-700/90 mt-0.5">{formatRupiah(monthSalesStats.martabakOmzet)}</p>
          </div>
        </div>

        {/* Accordion Menu Lengkap & Sorting (Default Tertutup agar tidak makan tempat) */}
        {monthSalesStats.allItems.length > 0 ? (
          <div>
            <button
              type="button"
              onClick={() => setShowMonthRanking(!showMonthRanking)}
              className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/70 rounded-xl flex items-center justify-between text-xs font-bold text-slate-700 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="text-amber-500">📋</span>
                {showMonthRanking
                  ? 'Sembunyikan Rincian Penjualan Menu'
                  : `Lihat Penjualan Semua Menu (${monthSalesStats.allItems.length} menu)`}
              </span>
              {showMonthRanking ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showMonthRanking && (
              <div className="mt-2.5 space-y-2.5 pt-1 animate-in fade-in duration-200">
                {/* Toolbar Filter Kategori & Sorting */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-100/70 p-2 rounded-xl">
                  {/* Category Pills */}
                  <div className="flex items-center gap-1">
                    {(['Semua', 'Terang Bulan', 'Martabak'] as CategoryFilterOption[]).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setProductCatFilter(cat)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          productCatFilter === cat
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60'
                        }`}
                      >
                        {cat === 'Terang Bulan' ? '🥞 Terang Bulan' : cat === 'Martabak' ? '🥩 Martabak' : 'Semua Menu'}
                      </button>
                    ))}
                  </div>

                  {/* Sort Selector */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                    <select
                      value={productSortBy}
                      onChange={e => setProductSortBy(e.target.value as ProductSortOption)}
                      className="text-[11px] font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                    >
                      <option value="qty_desc">Terlaris (Pcs Terbanyak ↓)</option>
                      <option value="qty_asc">Tersedikit (Pcs Terendah ↑)</option>
                      <option value="omzet_desc">Omzet Tertinggi (Rp ↓)</option>
                      <option value="name_asc">Nama Menu (A - Z)</option>
                    </select>
                  </div>
                </div>

                {/* List of items */}
                <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                  {processedMonthItems.length === 0 ? (
                    <p className="text-center text-[11px] text-slate-400 py-3">Tidak ada produk dalam kategori ini.</p>
                  ) : (
                    processedMonthItems.map((item, index) => {
                      const maxQty = Math.max(...processedMonthItems.map(i => i.qty), 1);
                      const barWidth = item.qty > 0 ? Math.max(6, Math.round((item.qty / maxQty) * 100)) : 0;
                      const isTop3 = productSortBy === 'qty_desc' && index < 3 && item.qty > 0;
                      const rankBadge = isTop3
                        ? (index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉')
                        : `#${index + 1}`;

                      return (
                        <div
                          key={item.name}
                          className={`p-2 rounded-xl border transition-all ${
                            item.qty === 0
                              ? 'bg-slate-50/60 border-slate-200/50'
                              : 'bg-white border-slate-200/80 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="text-[11px] font-bold text-slate-400 w-5 shrink-0 text-center">
                                {rankBadge}
                              </span>
                              <span className="text-[11px] shrink-0">
                                {item.category === 'Terang Bulan' ? '🥞' : '🥩'}
                              </span>
                              <span
                                className={`truncate ${
                                  isTop3
                                    ? 'text-slate-900 font-extrabold'
                                    : item.qty === 0
                                      ? 'text-slate-500 font-medium'
                                      : 'text-slate-800 font-semibold'
                                }`}
                              >
                                {item.name}
                              </span>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <span className={`font-black ${item.qty === 0 ? 'text-slate-400 font-semibold' : 'text-slate-900'}`}>
                                {item.qty} pcs
                              </span>
                              <span className="text-[10px] text-slate-400 ml-1.5">
                                ({formatRupiah(item.omzet)})
                              </span>
                            </div>
                          </div>

                          {/* Progress bar visual untuk yang ada penjualan */}
                          {item.qty > 0 && (
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1.5">
                              <div
                                style={{ width: `${barWidth}%` }}
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isTop3 && index === 0
                                    ? 'bg-amber-500'
                                    : item.category === 'Terang Bulan'
                                      ? 'bg-amber-400'
                                      : 'bg-emerald-500'
                                }`}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 text-center py-1">Belum ada data menu di bulan ini.</p>
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
