import React, { useState, useEffect } from 'react';
import { localDb, OfflineSaleTransaction } from '../../lib/db';
import { formatRupiah, getTodayDateString } from '../../lib/formatters';
import { ReceiptData } from '../../types/pos';
import { X, Clock, Printer, Trash2, CheckCircle2, AlertCircle, ShoppingBag } from 'lucide-react';
import { Button } from '../common/Button';

interface SalesHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewReceipt: (receipt: ReceiptData) => void;
}

export const SalesHistoryModal: React.FC<SalesHistoryModalProps> = ({
  isOpen,
  onClose,
  onViewReceipt,
}) => {
  const [transactions, setTransactions] = useState<OfflineSaleTransaction[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [loading, setLoading] = useState<boolean>(true);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const allSales = await localDb.offlineSales.toArray();
      // Filter by selected date and sort descending (newest first)
      const filtered = allSales
        .filter((t) => t.transaction_date === selectedDate)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTransactions(filtered);
    } catch (err) {
      console.error('Failed to load transactions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTransactions();
    }
  }, [isOpen, selectedDate]);

  const handleDeleteTransaction = async (id?: number) => {
    if (!id) return;
    const confirmDelete = window.confirm('Apakah Anda yakin ingin membatalkan & menghapus nota ini?');
    if (!confirmDelete) return;

    try {
      await localDb.offlineSales.delete(id);
      await loadTransactions();
    } catch (err) {
      console.error('Failed to delete transaction', err);
      alert('Gagal menghapus transaksi');
    }
  };

  const handlePrint = (trx: OfflineSaleTransaction) => {
    const receiptData: ReceiptData = {
      transaction_id: trx.local_id,
      transaction_no: trx.transaction_no,
      transaction_date: trx.transaction_date,
      items: trx.items.map((i) => ({
        name: i.product_name,
        qty: i.qty,
        unit_price: i.unit_price,
        subtotal: i.subtotal_omzet,
      })),
      total_omzet: trx.total_omzet,
      created_at: trx.created_at,
    };
    onViewReceipt(receiptData);
  };

  if (!isOpen) return null;

  const totalOmzetHariIni = transactions.reduce((acc, t) => acc + t.total_omzet, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Riwayat Nota Kasir</h3>
              <p className="text-[11px] text-slate-500">Daftar transaksi penjualan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Date Filter & Summary */}
        <div className="py-3 flex items-center justify-between gap-2 border-b border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Tanggal:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Total Omzet</span>
            <span className="font-black text-amber-600 text-xs">{formatRupiah(totalOmzetHariIni)}</span>
          </div>
        </div>

        {/* Transaction List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Memuat riwayat transaksi...</div>
          ) : transactions.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Belum ada transaksi di tanggal ini.</p>
            </div>
          ) : (
            transactions.map((trx) => {
              const timeStr = new Date(trx.created_at).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={trx.local_id}
                  className="bg-slate-50 hover:bg-slate-100/80 rounded-2xl p-3 border border-slate-200/80 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-xs">Nota #{trx.transaction_no}</span>
                      <span className="text-[10px] text-slate-400">• {timeStr}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {trx.synced ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Cloud
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded-full">
                          <AlertCircle className="w-2.5 h-2.5" /> Lokal
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="text-[11px] text-slate-600 space-y-0.5 pl-1 border-l-2 border-amber-300">
                    {trx.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>
                          {it.product_name} <span className="text-slate-400">×{it.qty}</span>
                        </span>
                        <span className="text-slate-700 font-medium">{formatRupiah(it.subtotal_omzet)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Footer with actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Nota</span>
                      <span className="font-black text-amber-600 text-xs">{formatRupiah(trx.total_omzet)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDeleteTransaction(trx.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Batalkan Nota"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handlePrint(trx)}
                        className="text-[11px] py-1 px-2.5 h-7"
                      >
                        <Printer className="w-3 h-3 mr-1" />
                        Cetak Ulang
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose} className="w-full">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
};
