import React from 'react';
import { ReceiptData } from '../../types/pos';
import { formatRupiah } from '../../lib/formatters';
import { CheckCircle, Printer } from 'lucide-react';
import { Button } from '../common/Button';

interface ReceiptModalProps {
  receipt: ReceiptData | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose }) => {
  if (!receipt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col">
        <div className="text-center pb-3 border-b border-dashed border-slate-200">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Transaksi Berhasil!</h3>
          <p className="text-xs text-slate-500 mt-0.5">Nota #{receipt.transaction_no} • {receipt.transaction_date}</p>
        </div>

        <div className="py-3 max-h-52 overflow-y-auto space-y-2 border-b border-dashed border-slate-200">
          {receipt.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-xs">
              <span className="text-slate-700 font-medium">
                {item.name} × {item.qty}
              </span>
              <span className="text-slate-900 font-semibold">
                {formatRupiah(item.subtotal)}
              </span>
            </div>
          ))}
        </div>

        <div className="py-3 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Total</span>
          <span className="text-base font-black text-amber-600">{formatRupiah(receipt.total_omzet)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Cetak
          </Button>
          <Button variant="primary" size="sm" onClick={onClose}>
            Selesai / Lanjut
          </Button>
        </div>
      </div>
    </div>
  );
};
