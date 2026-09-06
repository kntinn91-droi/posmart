import { ModeType } from './database';

export interface KantongCalculationInput {
  total_omzet: number;
  total_hpp: number;
  total_belanja_bahan: number;
  pengeluaran_pribadi_riil: number;
  ambang_profit_ramai: number;
  cap_gaji_ramai: number;
  rasio_gaji_sepi: number;
  rasio_hidup_ramai: number;
  rasio_tabungan_pribadi_ramai: number;
  rasio_hidup_sepi: number;
  rasio_tabungan_pribadi_sepi: number;
}

export interface KantongCalculationResult {
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
}

export interface DashboardSummary {
  today_recap?: KantongCalculationResult;
  saldo_tabungan_usaha: number;
  saldo_tabungan_pribadi: number;
  saldo_kas_modal_putar: number;
  month_omzet: number;
  month_profit_kotor: number;
  month_tabungan_usaha: number;
  month_tabungan_pribadi: number;
}
