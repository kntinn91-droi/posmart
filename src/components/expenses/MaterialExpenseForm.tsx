import React, { useState } from 'react';
import { ExpenseCategory } from '../../types/database';
import { getTodayDateString } from '../../lib/formatters';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { ShoppingCart } from 'lucide-react';

interface MaterialExpenseFormProps {
  categories: ExpenseCategory[];
  onSubmit: (data: {
    expense_date: string;
    description: string;
    category_id: number;
    amount: number;
  }) => Promise<void>;
  isLoading?: boolean;
}

export const MaterialExpenseForm: React.FC<MaterialExpenseFormProps> = ({
  categories,
  onSubmit,
  isLoading = false
}) => {
  const [expenseDate, setExpenseDate] = useState<string>(getTodayDateString());
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (!description.trim()) {
      setError('Keterangan wajib diisi (misal: Beli telur 1 kg)');
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Nominal harus lebih besar dari 0');
      return;
    }

    try {
      await onSubmit({
        expense_date: expenseDate,
        description: description.trim(),
        category_id: Number(categoryId),
        amount: parsedAmount
      });
      setDescription('');
      setAmount('');
    } catch {
      setError('Gagal menyimpan belanja bahan');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <ShoppingCart className="w-5 h-5 text-sky-600" />
        <div>
          <h4 className="text-sm font-bold text-slate-800">Catat Belanja Bahan</h4>
          <p className="text-[11px] text-slate-500">Mempengaruhi saldo Kas Modal Putar (Kantong 1)</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      <Input
        type="date"
        label="Tanggal Belanja"
        value={expenseDate}
        onChange={(e) => setExpenseDate(e.target.value)}
        required
      />

      <Input
        label="Keterangan Belanja"
        placeholder="Contoh: Beli telur 1 kg, minyak, kardus martabak"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
          Kategori Bahan
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

      <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
        Simpan Belanja Bahan
      </Button>
    </form>
  );
};
