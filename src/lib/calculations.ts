import { KantongCalculationInput, KantongCalculationResult } from '../types/kantong';
import { ModeType } from '../types/database';

/**
 * Mesin kalkulasi logika Sistem 3 Kantong
 * Sesuai 1:1 dengan rumus Excel & SQL VIEW daily_recap
 */
export function calculateKantong(input: KantongCalculationInput): KantongCalculationResult {
  const {
    total_omzet,
    total_hpp,
    total_belanja_bahan,
    pengeluaran_pribadi_riil,
    ambang_profit_ramai,
    rasio_gaji_ramai,
    rasio_gaji_sepi,
    rasio_hidup_ramai,
    rasio_tabungan_pribadi_ramai,
    rasio_hidup_sepi,
    rasio_tabungan_pribadi_sepi
  } = input;

  // Langkah 1: Profit Kotor
  const profit_kotor = total_omzet - total_hpp;

  // Langkah 2: Kantong 1 - Modal Putar (berjalan independen)
  const kantong1_modal_putar = total_hpp - total_belanja_bahan;

  // Langkah 3: Tentukan Mode
  const mode: ModeType = profit_kotor < ambang_profit_ramai ? 'SEPI' : 'RAMAI';

  // Langkah 4: Kantong 2 - Gaji Pemilik (tanpa batas maksimal/cap, berbasis persentase rasio)
  let kantong2_gaji_pemilik = 0;
  if (mode === 'SEPI') {
    kantong2_gaji_pemilik = profit_kotor * rasio_gaji_sepi;
  } else {
    kantong2_gaji_pemilik = profit_kotor * (rasio_gaji_ramai ?? 0.5);
  }

  // Langkah 5: Kantong 3 - Tabungan Usaha
  const kantong3_tabungan_usaha = profit_kotor - kantong2_gaji_pemilik;

  // Langkah 6: Pemecahan Gaji Pemilik ke Jatah Hidup & Jatah Tabungan Pribadi
  let jatah_kebutuhan_hidup = 0;
  let jatah_tabungan_pribadi = 0;

  if (mode === 'SEPI') {
    jatah_kebutuhan_hidup = kantong2_gaji_pemilik * rasio_hidup_sepi;
    jatah_tabungan_pribadi = kantong2_gaji_pemilik * rasio_tabungan_pribadi_sepi;
  } else {
    jatah_kebutuhan_hidup = kantong2_gaji_pemilik * rasio_hidup_ramai;
    jatah_tabungan_pribadi = kantong2_gaji_pemilik * rasio_tabungan_pribadi_ramai;
  }

  // Langkah 7: Bandingkan Jatah Hidup dengan realita pengeluaran pribadi
  const sisa_selisih_jatah_hidup = jatah_kebutuhan_hidup - pengeluaran_pribadi_riil;

  // Tabungan Pribadi Hari Ini (jika boros, otomatis memotong tabungan pribadi)
  const tabungan_pribadi_hari_ini = jatah_tabungan_pribadi + sisa_selisih_jatah_hidup;

  return {
    profit_kotor,
    mode,
    kantong1_modal_putar,
    kantong2_gaji_pemilik,
    kantong3_tabungan_usaha,
    jatah_kebutuhan_hidup,
    jatah_tabungan_pribadi,
    pengeluaran_pribadi_riil,
    sisa_selisih_jatah_hidup,
    tabungan_pribadi_hari_ini
  };
}
