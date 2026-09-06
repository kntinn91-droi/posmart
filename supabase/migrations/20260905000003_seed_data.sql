-- ============================================================
-- SEED DATA
-- ============================================================

-- 1. Kategori Pengeluaran
INSERT INTO expense_categories (type, name) VALUES
('bahan', 'Bahan Baku'),
('bahan', 'Kemasan'),
('bahan', 'Gas/Listrik'),
('bahan', 'Alat'),
('bahan', 'Lainnya'),
('pribadi', 'Makan'),
('pribadi', 'Bensin'),
('pribadi', 'Lainnya')
ON CONFLICT (type, name) DO NOTHING;

-- 2. System Settings Default
INSERT INTO system_settings (
  effective_from,
  ambang_profit_ramai,
  cap_gaji_ramai,
  rasio_gaji_sepi,
  rasio_hidup_ramai,
  rasio_tabungan_pribadi_ramai,
  rasio_hidup_sepi,
  rasio_tabungan_pribadi_sepi
) VALUES (
  '2026-09-01',
  200000,
  100000,
  0.50,
  0.50,
  0.50,
  0.70,
  0.30
);

-- 3. Initial Balances (Saldo Awal)
INSERT INTO initial_balances (saldo_awal_usaha, saldo_awal_pribadi, saldo_awal_modal)
VALUES (0, 0, 0);

-- 4. Produk Master (21 Aktif + 4 Nonaktif)
INSERT INTO products (name, category, selling_price, hpp_per_pcs, status) VALUES
('Terang Bulan Coklat 10k', 'Terang Bulan', 10000, 5740, 'aktif'),
('Terang Bulan Coklat 15k', 'Terang Bulan', 15000, 6565, 'aktif'),
('Terang Bulan Coklat 20k', 'Terang Bulan', 20000, 7390, 'aktif'),
('Terang Bulan Kacang 10k', 'Terang Bulan', 10000, 5515, 'aktif'),
('Terang Bulan Kacang 15k', 'Terang Bulan', 15000, 6227, 'aktif'),
('Terang Bulan Kacang 20k', 'Terang Bulan', 20000, 6940, 'aktif'),
('Terang Bulan Strawberry 10k', 'Terang Bulan', 10000, 4930, 'aktif'),
('Terang Bulan Strawberry 15k', 'Terang Bulan', 15000, 5350, 'aktif'),
('Terang Bulan Coklat-Kacang 15k', 'Terang Bulan', 15000, 6396, 'aktif'),
('Terang Bulan Coklat-Kacang 20k', 'Terang Bulan', 20000, 7165, 'aktif'),
('Terang Bulan Keju 20k', 'Terang Bulan', 20000, 6257, 'aktif'),
('Terang Bulan Keju 25k', 'Terang Bulan', 25000, 6690, 'aktif'),
('Terang Bulan Keju Kacang 20k', 'Terang Bulan', 20000, 6598, 'aktif'),
('Terang Bulan Keju Kacang 25k', 'Terang Bulan', 25000, 7171, 'aktif'),
('Terang Bulan Keju Coklat 20k', 'Terang Bulan', 20000, 6823, 'aktif'),
('Terang Bulan Keju Coklat 25k', 'Terang Bulan', 25000, 7453, 'aktif'),
('Terang Bulan Keju Kacang Coklat 25k', 'Terang Bulan', 25000, 7520, 'aktif'),
('Martabak Telur 1', 'Martabak', 15000, 5451, 'aktif'),
('Martabak Telur 2', 'Martabak', 20000, 7614, 'aktif'),
('Martabak Telur 3', 'Martabak', 25000, 9776, 'aktif'),
('Martabak Telur 4', 'Martabak', 35000, 11939, 'aktif'),
('Terang Bulan Kacang Hijau', 'Terang Bulan', NULL, NULL, 'nonaktif'),
('Terang Bulan Ketan Hitam', 'Terang Bulan', NULL, NULL, 'nonaktif'),
('Terang Bulan Pisang', 'Terang Bulan', NULL, NULL, 'nonaktif'),
('Martabak Telur Bebek', 'Martabak', NULL, NULL, 'nonaktif')
ON CONFLICT (name) DO UPDATE SET
  category = EXCLUDED.category,
  selling_price = EXCLUDED.selling_price,
  hpp_per_pcs = EXCLUDED.hpp_per_pcs,
  status = EXCLUDED.status;
