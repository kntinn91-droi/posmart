import React, { useState } from 'react';
import { useExpenses } from '../hooks/useExpenses';
import { MaterialExpenseForm } from '../components/expenses/MaterialExpenseForm';
import { PersonalExpenseForm } from '../components/expenses/PersonalExpenseForm';
import { EditExpenseModal } from '../components/expenses/EditExpenseModal';
import { ExpenseHistory } from '../components/expenses/ExpenseHistory';
import { formatRupiah } from '../lib/formatters';
import { Card } from '../components/common/Card';
import { MaterialExpense, PersonalExpense } from '../types/database';
import { ShoppingCart, UserCheck, CheckCircle2, Trash2, AlertTriangle } from 'lucide-react';

type ExpenseWithType = (MaterialExpense | PersonalExpense) & { type: 'bahan' | 'pribadi' };

export const ExpensesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bahan' | 'pribadi'>('bahan');
  const {
    materialCategories,
    personalCategories,
    materialExpenses,
    personalExpenses,
    addMaterialExpense,
    addPersonalExpense,
    updateExpense,
    deleteExpense,
    loading,
  } = useExpenses();

  const [notification, setNotification] = useState<string>('');

  // Edit state
  const [editingExpense, setEditingExpense] = useState<ExpenseWithType | null>(null);

  // Delete confirmation state
  const [deletingExpense, setDeletingExpense] = useState<ExpenseWithType | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleMaterialSubmit = async (data: {
    expense_date: string;
    description: string;
    category_id: number;
    amount: number;
  }) => {
    await addMaterialExpense(data);
    showNotification('Belanja bahan berhasil dicatat!');
  };

  const handlePersonalSubmit = async (data: {
    expense_date: string;
    description: string;
    category_id: number;
    amount: number;
  }) => {
    await addPersonalExpense(data);
    showNotification('Pengeluaran pribadi berhasil dicatat!');
  };

  const handleEditSave = async (data: {
    expense_date: string;
    description: string;
    category_id: number;
    amount: number;
  }) => {
    if (!editingExpense) return;
    await updateExpense(editingExpense.id, editingExpense.type, data);
    showNotification('Pengeluaran berhasil diperbarui!');
  };

  const handleDeleteConfirm = async () => {
    if (!deletingExpense) return;
    setDeleteLoading(true);
    await deleteExpense(deletingExpense.id, deletingExpense.type);
    setDeleteLoading(false);
    setDeletingExpense(null);
    showNotification('Catatan berhasil dihapus.');
  };

  const activeExpenses: ExpenseWithType[] = (
    activeTab === 'bahan' ? materialExpenses : personalExpenses
  ).map(e => ({ ...e, type: activeTab }));

  const activeCategories = activeTab === 'bahan' ? materialCategories : personalCategories;

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
      <ExpenseHistory
        expenses={activeExpenses}
        activeTab={activeTab}
        onEdit={setEditingExpense}
        onDelete={setDeletingExpense}
      />

      {/* Edit Modal */}
      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          categories={activeCategories}
          onSave={handleEditSave}
          onClose={() => setEditingExpense(null)}
          isLoading={loading}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingExpense && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4 sm:items-center"
          onClick={(e) => { if (e.target === e.currentTarget) setDeletingExpense(null); }}
        >
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-100 rounded-xl shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Hapus Catatan?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Catatan <span className="font-semibold text-slate-700">"{deletingExpense.description}"</span> sebesar{' '}
                  <span className="font-semibold text-rose-600">{formatRupiah(deletingExpense.amount)}</span> akan dihapus permanen.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingExpense(null)}
                disabled={deleteLoading}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deleteLoading ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
