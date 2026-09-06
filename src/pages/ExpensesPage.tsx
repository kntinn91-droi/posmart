import React, { useState } from 'react';
import { useExpenses } from '../hooks/useExpenses';
import { MaterialExpenseForm } from '../components/expenses/MaterialExpenseForm';
import { PersonalExpenseForm } from '../components/expenses/PersonalExpenseForm';
import { formatRupiah, formatDateIndo } from '../lib/formatters';
import { Card } from '../components/common/Card';
import { ShoppingCart, UserCheck, CheckCircle2 } from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bahan' | 'pribadi'>('bahan');
  const {
    materialCategories,
    personalCategories,
    materialExpenses,
    personalExpenses,
    addMaterialExpense,
    addPersonalExpense,
    loading
  } = useExpenses();

  const [notification, setNotification] = useState<string>('');

  const handleMaterialSubmit = async (data: {
    expense_date: string;
    description: string;
    category_id: number;
    amount: number;
  }) => {
    await addMaterialExpense(data);
    setNotification('Belanja bahan berhasil dicatat!');
    setTimeout(() => setNotification(''), 3000);
  };

  const handlePersonalSubmit = async (data: {
    expense_date: string;
    description: string;
    category_id: number;
    amount: number;
  }) => {
    await addPersonalExpense(data);
    setNotification('Pengeluaran pribadi berhasil dicatat!');
    setTimeout(() => setNotification(''), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Tab Selector */}
      <div className="grid grid-cols-2 p-1 bg-slate-200/80 rounded-2xl">
        <button
          onClick={() => setActiveTab('bahan')}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'bahan'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingCart className="w-4 h-4 text-sky-600" />
          Belanja Bahan
        </button>
        <button
          onClick={() => setActiveTab('pribadi')}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'pribadi'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-600" />
          Pengeluaran Pribadi
        </button>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Form Section */}
      <Card>
        {activeTab === 'bahan' ? (
          <MaterialExpenseForm
            categories={materialCategories}
            onSubmit={handleMaterialSubmit}
            isLoading={loading}
          />
        ) : (
          <PersonalExpenseForm
            categories={personalCategories}
            onSubmit={handlePersonalSubmit}
            isLoading={loading}
          />
        )}
      </Card>

      {/* History Log */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-700 px-1">
          Riwayat {activeTab === 'bahan' ? 'Belanja Bahan' : 'Pengeluaran Pribadi'} Terkini
        </h4>

        {(activeTab === 'bahan' ? materialExpenses : personalExpenses).length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-100">
            Belum ada catatan tercatat.
          </div>
        ) : (
          <div className="space-y-2">
            {(activeTab === 'bahan' ? materialExpenses : personalExpenses).map((item) => (
              <div
                key={item.id}
                className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800">{item.description}</p>
                  <p className="text-[11px] text-slate-400">{formatDateIndo(item.expense_date)}</p>
                </div>
                <span className={`text-xs font-black ${
                  activeTab === 'bahan' ? 'text-sky-600' : 'text-rose-600'
                }`}>
                  {formatRupiah(item.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
