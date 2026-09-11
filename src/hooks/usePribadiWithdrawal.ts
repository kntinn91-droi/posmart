import { useState, useEffect, useCallback } from 'react';
import { PribadiWithdrawal, PribadiWithdrawalType } from '../types/database';
import { localDb } from '../lib/db';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getTodayDateString } from '../lib/formatters';

export function usePribadiWithdrawal() {
  const [withdrawals, setWithdrawals] = useState<PribadiWithdrawal[]>([]);
  const [loading, setLoading] = useState(false);

  const loadWithdrawals = useCallback(async () => {
    try {
      const rows = await localDb.pribadiWithdrawals
        .orderBy('withdrawal_date')
        .reverse()
        .toArray();
      setWithdrawals(rows);
    } catch (e) {
      console.error('Failed to load pribadiWithdrawals', e);
    }
  }, []);

  useEffect(() => {
    loadWithdrawals();
  }, [loadWithdrawals]);

  /**
   * Tambah penarikan dari Tabungan Pribadi.
   * type = 'tarik_tunai' → uang keluar untuk keperluan pribadi (beli barang, dll)
   * type = 'tutup_defisit_jatah' → uang dialihkan untuk memutihkan saldo minus jatah hidup
   */
  const addWithdrawal = async (data: {
    type: PribadiWithdrawalType;
    description: string;
    amount: number;
    withdrawal_date?: string;
  }) => {
    setLoading(true);
    try {
      const newRecord: PribadiWithdrawal = {
        id: 'pwd_' + Date.now(),
        withdrawal_date: data.withdrawal_date || getTodayDateString(),
        type: data.type,
        description: data.description,
        amount: data.amount,
        created_at: new Date().toISOString()
      };

      await localDb.pribadiWithdrawals.add(newRecord);

      if (isSupabaseConfigured) {
        await supabase.from('pribadi_withdrawals').insert([{
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
    await localDb.pribadiWithdrawals.delete(id);
    if (isSupabaseConfigured) {
      await supabase.from('pribadi_withdrawals').delete().eq('id', id);
    }
    setWithdrawals(prev => prev.filter(w => w.id !== id));
  };

  /** Total penarikan dari tabungan pribadi (semua jenis) */
  const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);

  /** Total yang dialihkan untuk menutup defisit jatah hidup */
  const totalTutupDefisit = withdrawals
    .filter(w => w.type === 'tutup_defisit_jatah')
    .reduce((sum, w) => sum + w.amount, 0);

  return {
    withdrawals,
    loading,
    totalWithdrawn,
    totalTutupDefisit,
    addWithdrawal,
    deleteWithdrawal,
    refreshWithdrawals: loadWithdrawals
  };
}
