import React, { useState, useEffect } from 'react';
import { ExpenseCategory, MaterialExpense, PersonalExpense } from '../../types/database';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { X } from 'lucide-react';

interface EditExpenseModalProps {
  expense: (MaterialExpense | PersonalExpense) & { type: 'bahan' | 'pribadi' };
  categories: ExpenseCategory[];
  onSave: (data: {
    expense_date: string;
    description: string;
    category_id: number;
    amount: number;
  }) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  expense,
  categories,
  onSave,
  onClose,
  isLoading = false,
}) => {
  const [expenseDate, setExpenseDate] = useState(expense.expense_date);
  const [description, setDescription] = useState(expense.description);
  const [categoryId, setCategoryId] = useState(expense.category_id);
  const [amount, setAmount] = useState(String(expense.amount));
  const [error, setError] = useState('');

  // Close modal on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (!description.trim()) {
      setError('Keterangan wajib diisi');
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Nominal harus lebih besar dari 0');
      return;
    }

    try {
      await onSave({
        expense_date: expenseDate,
        description: description.trim(),
        category_id: Number(categoryId),
        amount: parsedAmount,
      });
      onClose();
    } catch {
      setError('Gagal menyimpan perubahan');
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4 sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Edit Pengeluaran</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          <Input
            type="date"
            label="Tanggal"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            required
          />

          <Input
            label="Keterangan"
            placeholder="Keterangan pengeluaran"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Kategori
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Nominal (Rp)"
            type="number"
            placeholder="Contoh: 28000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" fullWidth onClick={onClose} isLoading={false}>
              Batal
            </Button>
            <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
              Simpan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
