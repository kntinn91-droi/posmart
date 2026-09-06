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

-- Riwayat perubahan harga (audit trail)
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

-- ============================================================
-- EXPENSE_CATEGORIES
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
  effective_from                DATE NOT NULL,
  ambang_profit_ramai           NUMERIC(12,2) NOT NULL DEFAULT 200000,
  cap_gaji_ramai                NUMERIC(12,2) NOT NULL DEFAULT 100000,
  rasio_gaji_sepi               NUMERIC(5,4)  NOT NULL DEFAULT 0.50,
  rasio_hidup_ramai             NUMERIC(5,4)  NOT NULL DEFAULT 0.50,
  rasio_tabungan_pribadi_ramai  NUMERIC(5,4)  NOT NULL DEFAULT 0.50,
  rasio_hidup_sepi              NUMERIC(5,4)  NOT NULL DEFAULT 0.70,
  rasio_tabungan_pribadi_sepi   NUMERIC(5,4)  NOT NULL DEFAULT 0.30,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INITIAL_BALANCES  (pengganti "Saldo Awal" di tab Setting)
-- ============================================================
CREATE TABLE initial_balances (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saldo_awal_usaha    NUMERIC(14,2) NOT NULL DEFAULT 0,
  saldo_awal_pribadi  NUMERIC(14,2) NOT NULL DEFAULT 0,
  saldo_awal_modal    NUMERIC(14,2) NOT NULL DEFAULT 0,
  migrated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_sale_transactions_date   ON sale_transactions(transaction_date);
CREATE INDEX idx_sale_items_transaction   ON sale_items(transaction_id);
CREATE INDEX idx_sale_items_product       ON sale_items(product_id);
CREATE INDEX idx_material_expenses_date   ON material_expenses(expense_date);
CREATE INDEX idx_personal_expenses_date   ON personal_expenses(expense_date);
CREATE INDEX idx_products_status          ON products(status);
