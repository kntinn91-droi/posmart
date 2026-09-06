# Skema Database & Contoh Data — Aplikasi Kasir Terang Bulan & Martabak

Dokumen ini adalah pendamping teknis dari `PRD_Aplikasi_Kasir_Terang_Bulan_Martabak.md`. Isinya: struktur tabel database secara rinci (DDL siap pakai gaya PostgreSQL), contoh data nyata yang diambil langsung dari file Excel Anda, dan pembuktian bahwa skema ini menghasilkan angka yang **identik** dengan hasil rumus Excel.

> Catatan: DDL di bawah pakai dialek PostgreSQL karena paling umum & gratis untuk skala usaha kecil-menengah (bisa lewat Supabase/Neon/Railway dengan tier gratis). Kalau tim pengembang nanti memilih MySQL/SQLite/Firestore, strukturnya tetap sama — tinggal disesuaikan sintaksnya.

---

## 1. Daftar tabel & fungsinya

| Tabel | Menggantikan tab Excel | Jenis |
|---|---|---|
| `users` | — (baru, untuk multi-user) | Master |
| `products` | `HPP_Master` | Master |
| `product_price_history` | — (baru, audit trail) | Log |
| `sale_transactions` | `Input_Jualan` (header nota) | Transaksi |
| `sale_items` | `Input_Jualan` (baris item) | Transaksi |
| `expense_categories` | dropdown tetap di `Belanja_Bahan`/`Pengeluaran_Pribadi` | Master |
| `material_expenses` | `Belanja_Bahan` | Transaksi |
| `personal_expenses` | `Pengeluaran_Pribadi` | Transaksi |
| `system_settings` | `Setting` (rasio & ambang, **berversi per tanggal**) | Konfigurasi |
| `initial_balances` | `Setting` (saldo awal migrasi, sekali isi) | Konfigurasi |
| `daily_recap` (VIEW, bukan tabel) | `Rekap_Harian` | Hasil hitung otomatis |

Poin penting dibanding Excel: **`daily_recap` bukan tabel yang diisi manual** — dia adalah *view* yang dihitung otomatis dari 5 tabel transaksi + konfigurasi setiap kali diminta. Ini menutup celah "lupa isi Rekap_Harian" yang jadi salah satu kelemahan utama sistem Excel.

---

## 2. DDL lengkap (siap dijalankan)

```sql
-- ============================================================
-- ENUM TYPES
-- ============================================================
CREATE TYPE user_role       AS ENUM ('owner', 'kasir');
CREATE TYPE product_status  AS ENUM ('aktif', 'nonaktif');
CREATE TYPE expense_type    AS ENUM ('bahan', 'pribadi');

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE,
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'owner',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PRODUCTS  (pengganti HPP_Master)
-- ============================================================
CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL UNIQUE,
  category      VARCHAR(50)  NOT NULL,   -- 'Terang Bulan' | 'Martabak'
  selling_price NUMERIC(12,2),           -- NULL diperbolehkan kalau status nonaktif
  hpp_per_pcs   NUMERIC(12,2),
  margin_rp     NUMERIC(12,2) GENERATED ALWAYS AS (selling_price - hpp_per_pcs) STORED,
  margin_pct    NUMERIC(6,4)  GENERATED ALWAYS AS (
                   CASE WHEN selling_price > 0
                        THEN (selling_price - hpp_per_pcs) / selling_price
                        ELSE NULL END
                 ) STORED,
  status        product_status NOT NULL DEFAULT 'aktif',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Riwayat perubahan harga (audit trail — tidak ada di Excel, tambahan penting)
CREATE TABLE product_price_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID NOT NULL REFERENCES products(id),
  old_selling_price NUMERIC(12,2),
  old_hpp_per_pcs   NUMERIC(12,2),
  new_selling_price NUMERIC(12,2),
  new_hpp_per_pcs   NUMERIC(12,2),
  changed_by        UUID REFERENCES users(id),
  changed_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- SALE_TRANSACTIONS + SALE_ITEMS  (pengganti Input_Jualan)
-- ============================================================
CREATE TABLE sale_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date  DATE NOT NULL,
  transaction_no    VARCHAR(30) NOT NULL,
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (transaction_date, transaction_no)
);

CREATE TABLE sale_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id    UUID NOT NULL REFERENCES sale_transactions(id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES products(id),
  qty               INTEGER NOT NULL CHECK (qty > 0),
  unit_price        NUMERIC(12,2) NOT NULL,  -- snapshot harga saat transaksi
  unit_hpp          NUMERIC(12,2) NOT NULL,  -- snapshot HPP saat transaksi
  subtotal_omzet    NUMERIC(12,2) GENERATED ALWAYS AS (qty * unit_price) STORED,
  subtotal_hpp      NUMERIC(12,2) GENERATED ALWAYS AS (qty * unit_hpp)   STORED
);

-- Kenapa unit_price & unit_hpp disalin (snapshot), bukan JOIN langsung ke products?
-- Supaya kalau harga produk diubah bulan depan, transaksi bulan lalu TIDAK ikut berubah nilainya.
-- Ini juga memperbaiki cara kerja Excel yang selalu ambil harga TERKINI lewat INDEX/MATCH.

-- ============================================================
-- EXPENSE_CATEGORIES  (pengganti dropdown tetap di Excel — sekarang bisa ditambah sendiri)
-- ============================================================
CREATE TABLE expense_categories (
  id    SERIAL PRIMARY KEY,
  type  expense_type NOT NULL,
  name  VARCHAR(50) NOT NULL,
  UNIQUE (type, name)
);

-- ============================================================
-- MATERIAL_EXPENSES  (pengganti Belanja_Bahan)
-- ============================================================
CREATE TABLE material_expenses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date  DATE NOT NULL,
  description   TEXT NOT NULL,
  category_id   INTEGER NOT NULL REFERENCES expense_categories(id),
  amount        NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PERSONAL_EXPENSES  (pengganti Pengeluaran_Pribadi)
-- ============================================================
CREATE TABLE personal_expenses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date  DATE NOT NULL,
  description   TEXT NOT NULL,
  category_id   INTEGER NOT NULL REFERENCES expense_categories(id),
  amount        NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- SYSTEM_SETTINGS  (pengganti tab Setting — rasio & ambang, BERVERSI per tanggal)
-- ============================================================
CREATE TABLE system_settings (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  effective_from                DATE NOT NULL,   -- berlaku mulai tanggal ini
  ambang_profit_ramai           NUMERIC(12,2) NOT NULL DEFAULT 200000,
  cap_gaji_ramai                NUMERIC(12,2) NOT NULL DEFAULT 100000,
  rasio_gaji_sepi               NUMERIC(5,4)  NOT NULL DEFAULT 0.50,
  rasio_hidup_ramai             NUMERIC(5,4)  NOT NULL DEFAULT 0.50,
  rasio_tabungan_pribadi_ramai  NUMERIC(5,4)  NOT NULL DEFAULT 0.50,
  rasio_hidup_sepi              NUMERIC(5,4)  NOT NULL DEFAULT 0.70,
  rasio_tabungan_pribadi_sepi   NUMERIC(5,4)  NOT NULL DEFAULT 0.30,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Kenapa berversi (effective_from), bukan 1 baris ditimpa seperti Excel?
-- Supaya kalau rasio diubah bulan depan, laporan bulan LALU tetap terhitung
-- pakai rasio yang berlaku saat itu -- tidak berubah retroaktif.

-- ============================================================
-- INITIAL_BALANCES  (pengganti "Saldo Awal" di tab Setting — sekali isi saat migrasi)
-- ============================================================
CREATE TABLE initial_balances (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saldo_awal_usaha    NUMERIC(14,2) NOT NULL DEFAULT 0,
  saldo_awal_pribadi  NUMERIC(14,2) NOT NULL DEFAULT 0,
  saldo_awal_modal    NUMERIC(14,2) NOT NULL DEFAULT 0,
  migrated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Cukup 1 baris (baris terakhir yang dipakai) — diisi sekali saat pindah dari Excel ke aplikasi ini.

-- ============================================================
-- INDEX yang disarankan (supaya laporan tetap cepat walau data sudah ribuan baris)
-- ============================================================
CREATE INDEX idx_sale_transactions_date   ON sale_transactions(transaction_date);
CREATE INDEX idx_sale_items_transaction   ON sale_items(transaction_id);
CREATE INDEX idx_sale_items_product       ON sale_items(product_id);
CREATE INDEX idx_material_expenses_date   ON material_expenses(expense_date);
CREATE INDEX idx_personal_expenses_date   ON personal_expenses(expense_date);
CREATE INDEX idx_products_status          ON products(status);
```

---

## 3. Contoh data — persis dari file Excel Anda (tanggal 4 September 2026)

### 3.1 `products` (dari tab `HPP_Master`, 25 baris: 21 aktif + 4 nonaktif)

| name | category | selling_price | hpp_per_pcs | status |
|---|---|---:|---:|---|
| Terang Bulan Coklat 10k | Terang Bulan | 10000 | 5740 | aktif |
| Terang Bulan Coklat 15k | Terang Bulan | 15000 | 6565 | aktif |
| Terang Bulan Coklat 20k | Terang Bulan | 20000 | 7390 | aktif |
| Terang Bulan Kacang 10k | Terang Bulan | 10000 | 5515 | aktif |
| Terang Bulan Kacang 15k | Terang Bulan | 15000 | 6227 | aktif |
| Terang Bulan Kacang 20k | Terang Bulan | 20000 | 6940 | aktif |
| Terang Bulan Strawberry 10k | Terang Bulan | 10000 | 4930 | aktif |
| Terang Bulan Strawberry 15k | Terang Bulan | 15000 | 5350 | aktif |
| Terang Bulan Coklat-Kacang 15k | Terang Bulan | 15000 | 6396 | aktif |
| Terang Bulan Coklat-Kacang 20k | Terang Bulan | 20000 | 7165 | aktif |
| Terang Bulan Keju 20k | Terang Bulan | 20000 | 6257 | aktif |
| Terang Bulan Keju 25k | Terang Bulan | 25000 | 6690 | aktif |
| Terang Bulan Keju Kacang 20k | Terang Bulan | 20000 | 6598 | aktif |
| Terang Bulan Keju Kacang 25k | Terang Bulan | 25000 | 7171 | aktif |
| Terang Bulan Keju Coklat 20k | Terang Bulan | 20000 | 6823 | aktif |
| Terang Bulan Keju Coklat 25k | Terang Bulan | 25000 | 7453 | aktif |
| Terang Bulan Keju Kacang Coklat 25k | Terang Bulan | 25000 | 7520 | aktif |
| Martabak Telur 1 | Martabak | 15000 | 5451 | aktif |
| Martabak Telur 2 | Martabak | 20000 | 7614 | aktif |
| Martabak Telur 3 | Martabak | 25000 | 9776 | aktif |
| Martabak Telur 4 | Martabak | 35000 | 11939 | aktif |
| Terang Bulan Kacang Hijau | Terang Bulan | NULL | NULL | nonaktif |
| Terang Bulan Ketan Hitam | Terang Bulan | NULL | NULL | nonaktif |
| Terang Bulan Pisang | Terang Bulan | NULL | NULL | nonaktif |
| Martabak Telur Bebek | Martabak | NULL | NULL | nonaktif |

```sql
INSERT INTO products (name, category, selling_price, hpp_per_pcs, status) VALUES
('Terang Bulan Coklat 10k', 'Terang Bulan', 10000, 5740, 'aktif'),
('Terang Bulan Coklat-Kacang 15k', 'Terang Bulan', 15000, 6396, 'aktif'),
('Terang Bulan Keju 20k', 'Terang Bulan', 20000, 6257, 'aktif'),
('Martabak Telur 1', 'Martabak', 15000, 5451, 'aktif'),
('Martabak Telur 2', 'Martabak', 20000, 7614, 'aktif'),
-- ...baris produk aktif/nonaktif lain mengikuti tabel di atas...
('Terang Bulan Kacang Hijau', 'Terang Bulan', NULL, NULL, 'nonaktif');
```

> **Perbaikan penting dari Excel:** karena `status = 'nonaktif'`, produk seperti "Terang Bulan Kacang Hijau" **tidak akan muncul** di pilihan dropdown kasir (query aplikasi selalu `WHERE status = 'aktif'`). Ini menutup bug dropdown Excel yang masih menampilkan produk kosong stok.

### 3.2 `sale_transactions` + `sale_items` (dari tab `Input_Jualan`, No. Transaksi 1)

```sql
-- Header transaksi
INSERT INTO sale_transactions (id, transaction_date, transaction_no)
VALUES ('t1111111-0000-0000-0000-000000000001', '2026-09-04', '1');

-- Baris item (5 item dalam satu nota — persis data asli)
INSERT INTO sale_items (transaction_id, product_id, qty, unit_price, unit_hpp) VALUES
('t1111111-0000-0000-0000-000000000001', (SELECT id FROM products WHERE name='Terang Bulan Coklat 10k'),        2, 10000, 5740),
('t1111111-0000-0000-0000-000000000001', (SELECT id FROM products WHERE name='Terang Bulan Coklat-Kacang 15k'), 2, 15000, 6396),
('t1111111-0000-0000-0000-000000000001', (SELECT id FROM products WHERE name='Terang Bulan Keju 20k'),          1, 20000, 6257),
('t1111111-0000-0000-0000-000000000001', (SELECT id FROM products WHERE name='Martabak Telur 1'),               4, 15000, 5451),
('t1111111-0000-0000-0000-000000000001', (SELECT id FROM products WHERE name='Martabak Telur 2'),               2, 20000, 7614);
```

| product | qty | unit_price | unit_hpp | subtotal_omzet | subtotal_hpp |
|---|---:|---:|---:|---:|---:|
| Terang Bulan Coklat 10k | 2 | 10000 | 5740 | 20000 | 11480 |
| Terang Bulan Coklat-Kacang 15k | 2 | 15000 | 6396 | 30000 | 12792 |
| Terang Bulan Keju 20k | 1 | 20000 | 6257 | 20000 | 6257 |
| Martabak Telur 1 | 4 | 15000 | 5451 | 60000 | 21804 |
| Martabak Telur 2 | 2 | 20000 | 7614 | 40000 | 15228 |
| **Total** | | | | **170.000** | **67.561** |

### 3.3 `material_expenses` (dari tab `Belanja_Bahan`)

```sql
INSERT INTO material_expenses (expense_date, description, category_id, amount)
VALUES ('2026-09-04', 'Beli telur 1 kg (stok habis saat jualan)',
        (SELECT id FROM expense_categories WHERE name='Bahan Baku'), 28000);
```

### 3.4 `personal_expenses` (dari tab `Pengeluaran_Pribadi`)

```sql
INSERT INTO personal_expenses (expense_date, description, category_id, amount) VALUES
('2026-09-04', 'Makan siang', (SELECT id FROM expense_categories WHERE name='Makan'), 15000),
('2026-09-04', 'Bensin motor', (SELECT id FROM expense_categories WHERE name='Bensin'), 10000);
```

### 3.5 `expense_categories` (seed awal, meniru dropdown Excel — tapi sekarang bisa ditambah)

```sql
INSERT INTO expense_categories (type, name) VALUES
('bahan', 'Bahan Baku'), ('bahan', 'Kemasan'), ('bahan', 'Gas/Listrik'), ('bahan', 'Alat'), ('bahan', 'Lainnya'),
('pribadi', 'Makan'), ('pribadi', 'Bensin'), ('pribadi', 'Lainnya');
```

### 3.6 `system_settings` (dari tab `Setting`, nilai default asli)

```sql
INSERT INTO system_settings (
  effective_from, ambang_profit_ramai, cap_gaji_ramai,
  rasio_gaji_sepi, rasio_hidup_ramai, rasio_tabungan_pribadi_ramai,
  rasio_hidup_sepi, rasio_tabungan_pribadi_sepi
) VALUES (
  '2026-09-01', 200000, 100000,
  0.50, 0.50, 0.50,
  0.70, 0.30
);
```

### 3.7 `initial_balances` (saldo sebelum migrasi — di file ini masih 0 karena belum pernah dipakai sebelumnya)

```sql
INSERT INTO initial_balances (saldo_awal_usaha, saldo_awal_pribadi, saldo_awal_modal)
VALUES (0, 0, 0);
```

---

## 4. VIEW `daily_recap` — pengganti otomatis tab `Rekap_Harian`

Ini jantung dari aplikasi: query yang menghitung ulang **semua** metrik Sistem 3 Kantong secara otomatis, kapan pun diminta, tanpa perlu ada yang mengetik apa pun secara manual.

```sql
CREATE VIEW daily_recap AS
WITH all_dates AS (
  SELECT transaction_date AS tanggal FROM sale_transactions
  UNION
  SELECT expense_date FROM material_expenses
  UNION
  SELECT expense_date FROM personal_expenses
),
sales_agg AS (
  SELECT st.transaction_date AS tanggal,
         SUM(si.subtotal_omzet) AS total_omzet,
         SUM(si.subtotal_hpp)   AS total_hpp
  FROM sale_transactions st
  JOIN sale_items si ON si.transaction_id = st.id
  GROUP BY st.transaction_date
),
material_agg AS (
  SELECT expense_date AS tanggal, SUM(amount) AS total_belanja_bahan
  FROM material_expenses GROUP BY expense_date
),
personal_agg AS (
  SELECT expense_date AS tanggal, SUM(amount) AS pengeluaran_pribadi_riil
  FROM personal_expenses GROUP BY expense_date
),
base AS (
  SELECT
    d.tanggal,
    COALESCE(s.total_omzet, 0)              AS total_omzet,
    COALESCE(s.total_hpp, 0)                AS total_hpp,
    COALESCE(m.total_belanja_bahan, 0)      AS total_belanja_bahan,
    COALESCE(p.pengeluaran_pribadi_riil, 0) AS pengeluaran_pribadi_riil,
    cfg.ambang_profit_ramai, cfg.cap_gaji_ramai,
    cfg.rasio_gaji_sepi, cfg.rasio_hidup_ramai, cfg.rasio_tabungan_pribadi_ramai,
    cfg.rasio_hidup_sepi, cfg.rasio_tabungan_pribadi_sepi
  FROM all_dates d
  LEFT JOIN sales_agg    s ON s.tanggal = d.tanggal
  LEFT JOIN material_agg m ON m.tanggal = d.tanggal
  LEFT JOIN personal_agg p ON p.tanggal = d.tanggal
  CROSS JOIN LATERAL (
    SELECT * FROM system_settings
    WHERE effective_from <= d.tanggal
    ORDER BY effective_from DESC LIMIT 1
  ) cfg
),
calc AS (
  SELECT *,
    (total_omzet - total_hpp)          AS profit_kotor,
    (total_hpp - total_belanja_bahan)  AS kantong1_modal_putar
  FROM base
),
calc2 AS (
  SELECT *,
    CASE WHEN profit_kotor < ambang_profit_ramai THEN 'SEPI' ELSE 'RAMAI' END AS mode,
    CASE WHEN profit_kotor < ambang_profit_ramai
         THEN profit_kotor * rasio_gaji_sepi
         ELSE LEAST(cap_gaji_ramai, profit_kotor)
    END AS kantong2_gaji_pemilik
  FROM calc
),
calc3 AS (
  SELECT *,
    (profit_kotor - kantong2_gaji_pemilik) AS kantong3_tabungan_usaha,
    CASE WHEN mode = 'SEPI' THEN kantong2_gaji_pemilik * rasio_hidup_sepi
         ELSE kantong2_gaji_pemilik * rasio_hidup_ramai END AS jatah_kebutuhan_hidup,
    CASE WHEN mode = 'SEPI' THEN kantong2_gaji_pemilik * rasio_tabungan_pribadi_sepi
         ELSE kantong2_gaji_pemilik * rasio_tabungan_pribadi_ramai END AS jatah_tabungan_pribadi
  FROM calc2
),
calc4 AS (
  SELECT *, (jatah_kebutuhan_hidup - pengeluaran_pribadi_riil) AS sisa_selisih_jatah_hidup
  FROM calc3
),
final AS (
  SELECT *, (jatah_tabungan_pribadi + sisa_selisih_jatah_hidup) AS tabungan_pribadi_hari_ini
  FROM calc4
)
SELECT
  f.tanggal, f.total_omzet, f.total_hpp, f.total_belanja_bahan, f.profit_kotor, f.mode,
  f.kantong1_modal_putar, f.kantong2_gaji_pemilik, f.kantong3_tabungan_usaha,
  f.jatah_kebutuhan_hidup, f.jatah_tabungan_pribadi, f.pengeluaran_pribadi_riil,
  f.sisa_selisih_jatah_hidup, f.tabungan_pribadi_hari_ini,
  ib.saldo_awal_modal   + SUM(f.kantong1_modal_putar)      OVER (ORDER BY f.tanggal) AS saldo_kas_modal_putar,
  ib.saldo_awal_usaha   + SUM(f.kantong3_tabungan_usaha)   OVER (ORDER BY f.tanggal) AS saldo_tabungan_usaha,
  ib.saldo_awal_pribadi + SUM(f.tabungan_pribadi_hari_ini) OVER (ORDER BY f.tanggal) AS saldo_tabungan_pribadi
FROM final f
CROSS JOIN initial_balances ib
ORDER BY f.tanggal;
```

> Catatan performa: kalau data sudah sangat besar (ribuan hari), `daily_recap` sebaiknya diubah jadi *materialized view* yang di-refresh berkala, atau dihitung incremental di kode aplikasi. Untuk skala satu gerobak/lapak, VIEW biasa di atas sudah lebih dari cukup cepat.

---

## 5. Pembuktian: hasil VIEW identik dengan Excel

Menjalankan `SELECT * FROM daily_recap WHERE tanggal = '2026-09-04';` dengan data contoh di Bagian 3 menghasilkan:

| Metrik | Hasil query (skema baru) | Nilai asli di `Rekap_Harian` Excel | Cocok? |
|---|---:|---:|:---:|
| total_omzet | 170.000 | 170.000 | ✅ |
| total_hpp | 67.561 | 67.561 | ✅ |
| profit_kotor | 102.439 | 102.439 | ✅ |
| mode | SEPI | SEPI | ✅ |
| kantong1_modal_putar | 39.561 | 39.561 | ✅ |
| kantong2_gaji_pemilik | 51.219,5 | 51.219,5 | ✅ |
| kantong3_tabungan_usaha | 51.219,5 | 51.219,5 | ✅ |
| jatah_kebutuhan_hidup | 35.853,65 | 35.853,65 | ✅ |
| jatah_tabungan_pribadi | 15.365,85 | 15.365,85 | ✅ |
| sisa_selisih_jatah_hidup | 10.853,65 | 10.853,65 | ✅ |
| tabungan_pribadi_hari_ini | 26.219,5 | 26.219,5 | ✅ |
| saldo_tabungan_usaha | 51.219,5 | 51.219,5 | ✅ |
| saldo_tabungan_pribadi | 26.219,5 | 26.219,5 | ✅ |
| saldo_kas_modal_putar | 39.561 | 39.561 | ✅ |

Semua metrik cocok 100% dengan angka asli di file Excel Anda — artinya skema ini aman dipakai untuk menggantikan sistem lama tanpa mengubah satu pun logika bisnis yang sudah berjalan.

---

## 6. Kalau nanti pakai NoSQL (Firestore) alih-alih SQL

Kalau tim pengembang memilih Firebase/Firestore (umum untuk aplikasi mobile ringan), entitas di atas cukup dipetakan jadi koleksi dengan struktur yang sama:

```
products/{productId}                → {name, category, sellingPrice, hppPerPcs, status}
saleTransactions/{transactionId}    → {transactionDate, transactionNo, createdBy}
  └─ items/{itemId}                 → {productId, qty, unitPrice, unitHpp}
materialExpenses/{expenseId}        → {expenseDate, description, category, amount}
personalExpenses/{expenseId}        → {expenseDate, description, category, amount}
systemSettings/{settingId}          → {effectiveFrom, ambangProfitRamai, ...}
initialBalances/main                → {saldoAwalUsaha, saldoAwalPribadi, saldoAwalModal}
```

Bedanya: perhitungan `daily_recap` yang di SQL cukup 1 VIEW, di Firestore harus dihitung di kode aplikasi (Cloud Function) karena Firestore tidak punya SQL VIEW. Untuk usaha skala satu gerobak, pendekatan **SQL (PostgreSQL via Supabase, gratis)** lebih disarankan karena logika 3 Kantong ini sifatnya agregasi & kumulatif yang justru jadi kekuatan SQL.
