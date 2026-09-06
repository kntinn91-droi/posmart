export type UserRole = 'owner' | 'kasir';
export type ProductStatus = 'aktif' | 'nonaktif';
export type ExpenseType = 'bahan' | 'pribadi';
export type ModeType = 'SEPI' | 'RAMAI';

export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'Terang Bulan' | 'Martabak' | string;
  selling_price: number | null;
  hpp_per_pcs: number | null;
  margin_rp?: number | null;
  margin_pct?: number | null;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface ProductPriceHistory {
  id: string;
  product_id: string;
  old_selling_price?: number | null;
  old_hpp_per_pcs?: number | null;
  new_selling_price?: number | null;
  new_hpp_per_pcs?: number | null;
  changed_by?: string | null;
  changed_at: string;
}

export interface SaleTransaction {
  id: string;
  transaction_date: string; // YYYY-MM-DD
  transaction_no: string;
  created_by?: string | null;
  created_at: string;
}

export interface SaleItem {
  id: string;
  transaction_id: string;
  product_id: string;
  qty: number;
  unit_price: number;
  unit_hpp: number;
  subtotal_omzet: number;
  subtotal_hpp: number;
  product?: Product;
}

export interface ExpenseCategory {
  id: number;
  type: ExpenseType;
  name: string;
}

export interface MaterialExpense {
  id: string;
  expense_date: string; // YYYY-MM-DD
  description: string;
  category_id: number;
  amount: number;
  created_by?: string | null;
  created_at: string;
  category?: ExpenseCategory;
}

export interface PersonalExpense {
  id: string;
  expense_date: string; // YYYY-MM-DD
  description: string;
  category_id: number;
  amount: number;
  created_by?: string | null;
  created_at: string;
  category?: ExpenseCategory;
}

export interface SystemSettings {
  id: string;
  effective_from: string; // YYYY-MM-DD
  ambang_profit_ramai: number;
  cap_gaji_ramai: number;
  rasio_gaji_sepi: number;
  rasio_hidup_ramai: number;
  rasio_tabungan_pribadi_ramai: number;
  rasio_hidup_sepi: number;
  rasio_tabungan_pribadi_sepi: number;
  created_at: string;
}

export interface InitialBalances {
  id: string;
  saldo_awal_usaha: number;
  saldo_awal_pribadi: number;
  saldo_awal_modal: number;
  migrated_at: string;
}

export interface DailyRecapRow {
  tanggal: string;
  total_omzet: number;
  total_hpp: number;
  total_belanja_bahan: number;
  profit_kotor: number;
  mode: ModeType;
  kantong1_modal_putar: number;
  kantong2_gaji_pemilik: number;
  kantong3_tabungan_usaha: number;
  jatah_kebutuhan_hidup: number;
  jatah_tabungan_pribadi: number;
  pengeluaran_pribadi_riil: number;
  sisa_selisih_jatah_hidup: number;
  tabungan_pribadi_hari_ini: number;
  saldo_kas_modal_putar: number;
  saldo_tabungan_usaha: number;
  saldo_tabungan_pribadi: number;
}
