import { useState, useEffect } from 'react';
import { ExpenseCategory, MaterialExpense, PersonalExpense } from '../types/database';
import { localDb } from '../lib/db';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  { id: 1, type: 'bahan', name: 'Bahan Baku' },
  { id: 2, type: 'bahan', name: 'Kemasan' },
  { id: 3, type: 'bahan', name: 'Gas/Listrik' },
  { id: 4, type: 'bahan', name: 'Alat' },
  { id: 5, type: 'bahan', name: 'Lainnya' },
  { id: 6, type: 'pribadi', name: 'Makan' },
  { id: 7, type: 'pribadi', name: 'Bensin' },
  { id: 8, type: 'pribadi', name: 'Lainnya' },
];

export function useExpenses() {
  const [categories] = useState<ExpenseCategory[]>(DEFAULT_CATEGORIES);
  const [materialExpenses, setMaterialExpenses] = useState<MaterialExpense[]>([]);
  const [personalExpenses, setPersonalExpenses] = useState<PersonalExpense[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLocalExpenses();
  }, []);

  const loadLocalExpenses = async () => {
    try {
      const offlineExpenses = await localDb.offlineExpenses.toArray();
      const mat = offlineExpenses.filter(e => e.type === 'bahan').map(e => ({
        id: e.local_id,
        expense_date: e.expense_date,
        description: e.description,
        category_id: e.category_id,
        amount: e.amount,
        created_at: e.created_at
      }));
      const per = offlineExpenses.filter(e => e.type === 'pribadi').map(e => ({
        id: e.local_id,
        expense_date: e.expense_date,
        description: e.description,
        category_id: e.category_id,
        amount: e.amount,
        created_at: e.created_at
      }));
      setMaterialExpenses(mat);
      setPersonalExpenses(per);
    } catch (e) {
      console.error(e);
    }
  };

  const addMaterialExpense = async (data: {
    expense_date: string;
    description: string;
    category_id: number;
    amount: number;
  }) => {
    setLoading(true);
    const localId = 'mat_' + Date.now();
    const newExpense: MaterialExpense = {
      id: localId,
      ...data,
      created_at: new Date().toISOString()
    };

    setMaterialExpenses(prev => [newExpense, ...prev]);

    await localDb.offlineExpenses.add({
      local_id: localId,
      type: 'bahan',
      expense_date: data.expense_date,
      category_id: data.category_id,
      description: data.description,
      amount: data.amount,
      synced: isSupabaseConfigured ? 1 : 0,
      created_at: newExpense.created_at
    });

    if (isSupabaseConfigured) {
      await supabase.from('material_expenses').insert([data]);
    }
    setLoading(false);
  };

  const addPersonalExpense = async (data: {
    expense_date: string;
    description: string;
    category_id: number;
    amount: number;
  }) => {
    setLoading(true);
    const localId = 'per_' + Date.now();
    const newExpense: PersonalExpense = {
      id: localId,
      ...data,
      created_at: new Date().toISOString()
    };

    setPersonalExpenses(prev => [newExpense, ...prev]);

    await localDb.offlineExpenses.add({
      local_id: localId,
      type: 'pribadi',
      expense_date: data.expense_date,
      category_id: data.category_id,
      description: data.description,
      amount: data.amount,
      synced: isSupabaseConfigured ? 1 : 0,
      created_at: newExpense.created_at
    });

    if (isSupabaseConfigured) {
      await supabase.from('personal_expenses').insert([data]);
    }
    setLoading(false);
  };

  const updateExpense = async (
    id: string,
    type: 'bahan' | 'pribadi',
    data: {
      expense_date: string;
      description: string;
      category_id: number;
      amount: number;
    }
  ) => {
    setLoading(true);
    try {
      // Update local IndexedDB
      await localDb.offlineExpenses
        .where('local_id')
        .equals(id)
        .modify({
          expense_date: data.expense_date,
          description: data.description,
          category_id: data.category_id,
          amount: data.amount,
        });

      // Update React state
      if (type === 'bahan') {
        setMaterialExpenses(prev =>
          prev.map(e => (e.id === id ? { ...e, ...data } : e))
        );
      } else {
        setPersonalExpenses(prev =>
          prev.map(e => (e.id === id ? { ...e, ...data } : e))
        );
      }

      // Sync to Supabase if configured (best-effort)
      if (isSupabaseConfigured) {
        const table = type === 'bahan' ? 'material_expenses' : 'personal_expenses';
        await supabase.from(table).update(data).eq('id', id);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const deleteExpense = async (id: string, type: 'bahan' | 'pribadi') => {
    setLoading(true);
    try {
      // Delete from local IndexedDB
      await localDb.offlineExpenses.where('local_id').equals(id).delete();

      // Update React state
      if (type === 'bahan') {
        setMaterialExpenses(prev => prev.filter(e => e.id !== id));
      } else {
        setPersonalExpenses(prev => prev.filter(e => e.id !== id));
      }

      // Sync to Supabase if configured (best-effort)
      if (isSupabaseConfigured) {
        const table = type === 'bahan' ? 'material_expenses' : 'personal_expenses';
        await supabase.from(table).delete().eq('id', id);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return {
    categories,
    materialCategories: categories.filter(c => c.type === 'bahan'),
    personalCategories: categories.filter(c => c.type === 'pribadi'),
    materialExpenses,
    personalExpenses,
    loading,
    addMaterialExpense,
    addPersonalExpense,
    updateExpense,
    deleteExpense,
  };
}
