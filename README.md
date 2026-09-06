# POS Martabak & Terang Bulan (PWA + Supabase)

Aplikasi Kasir Mobile-First (PWA) & Sistem Otomasi Keuangan **3 Kantong** (Modal Putar, Gaji Pemilik, Tabungan Usaha) yang menggantikan file Excel operasional tanpa mengubah logika bisnis yang sudah terbukti.

---

## 🚀 Arsitektur & Rekomendasi Teknologi

1. **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
   - **Mobile-First**: Didesain ergonomis untuk penggunaan satu tangan di HP gerobak / lapak.
   - **PWA (Progressive Web App)**: Bisa di-install di Home Screen Android/iOS (`display: standalone`), berjalan offline tanpa perlu upload ke Google Play Store.
2. **Database & Backend**: PostgreSQL via **Supabase**
   - Menggunakan SQL View `daily_recap` yang menghitung otomatis 16 metrik Sistem 3 Kantong secara real-time berdasarkan kalender tanpa perlu tombol "tutup buku".
   - Versioned System Settings (`effective_from`) agar perubahan rasio di masa depan tidak merusak laporan bulan lalu.
   - Snapshot `unit_price` dan `unit_hpp` pada setiap item transaksi.
3. **Offline-First Resilience**:
   - IndexedDB lokal via **Dexie.js** agar kasir tetap bisa menginput nota dan belanja walau sinyal seluler di jalan/lapak drop, lalu disinkronkan saat online kembali.

---

## 📂 Struktur Direktori Proyek

```
pos-martabak/
├── PRD_Aplikasi_Kasir_Terang_Bulan_Martabak.md   # Dokumen PRD acuan
├── database.md                                  # Spesifikasi DDL & pembuktian SQL
├── README.md                                    # Dokumentasi proyek
├── package.json                                 # Dependensi frontend & PWA
├── vite.config.ts                               # Konfigurasi Vite & Workbox PWA
├── tailwind.config.js                           # Konfigurasi Tailwind & palet 3 Kantong
├── tsconfig.json                                # Konfigurasi TypeScript
├── .env.example                                 # Contoh konfigurasi Supabase
│
├── supabase/
│   └── migrations/
│       ├── 20260905000001_initial_schema.sql    # DDL: users, products, sales, expenses, settings
│       ├── 20260905000002_daily_recap_view.sql  # SQL VIEW daily_recap (Mesin 3 Kantong)
│       └── 20260905000003_seed_data.sql         # Seed: 25 varian produk, kategori, & setting default
│
├── public/
│   └── icons/                                  # Ikon PWA
│
└── src/
    ├── components/
    │   ├── common/                              # Button, Input, Card, Modal, Badge, Spinner
    │   ├── layout/                              # Header, BottomNav, MobileLayout, OfflineIndicator
    │   ├── pos/                                 # ProductCard, CategoryFilter, CartDrawer, ReceiptModal
    │   ├── dashboard/                           # ModeBanner (Sepi/Ramai), KantongCard, SummaryCards
    │   ├── expenses/                            # MaterialExpenseForm, PersonalExpenseForm
    │   ├── recap/                               # DailyRecapTable (Mobile accordion view)
    │   └── products/                            # ProductFormModal
    │
    ├── context/
    │   └── CartContext.tsx                      # State keranjang kasir (dengan localStorage)
    │
    ├── hooks/
    │   ├── useProducts.ts                       # Fetch & cache produk (21 aktif, 4 nonaktif)
    │   ├── useExpenses.ts                       # Pencatatan belanja bahan & pribadi
    │   ├── useDailyRecap.ts                     # Mesin hitung rekap harian real-time
    │   └── useNetworkStatus.ts                  # Deteksi koneksi online/offline
    │
    ├── lib/
    │   ├── calculations.ts                      # Logika murni Sistem 3 Kantong
    │   ├── formatters.ts                        # Format Rupiah, tanggal Indo, persentase
    │   ├── db.ts                                # Dexie IndexedDB untuk offline sync
    │   └── supabase.ts                          # Supabase JS client
    │
    ├── pages/
    │   ├── PosPage.tsx                          # Halaman Kasir (Input transaksi cepat)
    │   ├── DashboardPage.tsx                    # Halaman 3 Kantong & Mode Sepi/Ramai
    │   ├── ExpensesPage.tsx                     # Halaman Belanja Bahan & Pengeluaran Pribadi
    │   ├── RecapPage.tsx                        # Halaman Rekap Harian & Ekspor CSV
    │   ├── ProductsPage.tsx                     # Halaman Master Menu & HPP
    │   └── SettingsPage.tsx                     # Halaman Pengaturan Parameter & Saldo Awal
    │
    ├── types/
    │   ├── database.ts                          # Tipe data tabel & view Supabase
    │   ├── pos.ts                               # Tipe cart, checkout, struk
    │   └── kantong.ts                           # Tipe kalkulasi 3 kantong
    │
    ├── App.tsx                                  # Root view & navigasi bottom tab
    ├── main.tsx                                 # Entrypoint React
    └── index.css                                # Tailwind & mobile gestures
```

---

## 🧮 Logika Sistem 3 Kantong (1:1 dengan Excel)

1. **Profit Kotor**: `Total Omzet − Total HPP`
2. **Mode Hari**:
   - `RAMAI`: Jika Profit Kotor $\ge$ Rp200.000
   - `SEPI`: Jika Profit Kotor $<$ Rp200.000
3. **Kantong 1 (Modal Putar)**: `Total HPP − Total Belanja Bahan Riil`
4. **Kantong 2 (Gaji Pemilik)**:
   - SEPI: `50% × Profit Kotor`
   - RAMAI: `MIN(Rp100.000, Profit Kotor)`
5. **Kantong 3 (Tabungan Usaha)**: `Profit Kotor − Gaji Pemilik`
6. **Alokasi Gaji Pemilik**:
   - SEPI: Jatah Hidup 70% : Jatah Tabungan 30%
   - RAMAI: Jatah Hidup 50% : Jatah Tabungan 50%
7. **Pengeluaran Pribadi**:
   - `Sisa Jatah Hidup = Jatah Hidup − Pengeluaran Pribadi Riil`
   - `Tabungan Pribadi Hari Ini = Jatah Tabungan + Sisa Jatah Hidup` (jika boros, otomatis memotong Tabungan Pribadi).

---

## ⚡ Cara Menjalankan Aplikasi

1. **Jalankan Aplikasi Lokal**:
   ```bash
   npm run dev
   ```
   Buka URL yang muncul (misal `http://localhost:5173`) di browser atau HP Anda.

2. **Setup Supabase (Opsional untuk Cloud Sync)**:
   - Salin `.env.example` ke `.env`:
     ```bash
     cp .env.example .env
     ```
   - Masukkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
   - Jalankan 3 file SQL di folder `supabase/migrations/` di SQL Editor Supabase.
