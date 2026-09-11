import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { PribadiWithdrawalType, PribadiWithdrawal } from '../../types/database';
import { formatRupiah, getTodayDateString } from '../../lib/formatters';
import { ArrowDownCircle, ArrowRightLeft, Trash2, AlertCircle } from 'lucide-react';

interface PribadiWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSaldo: number;
  currentSaldoJatah?: number;
  withdrawals: PribadiWithdrawal[];
  loading: boolean;
  onAdd: (data: {
    type: PribadiWithdrawalType;
    description: string;
    amount: number;
    withdrawal_date?: string;
  }) => Promise<PribadiWithdrawal | undefined>;
  onDelete: (id: string) => Promise<void>;
}

type TabType = 'form' | 'riwayat';

export const PribadiWithdrawalModal: React.FC<PribadiWithdrawalModalProps> = ({
  isOpen,
  onClose,
  currentSaldo,
  currentSaldoJatah = 0,
  withdrawals,
  loading,
  onAdd,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('form');
  const [type, setType] = useState<PribadiWithdrawalType>('tarik_tunai');
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
      setError(`Jumlah melebihi saldo tabungan pribadi (${formatRupiah(currentSaldo)}).`);
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
    <Modal isOpen={isOpen} onClose={onClose} title="👤 Gunakan Tabungan Pribadi">
      {/* Saldo Info */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-3 flex justify-between items-center">
        <span className="text-xs text-emerald-700 font-medium">Saldo Tabungan Pribadi saat ini</span>
        <span className="text-lg font-black text-emerald-800">{formatRupiah(currentSaldo)}</span>
      </div>

      {/* Info Defisit Jatah Hidup jika ada */}
      {currentSaldoJatah < 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 mb-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-800">
            <span>Jatah Hidup sedang defisit </span>
            <span className="font-bold text-rose-600">{formatRupiah(currentSaldoJatah)}</span>.
            <span className="block text-amber-700 text-[10px]">
              Gunakan opsi "Tutup Jatah Hidup" untuk melunasi defisit ini dari tabungan pribadi.
            </span>
          </div>
        </div>
      )}

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
            {tab === 'form' ? '+ Catat Penarikan' : `Riwayat (${withdrawals.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Jenis */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jenis Penarikan</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('tarik_tunai')}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                  type === 'tarik_tunai'
                    ? 'border-rose-400 bg-rose-50 text-rose-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <ArrowDownCircle className="w-5 h-5" />
                <span>Tarik Tunai / Belanja</span>
                <span className="font-normal text-[10px] opacity-75">Beli barang, cicilan, dll</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('tutup_defisit_jatah');
                  if (currentSaldoJatah < 0 && !amount) {
                    setAmount(String(-currentSaldoJatah));
                    setDescription('Tutup defisit jatah hidup');
                  }
                }}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                  type === 'tutup_defisit_jatah'
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <ArrowRightLeft className="w-5 h-5" />
                <span>Tutup Jatah Hidup</span>
                <span className="font-normal text-[10px] opacity-75">Pindah ke Jatah Hidup</span>
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
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={type === 'tarik_tunai' ? 'contoh: Beli jaket / servis motor' : 'contoh: Tutup minus jatah hidup'}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* Jumlah */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Jumlah (Rp)</label>
              {type === 'tutup_defisit_jatah' && currentSaldoJatah < 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(-currentSaldoJatah))}
                  className="text-[10px] font-bold text-emerald-600 hover:underline"
                >
                  Isi sesuai minus ({formatRupiah(-currentSaldoJatah)})
                </button>
              )}
            </div>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              min={0}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-sm font-bold text-white transition-all ${
              type === 'tutup_defisit_jatah'
                ? 'bg-emerald-600 active:bg-emerald-700'
                : 'bg-rose-500 active:bg-rose-600'
            } disabled:opacity-50`}
          >
            {loading ? 'Menyimpan...' : type === 'tutup_defisit_jatah' ? '↔ Pindahkan ke Jatah Hidup' : '💸 Tarik Tabungan Pribadi'}
          </button>
        </form>
      )}

      {activeTab === 'riwayat' && (
        <div className="space-y-2">
          {withdrawals.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              Belum ada riwayat penarikan
            </div>
          ) : (
            withdrawals.map(w => (
              <div
                key={w.id}
                className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                    w.type === 'tutup_defisit_jatah' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {w.type === 'tutup_defisit_jatah'
                      ? <ArrowRightLeft className="w-3.5 h-3.5" />
                      : <ArrowDownCircle className="w-3.5 h-3.5" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{w.description}</p>
                    <p className="text-[10px] text-slate-400">
                      {w.withdrawal_date} · {w.type === 'tutup_defisit_jatah' ? 'Tutup Jatah Hidup' : 'Tarik Tunai'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  <span className={`text-sm font-bold ${
                    w.type === 'tutup_defisit_jatah' ? 'text-emerald-700' : 'text-rose-700'
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
