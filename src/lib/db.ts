import Dexie, { type Table } from 'dexie';
import { Product, ExpenseCategory } from '../types/database';

export interface OfflineSaleTransaction {
  id?: number;
  local_id: string;
  transaction_date: string;
  transaction_no: string;
  items: {
    product_id: string;
    product_name: string;
    qty: number;
    unit_price: number;
    unit_hpp: number;
    subtotal_omzet: number;
    subtotal_hpp: number;
  }[];
  total_omzet: number;
  total_hpp: number;
  synced: number; // 0: false, 1: true
  created_at: string;
}

export interface OfflineExpense {
  id?: number;
  local_id: string;
  type: 'bahan' | 'pribadi';
  expense_date: string;
  category_id: number;
  category_name?: string;
  description: string;
  amount: number;
  synced: number;
  created_at: string;
}

export class PosDatabase extends Dexie {
  products!: Table<Product, string>;
  categories!: Table<ExpenseCategory, number>;
  offlineSales!: Table<OfflineSaleTransaction, number>;
  offlineExpenses!: Table<OfflineExpense, number>;

  constructor() {
    super('PosMartabakDB');
    this.version(1).stores({
      products: 'id, name, category, status',
      categories: 'id, type, name',
      offlineSales: '++id, local_id, transaction_date, synced',
      offlineExpenses: '++id, local_id, expense_date, type, synced'
    });
  }
}

export const localDb = new PosDatabase();
