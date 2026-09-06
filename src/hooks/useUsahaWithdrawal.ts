import { useState, useEffect, useCallback } from 'react';
import { UsahaWithdrawal, UsahaWithdrawalType } from '../types/database';
import { localDb } from '../lib/db';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getTodayDateString } from '../lib/formatters';

export function useUsahaWithdrawal() {
  const [withdrawals, setWithdrawals] = useState<UsahaWithdrawal[]>([]);
  const [loading, setLoading] = useState(false);

  const loadWithdrawals = useCallback(async () => {
    try {
      const rows = await localDb.usahaWithdrawals
        .orderBy('withdrawal_date')
        .reverse()
        .toArray();
      setWithdrawals(rows);
    } catch (e) {
      console.error('Failed to load usahaWithdrawals', e);
    }
  }, []);

  useEffect(() => {
    loadWithdrawals();
  }, [loadWithdrawals]);

  /**
   * Tambah penarikan dari Tabungan Usaha.
   * type = 'pengeluaran' → uang keluar (beli aset, renovasi, dll)
   * type = 'tambah_modal' → uang dialihkan ke Kantong 1 Modal Putar
   */
  const addWithdrawal = async (data: {
    type: UsahaWithdrawalType;
    description: string;
    amount: number;
    withdrawal_date?: string;
  }) => {
    setLoading(true);
    try {
      const newRecord: UsahaWithdrawal = {
        id: 'wd_' + Date.now(),
        withdrawal_date: data.withdrawal_date || getTodayDateString(),
        type: data.type,
        description: data.description,
        amount: data.amount,
        created_at: new Date().toISOString()
      };

      await localDb.usahaWithdrawals.add(newRecord);

      if (isSupabaseConfigured) {
        await supabase.from('usaha_withdrawals').insert([{
          id: newRecord.id,
          withdrawal_date: newRecord.withdrawal_date,
          type: newRecord.type,
          description: newRecord.description,
          amount: newRecord.amount,
          created_at: newRecord.created_at
        }]);
      }

      setWithdrawals(prev => [newRecord, ...prev]);
      return newRecord;
    } finally {
      setLoading(false);
    }
  };

  const deleteWithdrawal = async (id: string) => {
    await localDb.usahaWithdrawals.delete(id);
    if (isSupabaseConfigured) {
      await supabase.from('usaha_withdrawals').delete().eq('id', id);
    }
    setWithdrawals(prev => prev.filter(w => w.id !== id));
  };

  /** Total penarikan dari tabungan usaha (semua jenis) */
  const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);

  /** Total yang hanya berpindah ke modal (tidak hilang, tapi masuk kantong 1) */
  const totalTambahModal = withdrawals
    .filter(w => w.type === 'tambah_modal')
    .reduce((sum, w) => sum + w.amount, 0);

  return {
    withdrawals,
    loading,
    totalWithdrawn,
    totalTambahModal,
    addWithdrawal,
    deleteWithdrawal,
    refreshWithdrawals: loadWithdrawals
  };
}
