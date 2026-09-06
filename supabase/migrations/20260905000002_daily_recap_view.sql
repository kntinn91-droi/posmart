-- ============================================================
-- VIEW daily_recap: Mesin Sistem 3 Kantong Otomatis
-- ============================================================
CREATE OR REPLACE VIEW daily_recap AS
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
CROSS JOIN (
  SELECT * FROM initial_balances ORDER BY migrated_at DESC LIMIT 1
) ib
ORDER BY f.tanggal;
