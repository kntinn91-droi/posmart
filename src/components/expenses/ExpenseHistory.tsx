import React, { useState, useMemo, useRef } from 'react';
import { MaterialExpense, PersonalExpense } from '../../types/database';
import { formatRupiah, formatDateIndo, getTodayDateString } from '../../lib/formatters';
import { Pencil, Trash2, CalendarDays, Download, Printer, SlidersHorizontal, X } from 'lucide-react';

type ExpenseWithType = (MaterialExpense | PersonalExpense) & { type: 'bahan' | 'pribadi' };

interface ExpenseHistoryProps {
  expenses: ExpenseWithType[];
  activeTab: 'bahan' | 'pribadi';
  onEdit: (item: ExpenseWithType) => void;
  onDelete: (item: ExpenseWithType) => void;
}

type FilterMode = 'single' | 'range';

export const ExpenseHistory: React.FC<ExpenseHistoryProps> = ({
  expenses,
  activeTab,
  onEdit,
  onDelete,
}) => {
  const today = getTodayDateString();
  const [filterMode, setFilterMode] = useState<FilterMode>('single');
  const [singleDate, setSingleDate] = useState<string>(today);
  const [dateFrom, setDateFrom] = useState<string>(today);
  const [dateTo, setDateTo] = useState<string>(today);
  const printRef = useRef<HTMLDivElement>(null);

  const accentColor = activeTab === 'bahan' ? 'text-sky-600' : 'text-rose-600';
  const label = activeTab === 'bahan' ? 'Belanja Bahan' : 'Pengeluaran Pribadi';

  // --- Filter Logic ---
  const filtered = useMemo(() => {
    return expenses
      .filter((e) => {
        if (filterMode === 'single') {
          return e.expense_date === singleDate;
        } else {
          return e.expense_date >= dateFrom && e.expense_date <= dateTo;
        }
      })
      .sort((a, b) =>
        b.expense_date.localeCompare(a.expense_date) ||
        b.created_at.localeCompare(a.created_at)
      );
  }, [expenses, filterMode, singleDate, dateFrom, dateTo]);

  const total = useMemo(() => filtered.reduce((acc, e) => acc + e.amount, 0), [filtered]);

  // --- Group by date (for range mode) ---
  const grouped = useMemo(() => {
    if (filterMode === 'single') return null;
    const map = new Map<string, ExpenseWithType[]>();
    for (const e of filtered) {
      if (!map.has(e.expense_date)) map.set(e.expense_date, []);
      map.get(e.expense_date)!.push(e);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered, filterMode]);

  // --- Export CSV ---
  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ['Tanggal', 'Keterangan', 'Nominal'];
    const rows = filtered.map((e) => [e.expense_date, `"${e.description}"`, e.amount]);
    rows.push(['', 'TOTAL', total] as unknown as (string | number)[]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    const filename =
      filterMode === 'single'
        ? `${label.replace(/ /g, '_')}_${singleDate}.csv`
        : `${label.replace(/ /g, '_')}_${dateFrom}_sd_${dateTo}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Print ---
  const handlePrint = () => {
    const periodLabel =
      filterMode === 'single'
        ? formatDateIndo(singleDate)
        : `${formatDateIndo(dateFrom)} s/d ${formatDateIndo(dateTo)}`;

    const rows = filtered
      .map(
        (e) =>
          `<tr>
            <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;">${formatDateIndo(e.expense_date)}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;">${e.description}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;">${formatRupiah(e.amount)}</td>
          </tr>`
      )
      .join('');

    const html = `
      <html>
        <head>
          <title>Riwayat ${label}</title>
          <style>
            body { font-family: sans-serif; font-size: 12px; color: #1e293b; padding: 24px; }
            h2 { margin: 0 0 4px; font-size: 16px; }
            p.sub { margin: 0 0 16px; color: #64748b; font-size: 11px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #f8fafc; padding: 8px; text-align: left; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; }
            th:last-child { text-align: right; }
            .total-row td { font-weight: bold; padding: 8px; border-top: 2px solid #1e293b; background: #f8fafc; }
            .total-row td:last-child { text-align: right; }
          </style>
        </head>
        <body>
          <h2>Riwayat ${label}</h2>
          <p class="sub">Periode: ${periodLabel}</p>
          <table>
            <thead>
              <tr>
                <th>Tanggal</th><th>Keterangan</th><th>Nominal</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
              <tr class="total-row">
                <td colspan="2">TOTAL (${filtered.length} item)</td>
                <td>${formatRupiah(total)}</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const periodLabel =
    filterMode === 'single'
      ? formatDateIndo(singleDate)
      : `${formatDateIndo(dateFrom)} s/d ${formatDateIndo(dateTo)}`;

  return (
    <div className="space-y-3" ref={printRef}>
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h4 className="text-xs font-bold text-slate-700">
          Riwayat {label}
        </h4>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            title="Simpan CSV"
            className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 bg-white disabled:opacity-40 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handlePrint}
            disabled={filtered.length === 0}
            title="Cetak"
            className="p-2 rounded-xl text-slate-400 hover:text-sky-600 hover:bg-sky-50 border border-slate-200 bg-white disabled:opacity-40 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 space-y-2.5">
        {/* Mode Toggle */}
        <div className="grid grid-cols-2 p-0.5 bg-slate-100 rounded-xl">
          <button
            onClick={() => setFilterMode('single')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              filterMode === 'single'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Per Tanggal
          </button>
          <button
            onClick={() => setFilterMode('range')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              filterMode === 'range'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Rentang Tanggal
          </button>
        </div>

        {/* Date Input(s) */}
        {filterMode === 'single' ? (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={singleDate}
              onChange={(e) => setSingleDate(e.target.value)}
              className="flex-1 text-xs text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
            />
            {singleDate !== today && (
              <button
                onClick={() => setSingleDate(today)}
                className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold hover:text-amber-700 shrink-0"
              >
                <X className="w-3 h-3" />
                Hari ini
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={(e) => setDateFrom(e.target.value)}
              className="flex-1 text-xs text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
            />
            <span className="text-[11px] text-slate-400 shrink-0">s/d</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={(e) => setDateTo(e.target.value)}
              className="flex-1 text-xs text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
            />
          </div>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-100">
          Tidak ada catatan untuk{' '}
          <span className="font-semibold">{periodLabel}</span>.
        </div>
      ) : (
        <div className="space-y-1.5">
          {filterMode === 'single'
            ? filtered.map((item) => (
                <ExpenseRow
                  key={item.id}
                  item={item}
                  accentColor={accentColor}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            : grouped!.map(([date, items]) => (
                <div key={date} className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase px-1 pt-1">
                    {formatDateIndo(date)}
                    <span className="mx-1.5 text-slate-300">—</span>
                    <span className={accentColor}>
                      {formatRupiah(items.reduce((s, i) => s + i.amount, 0))}
                    </span>
                  </p>
                  {items.map((item) => (
                    <ExpenseRow
                      key={item.id}
                      item={item}
                      accentColor={accentColor}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              ))}

          {/* Total Bar */}
          <div className="mt-2 flex items-center justify-between bg-slate-900 text-white px-4 py-3 rounded-2xl">
            <span className="text-xs font-bold">
              Total ({filtered.length} item)
            </span>
            <span
              className={`text-sm font-black ${
                activeTab === 'bahan' ? 'text-sky-300' : 'text-rose-300'
              }`}
            >
              {formatRupiah(total)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Sub-component: satu baris item ─── */
interface ExpenseRowProps {
  item: ExpenseWithType;
  accentColor: string;
  onEdit: (item: ExpenseWithType) => void;
  onDelete: (item: ExpenseWithType) => void;
}

const ExpenseRow: React.FC<ExpenseRowProps> = ({ item, accentColor, onEdit, onDelete }) => (
  <div className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold text-slate-800 truncate">{item.description}</p>
      <p className="text-[11px] text-slate-400">{formatDateIndo(item.expense_date)}</p>
    </div>
    <span className={`text-xs font-black shrink-0 ${accentColor}`}>
      {formatRupiah(item.amount)}
    </span>
    <div className="flex items-center gap-1 shrink-0">
      <button
        onClick={() => onEdit(item)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
        title="Edit"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => onDelete(item)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        title="Hapus"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
);
