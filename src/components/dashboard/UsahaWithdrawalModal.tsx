import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { UsahaWithdrawalType, UsahaWithdrawal } from '../../types/database';
import { formatRupiah, getTodayDateString } from '../../lib/formatters';
import { ArrowDownCircle, ArrowRightLeft, Trash2 } from 'lucide-react';

interface UsahaWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSaldo: number;
  withdrawals: UsahaWithdrawal[];
  loading: boolean;
  onAdd: (data: {
    type: UsahaWithdrawalType;
    description: string;
    amount: number;
    withdrawal_date?: string;
  }) => Promise<UsahaWithdrawal | undefined>;
  onDelete: (id: string) => Promise<void>;
}

type TabType = 'form' | 'riwayat';

export const UsahaWithdrawalModal: React.FC<UsahaWithdrawalModalProps> = ({
  isOpen,
  onClose,
  currentSaldo,
  withdrawals,
  loading,
  onAdd,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('form');
  const [type, setType] = useState<UsahaWithdrawalType>('pengeluaran');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [error, setError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amt = parseFloat(amount);
    if (!description.trim()) {
      setError('Keterangan wajib diisi.');
      return;
    }
    if (!amt || amt <= 0) {
      setError('Jumlah harus lebih dari 0.');
      return;
    }
    if (amt > currentSaldo) {
      setError(`Jumlah melebihi saldo tabungan usaha (${formatRupiah(currentSaldo)}).`);
      return;
    }
    await onAdd({ type, description: description.trim(), amount: amt, withdrawal_date: date });
    setDescription('');
    setAmount('');
    setDate(getTodayDateString());
    setActiveTab('riwayat');
  };

  const handleDelete = async (id: string) => {
    await onDelete(id);
    setConfirmDeleteId(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🐷 Gunakan Tabungan Usaha">
      {/* Saldo Info */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-4 flex justify-between items-center">
        <span className="text-xs text-purple-700 font-medium">Saldo Tabungan Usaha saat ini</span>
        <span className="text-lg font-black text-purple-800">{formatRupiah(currentSaldo)}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 rounded-xl p-1">
        {(['form', 'riwayat'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-all ${
              activeTab === tab
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'form' ? '+ Catat Penggunaan' : `Riwayat (${withdrawals.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Jenis */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jenis Penggunaan</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('pengeluaran')}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                  type === 'pengeluaran'
                    ? 'border-rose-400 bg-rose-50 text-rose-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <ArrowDownCircle className="w-5 h-5" />
                <span>Pengeluaran</span>
                <span className="font-normal text-[10px] opacity-75">Beli aset, renovasi, dll</span>
              </button>
              <button
                type="button"
                onClick={() => setType('tambah_modal')}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                  type === 'tambah_modal'
                    ? 'border-sky-400 bg-sky-50 text-sky-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <ArrowRightLeft className="w-5 h-5" />
                <span>Tambah Modal</span>
                <span className="font-normal text-[10px] opacity-75">Pindah ke Kantong 1</span>
              </button>
            </div>
          </div>

          {/* Tanggal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={type === 'pengeluaran' ? 'contoh: Beli wajan baru' : 'contoh: Tambah modal bahan'}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {/* Jumlah */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah (Rp)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              min={0}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-sm font-bold text-white transition-all ${
              type === 'tambah_modal'
                ? 'bg-sky-500 active:bg-sky-600'
                : 'bg-rose-500 active:bg-rose-600'
            } disabled:opacity-50`}
          >
            {loading ? 'Menyimpan...' : type === 'tambah_modal' ? '↔ Pindahkan ke Modal Putar' : '💸 Catat Pengeluaran'}
          </button>
        </form>
      )}

      {activeTab === 'riwayat' && (
        <div className="space-y-2">
          {withdrawals.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              Belum ada riwayat penggunaan
            </div>
          ) : (
            withdrawals.map(w => (
              <div
                key={w.id}
                className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                    w.type === 'tambah_modal' ? 'bg-sky-100 text-sky-600' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {w.type === 'tambah_modal'
                      ? <ArrowRightLeft className="w-3.5 h-3.5" />
                      : <ArrowDownCircle className="w-3.5 h-3.5" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{w.description}</p>
                    <p className="text-[10px] text-slate-400">
                      {w.withdrawal_date} · {w.type === 'tambah_modal' ? 'Tambah Modal' : 'Pengeluaran'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  <span className={`text-sm font-bold ${
                    w.type === 'tambah_modal' ? 'text-sky-700' : 'text-rose-700'
                  }`}>
                    -{formatRupiah(w.amount)}
                  </span>
                  {confirmDeleteId === w.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(w.id)}
                        className="text-[10px] bg-rose-500 text-white px-2 py-1 rounded-lg font-bold"
                      >
                        Hapus
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded-lg"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(w.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Modal>
  );
};
