# PRD — Aplikasi Kasir & Keuangan Usaha Terang Bulan & Martabak

| | |
|---|---|
| **Dokumen** | Product Requirements Document (PRD) |
| **Sumber acuan** | `Sistem_Kasir_Terang_Bulan_Martabak.xlsx` (sistem berjalan saat ini) |
| **Tanggal** | 5 September 2026 |
| **Versi** | 1.0 (draft awal untuk pengembangan aplikasi rill) |
| **Status** | Untuk direview pemilik usaha sebelum masuk ke desain/pengembangan |

---

## 1. Ringkasan eksekutif

Usaha Terang Bulan & Martabak saat ini menjalankan seluruh operasional keuangannya lewat satu file Excel yang cukup canggih: bukan cuma kasir, tapi juga "mesin" pembagian uang otomatis bernama **Sistem 3 Kantong** (Modal Putar, Gaji Pemilik, Tabungan Usaha). Sistem ini sudah terbukti dipakai harian dan berisi logika bisnis yang matang — masalahnya ada di **medium**-nya, bukan di **logikanya**.

Dokumen ini membedah sistem Excel yang ada secara menyeluruh (struktur data, rumus, aturan bisnis, dan kelemahannya), lalu menerjemahkannya menjadi kebutuhan produk untuk **aplikasi kasir digital yang sesungguhnya** — idealnya berbasis mobile/web — yang mempertahankan seluruh logika 3 Kantong yang sudah terbukti jalan, sambil menghilangkan risiko dan keterbatasan yang melekat pada Excel (rawan rusak, tidak multi-device, tidak ada peran pengguna, batas baris, dll).

**Rekomendasi utama:** bangun sebagai **aplikasi web mobile-first (PWA)** yang bisa dipakai dari HP di gerobak/lapak, dengan database cloud supaya data aman, bisa diakses banyak perangkat, dan tidak hilang kalau HP rusak/hilang.

---

## 2. Latar belakang: bedah sistem Excel saat ini

### 2.1 Profil usaha (disimpulkan dari data)

- Jenis usaha: kaki lima / gerobak makanan — Terang Bulan (martabak manis) dan Martabak (telur), dengan total **21 varian produk aktif** (4 lagi berstatus nonaktif karena stok bahan kosong).
- Rentang harga jual: Rp10.000 – Rp35.000 per porsi.
- Skala harian: transaksi dicatat per baris item, dikelompokkan per "No. Transaksi".
- Pemilik tampaknya merangkap kasir dan pengelola keuangan pribadi sekaligus (karena sistem menyatukan kas usaha dan kas pribadi dalam satu alur).

### 2.2 Struktur & alur data pada file Excel

| Tab | Fungsi | Cara isi |
|---|---|---|
| `Petunjuk` | Panduan pemakaian & kode warna | Statis |
| `Dashboard` | Ringkasan bulan berjalan + saldo terkini | 100% rumus |
| `Input_Jualan` | Kasir harian — satu baris per item terjual | Manual: Tanggal, No. Transaksi, Nama Produk (dropdown), Qty. Harga & HPP di-lookup otomatis dari `HPP_Master` |
| `Belanja_Bahan` | Log pembelian bahan baku/kemasan/gas, kapan pun terjadi | Manual: Tanggal, Keterangan, Kategori, Nominal |
| `Pengeluaran_Pribadi` | Log pengeluaran pribadi harian (makan, bensin, dll) | Manual: Tanggal, Keterangan, Kategori, Nominal |
| `Rekap_Harian` | Satu baris = satu hari. Pusat perhitungan Profit Kotor & 3 Kantong | Manual: hanya kolom Tanggal. 16 kolom lain otomatis via `SUMIFS`/`IF` |
| `HPP_Master` | Data acuan Harga Jual & HPP tiap varian produk | Manual, diedit kalau harga bahan berubah |
| `Setting` | Parameter sistem (ambang mode, cap gaji, rasio pembagian, saldo awal) | Manual, sekali di awal |

**Alur data:** `Input_Jualan` + `Belanja_Bahan` + `Pengeluaran_Pribadi` (transaksi mentah harian) → di-agregasi oleh `Rekap_Harian` per tanggal → diringkas lagi oleh `Dashboard` untuk bulan berjalan dan saldo terkini.

### 2.3 Logika inti: Sistem 3 Kantong (harus dipertahankan 1:1 di aplikasi baru)

Ini adalah *business rule* paling bernilai di seluruh sistem — sudah divalidasi dari rumus asli, bukan tebakan:

**Langkah 1 — Profit Kotor**
```
Profit Kotor = Total Omzet − Total HPP (harga pokok standar, dari HPP_Master)
```

**Langkah 2 — Tentukan Mode**
```
Mode = "RAMAI" jika Profit Kotor ≥ Rp200.000 (bisa diubah di Setting)
Mode = "SEPI"  jika Profit Kotor < Rp200.000
```

**Langkah 3 — Kantong 1: Modal Putar** *(berjalan independen, bukan bagian dari pembagian Profit Kotor)*
```
Kantong 1 (hari ini) = Total HPP − Total Belanja Bahan riil hari itu
Saldo Kas Modal Putar = Saldo awal + akumulasi Kantong 1 dari hari pertama
```
Ini mewakili "utang" perputaran modal bahan baku — kalau positif berarti masih ada modal HPP yang belum dibelanjakan ulang; kalau negatif berarti belanja bahan sudah melebihi HPP hari itu (misalnya belanja stok untuk beberapa hari sekaligus).

**Langkah 4 — Kantong 2: Gaji Pemilik**
```
Jika SEPI:  Gaji Pemilik = 50% × Profit Kotor
Jika RAMAI: Gaji Pemilik = MIN(Rp100.000, Profit Kotor)   → praktis selalu Rp100.000 flat
```

**Langkah 5 — Kantong 3: Tabungan Usaha**
```
Tabungan Usaha (hari ini) = Profit Kotor − Gaji Pemilik
```

**Langkah 6 — Gaji Pemilik dipecah lagi jadi 2 jatah**
```
Jika SEPI:  Jatah Hidup 70% : Jatah Tabungan Pribadi 30%
Jika RAMAI: Jatah Hidup 50% : Jatah Tabungan Pribadi 50%
```

**Langkah 7 — Bandingkan Jatah Hidup dengan realita**
```
Sisa/Selisih Jatah Hidup = Jatah Kebutuhan Hidup − Pengeluaran Pribadi Riil hari itu
Tabungan Pribadi Hari Ini = Jatah Tabungan Pribadi + Sisa/Selisih Jatah Hidup
```
Poin penting: kalau pengeluaran pribadi **melebihi** jatah, kekurangannya **otomatis memotong** Tabungan Pribadi hari itu juga — supaya efek boros langsung kelihatan, bukan hilang begitu saja tanpa jejak.

**Saldo berjalan (akumulasi sejak hari pertama):**
```
Saldo Tabungan Usaha   = Saldo awal + Σ Kantong 3 semua hari
Saldo Tabungan Pribadi = Saldo awal + Σ Tabungan Pribadi Hari Ini semua hari
Saldo Kas Modal Putar  = Saldo awal + Σ Kantong 1 semua hari
```

Semua ambang batas dan rasio ini **dapat dikonfigurasi** oleh pemilik (tab `Setting`), bukan angka mati di kode.

### 2.4 Kelemahan sistem Excel saat ini (alasan pindah ke aplikasi rill)

| # | Masalah | Dampak nyata |
|---|---|---|
| 1 | Satu perangkat, tidak real-time multi-user | Kalau ada karyawan kasir, tidak bisa input bersamaan dengan pemilik memantau |
| 2 | Batas baris tetap (400 baris `Rekap_Harian`, 200 `Input_Jualan`, 150 `Belanja_Bahan`/`Pengeluaran_Pribadi`) | Setelah ±1 tahun berjalan, rumus berhenti menjumlah data baru tanpa disadari — risiko silent error |
| 3 | Dropdown produk di `Input_Jualan` mengacu ke **semua** baris `HPP_Master` (termasuk yang berstatus Nonaktif) | Kasir bisa pilih produk yang stoknya kosong → harga kosong → Total Omzet baris itu ikut kosong tanpa peringatan |
| 4 | `Rekap_Harian` wajib diisi manual satu baris per hari, dan rumus akumulasi (saldo) berjalan berdasarkan **urutan baris**, bukan urutan tanggal | Kalau lupa isi satu hari, atau isi tidak berurutan, saldo tabungan/kas ikut salah tanpa pesan error |
| 5 | Tidak ada peran/hak akses — siapa pun yang buka file bisa mengubah rumus (kode warna cuma imbauan visual, bukan proteksi) | Rumus tak sengaja tertimpa = seluruh perhitungan hilir ikut rusak |
| 6 | Tidak ada struk transaksi, tidak ada metode pembayaran (tunai/QRIS), tidak ada diskon/pembulatan | Tidak layak dipakai sebagai kasir sungguhan di depan pembeli |
| 7 | Tidak ada pelacakan stok bahan baku riil (hanya nominal belanja, bukan kuantitas) | Tidak tahu kapan stok telur/tepung akan habis sebelum kejadian |
| 8 | Tidak ada backup otomatis / riwayat perubahan | Kalau file korup atau kehapus, seluruh riwayat keuangan bisa hilang |
| 9 | Laporan terbatas ke bulan berjalan saja di `Dashboard`, tanpa grafik tren, tanpa perbandingan antar bulan | Sulit melihat pola pertumbuhan usaha jangka panjang |
| 10 | Semua bergantung pada disiplin ketik manual tiap transaksi | Human error tinggi terutama saat ramai pembeli |

**Kesimpulan:** logika bisnisnya sudah bagus dan sudah "hidup" — yang perlu diganti adalah lapisan pencatatan & keandalannya, dan itulah fokus PRD ini.

---

## 3. Tujuan produk

| Tujuan | Ukuran keberhasilan |
|---|---|
| Ganti pencatatan manual di Excel dengan kasir digital yang cepat dipakai saat jualan | Input satu transaksi ≤ 15 detik dari HP |
| Pertahankan 100% akurasi logika Sistem 3 Kantong | Hasil perhitungan aplikasi cocok dengan hasil rumus Excel untuk skenario yang sama |
| Hilangkan risiko human-error harian (lupa rekap, salah pilih produk kosong) | Rekap harian otomatis real-time, tanpa perlu tombol "tutup hari" manual yang bisa lupa |
| Data aman & tidak hilang | Backup otomatis ke cloud, bisa diakses dari perangkat baru bila HP hilang/rusak |
| Bisa dipakai lebih dari satu orang (pemilik + karyawan kasir) | Ada peran & hak akses berbeda |

---

## 4. Target pengguna

| Peran | Kebutuhan utama |
|---|---|
| **Pemilik usaha (Owner/Admin)** | Input transaksi, atur harga & parameter Setting, lihat Dashboard & saldo 3 Kantong, kelola pengguna lain |
| **Kasir (opsional, jika ada karyawan)** | Hanya input penjualan & belanja bahan; tidak bisa lihat/ubah keuangan pribadi pemilik atau parameter Setting |

*(Asumsi: saat ini kemungkinan besar pemilik menjalankan sendiri. Peran Kasir disiapkan sebagai fase pengembangan lanjutan, bukan wajib di MVP — lihat Bagian 9.)*

---

## 5. Ruang lingkup

### 5.1 Masuk lingkup (MVP)
- Kasir digital untuk input penjualan (multi-item per transaksi)
- Master produk & HPP dengan status Aktif/Nonaktif
- Pencatatan belanja bahan
- Pencatatan pengeluaran pribadi
- Mesin Sistem 3 Kantong berjalan otomatis **real-time**, tanpa perlu tombol tutup hari manual
- Dashboard: ringkasan bulan berjalan + saldo terkini 3 Kantong
- Pengaturan parameter sistem (ambang, rasio, cap, saldo awal)
- Riwayat harian yang bisa ditelusuri per tanggal
- Ekspor data (misalnya ke Excel/PDF) untuk cadangan atau dibawa ke akuntan

### 5.2 Tidak masuk lingkup MVP (fase lanjutan)
- Pelacakan stok bahan baku berbasis kuantitas (bukan cuma nominal)
- Cetak struk fisik / integrasi printer thermal
- Pembayaran digital (QRIS) terintegrasi
- Multi-outlet/multi-gerobak
- Manajemen piutang/utang
- Analitik & prediksi lanjutan (tren, prediksi omzet)

### 5.3 Di luar lingkup selamanya (sesuai catatan asli sistem)
- Pembukuan akuntansi penuh (aset, penyusutan) — sistem ini tetap berbasis **arus kas harian**, sesuai desain aslinya.

---

## 6. Kebutuhan fungsional

### FR-1 Master Produk & HPP
- CRUD produk: Nama, Kategori, Harga Jual, HPP/pcs, Status (Aktif/Nonaktif).
- Margin (Rp & %) dihitung otomatis, read-only.
- **Perbaikan dari Excel:** daftar produk yang muncul saat kasir memilih produk **hanya menampilkan status Aktif** — menutup celah bug #3 di Bagian 2.4.
- Riwayat perubahan harga (opsional, berguna untuk audit margin dari waktu ke waktu).

### FR-2 Kasir / Input Penjualan
- Buat transaksi baru → tambah item (pilih produk aktif, isi qty) → harga & HPP terisi otomatis dari master.
- Total omzet & total HPP transaksi terhitung otomatis.
- Tanggal transaksi default hari ini, bisa diubah untuk input transaksi lampau.
- Ringkasan transaksi tersimpan sebagai "struk digital" yang bisa dilihat ulang.

### FR-3 Pencatatan Belanja Bahan
- Catat kapan saja: Tanggal, Keterangan, Kategori (Bahan Baku/Kemasan/Gas-Listrik/Alat/Lainnya), Nominal.
- Bisa multi-catat per hari.

### FR-4 Pencatatan Pengeluaran Pribadi
- Catat kapan saja: Tanggal, Keterangan, Kategori (Makan/Bensin/Lainnya — bisa ditambah pemilik), Nominal.

### FR-5 Mesin Rekap Harian (real-time, bukan manual)
- **Perbedaan penting dari Excel:** tidak perlu tombol/isi "tutup hari" manual. Begitu ada transaksi penjualan/belanja/pengeluaran di suatu tanggal, seluruh 16 metrik Rekap Harian (Profit Kotor, Mode, 3 Kantong, Jatah, Saldo akumulasi, dst.) dihitung **on-the-fly** setiap kali dibuka — menghilangkan risiko lupa isi tanggal yang menyebabkan seluruh saldo berjalan salah.
- Saldo akumulasi (Kantong 1/2/3) dihitung berdasarkan **urutan tanggal kalender**, bukan urutan input — memperbaiki bug #4 di Bagian 2.4.
- Tetap bisa dilihat sebagai tabel riwayat per hari, bisa difilter per rentang tanggal.

### FR-6 Dashboard & Laporan
- Ringkasan bulan berjalan: Total Omzet, Profit Kotor, Tabungan Usaha, Tabungan Pribadi, Pengeluaran Pribadi.
- Saldo terkini: Tabungan Usaha, Tabungan Pribadi, Kas Modal Putar, Mode hari terakhir.
- **Tambahan dari sistem lama:** grafik tren omzet & profit mingguan/bulanan, perbandingan bulan ini vs bulan lalu, dan produk terlaris.

### FR-7 Pengaturan (Setting)
- Ambang Profit Kotor mode Ramai (default Rp200.000)
- Cap Gaji Pemilik saat Ramai (default Rp100.000)
- Rasio Gaji dari Profit Kotor saat Sepi (default 50%)
- Rasio Kebutuhan Hidup vs Tabungan Pribadi, masing-masing untuk mode Sepi (70:30) dan Ramai (50:50)
- Saldo awal 3 Kantong (diisi sekali saat migrasi dari Excel)
- Semua parameter ini harus bisa diubah pemilik kapan saja, dan histori perubahannya sebaiknya dicatat (audit trail) supaya laporan lama tidak berubah retroaktif kalau parameter diubah di kemudian hari.

### FR-8 Manajemen Pengguna & Akses *(Fase 2)*
- Owner bisa mengundang akun Kasir dengan akses terbatas (hanya FR-2 dan FR-3).
- Data keuangan pribadi (FR-4, FR-6, FR-7) hanya bisa dilihat Owner.

### FR-9 Backup, Ekspor & Sinkronisasi
- Data tersimpan di cloud (bukan hanya lokal di HP).
- Ekspor laporan bulanan ke Excel/PDF kapan saja.
- Import data historis dari file Excel lama saat migrasi pertama kali (lihat Bagian 10).

### FR-10 Notifikasi *(Fase 2, nice-to-have)*
- Pengingat kalau ada hari yang belum tercatat transaksinya sama sekali.
- Notifikasi saat Profit Kotor harian mencapai/mendekati ambang mode Ramai.

---

## 7. Model data (entitas inti)

| Entitas | Field utama |
|---|---|
| **Product** | id, nama, kategori, harga_jual, hpp_per_pcs, status (aktif/nonaktif) |
| **SaleTransaction** | id, tanggal, no_transaksi, dibuat_oleh (user) |
| **SaleItem** | id, transaction_id, product_id, qty, harga_jual_saat_transaksi, hpp_saat_transaksi |
| **MaterialExpense** (Belanja Bahan) | id, tanggal, keterangan, kategori, nominal |
| **PersonalExpense** (Pengeluaran Pribadi) | id, tanggal, keterangan, kategori, nominal |
| **SystemSettings** | ambang_ramai, cap_gaji_ramai, rasio_gaji_sepi, rasio_hidup_ramai, rasio_hidup_sepi, saldo_awal_usaha, saldo_awal_pribadi, saldo_awal_modal, berlaku_sejak_tanggal |
| **User** | id, nama, peran (owner/kasir), kredensial login |

> Catatan desain: `DailyRecap` **tidak perlu disimpan sebagai tabel tersendiri** — sebaiknya dihitung (computed/view) dari tabel-tabel di atas setiap saat dibutuhkan, supaya tidak ada risiko data "basi" seperti yang terjadi di Excel saat pemilik lupa mengisi baris rekap.

---

## 8. Kebutuhan non-fungsional

| Aspek | Kebutuhan |
|---|---|
| **Platform** | Mobile-first — bisa dipakai satu tangan dari HP saat melayani pembeli di gerobak |
| **Konektivitas** | Idealnya tetap bisa mencatat transaksi walau sinyal lemah/terputus (mode offline dasar), lalu sinkron otomatis saat online kembali — konteks kaki lima seringkali sinyal tidak stabil |
| **Performa** | Input satu transaksi selesai dalam hitungan detik, tanpa loading lama |
| **Bahasa** | Bahasa Indonesia, istilah sama persis dengan yang sudah dikenal pemilik (Kantong 1/2/3, Sepi/Ramai, dst.) supaya tidak perlu belajar ulang |
| **Keamanan data** | Data keuangan pribadi & usaha terenkripsi, backup otomatis berkala |
| **Kemudahan pakai** | Ditujukan untuk pengguna non-teknis; hindari istilah teknis, ikuti pola interaksi yang sudah familiar dari kebiasaan mengisi Excel (misalnya urutan kolom yang sama) |

---

## 9. Alur pengguna utama

1. **Buka toko (pagi):** login → cek Dashboard sekilas (saldo & mode hari sebelumnya).
2. **Ada penjualan:** buka menu Kasir → pilih produk (hanya yang Aktif) → isi qty → ulangi untuk item lain dalam transaksi yang sama → simpan.
3. **Belanja bahan (kapan saja):** buka menu Belanja Bahan → isi keterangan & nominal → simpan.
4. **Ada pengeluaran pribadi (kapan saja):** buka menu Pengeluaran Pribadi → isi → simpan.
5. **Cek kondisi kapan saja:** buka Dashboard → langsung lihat Profit Kotor hari ini, Mode (Sepi/Ramai), dan pembagian 3 Kantong terkini — **tanpa perlu menunggu "tutup hari"**.
6. **Akhir bulan:** ekspor laporan bulanan bila diperlukan untuk catatan pribadi atau kebutuhan lain.

---

## 10. Rencana migrasi dari Excel

1. Import seluruh data historis dari `HPP_Master`, `Input_Jualan`, `Belanja_Bahan`, `Pengeluaran_Pribadi` ke database aplikasi baru.
2. Ambil saldo terakhir dari `Dashboard` sheet (Saldo Tabungan Usaha, Saldo Tabungan Pribadi, Saldo Kas Modal Putar per tanggal terakhir) sebagai **saldo awal** aplikasi baru — supaya kontinuitas angka tidak terputus.
3. Salin parameter dari tab `Setting` ke `SystemSettings`.
4. Jalankan kedua sistem berdampingan (paralel) selama 3–7 hari untuk memverifikasi hasil aplikasi baru identik dengan hasil Excel, sebelum sepenuhnya berpindah.
5. Setelah yakin cocok, Excel disimpan sebagai arsip/cadangan, bukan dihapus.

---

## 11. Roadmap pengembangan

| Fase | Cakupan |
|---|---|
| **MVP (Fase 1)** | FR-1 s/d FR-7, FR-9 (tanpa multi-user) — cukup untuk menggantikan Excel sepenuhnya untuk satu pengguna (pemilik) |
| **Fase 2** | FR-8 (multi-user/kasir), FR-10 (notifikasi), grafik tren lanjutan |
| **Fase 3** | Pelacakan stok bahan berbasis kuantitas, integrasi QRIS, cetak struk, multi-outlet |

---

## 12. Risiko & mitigasi

| Risiko | Mitigasi |
|---|---|
| Salah pindah logika 3 Kantong dari Excel ke kode aplikasi | Buat *unit test* yang membandingkan hasil aplikasi dengan hasil rumus Excel untuk beberapa skenario nyata (termasuk kasus M negatif/boros) sebelum rilis |
| Pemilik/karyawan kesulitan beradaptasi dari Excel ke aplikasi baru | Pertahankan istilah & urutan alur kerja yang identik dengan kebiasaan lama; sediakan panduan singkat setara tab `Petunjuk` yang sudah ada |
| Kehilangan koneksi internet saat di lokasi jualan | Sediakan mode offline dasar untuk pencatatan transaksi, sinkron otomatis saat online |
| Data hilang saat migrasi | Jalankan periode paralel (lihat Bagian 10) sebelum Excel benar-benar ditinggalkan |

---

## 13. Asumsi & pertanyaan terbuka

Asumsi yang dipakai dalam dokumen ini (mohon dikonfirmasi/dikoreksi pemilik):
- Saat ini hanya pemilik yang menjalankan sistem sendirian → fitur multi-user/kasir dijadikan Fase 2, bukan wajib di MVP.
- Aplikasi ditujukan untuk satu gerobak/lapak (belum multi-outlet).
- Prioritas platform adalah HP (Android/web), bukan komputer/kasir fisik.

Pertanyaan yang perlu dijawab pemilik sebelum masuk ke tahap desain teknis:
1. Apakah akan ada karyawan lain yang input transaksi, atau tetap dikerjakan sendiri untuk saat ini?
2. Apakah dibutuhkan cetak struk untuk pembeli, atau cukup pencatatan internal saja?
3. Apakah metode pembayaran perlu dibedakan (tunai vs QRIS/transfer) dalam pencatatan?
4. Preferensi platform: aplikasi web yang dibuka lewat browser HP, atau aplikasi Android yang di-install dari Play Store?

---

## Lampiran — Pemetaan rumus Excel ke aturan bisnis aplikasi

| Kolom di `Rekap_Harian` | Rumus Excel asli | Aturan bisnis yang harus direplikasi |
|---|---|---|
| Total Omzet | `SUMIFS(Input_Jualan!Total Omzet, Tanggal)` | Jumlah semua `SaleItem.qty × harga_jual` pada tanggal terkait |
| Total HPP | `SUMIFS(Input_Jualan!Total HPP, Tanggal)` | Jumlah semua `SaleItem.qty × hpp_per_pcs` pada tanggal terkait |
| Profit Kotor | `Total Omzet − Total HPP` | Sama persis |
| Mode | `IF(Profit Kotor < Rp200rb, "SEPI", "RAMAI")` | Sama persis, ambang dari `SystemSettings` |
| Kantong 1 | `Total HPP − Total Belanja Bahan riil` | Sama persis |
| Kantong 2 (Gaji) | `IF(SEPI, Profit×50%, MIN(Rp100rb, Profit))` | Sama persis, rasio & cap dari `SystemSettings` |
| Kantong 3 (Tab. Usaha) | `Profit Kotor − Gaji` | Sama persis |
| Jatah Hidup | `IF(SEPI, Gaji×70%, Gaji×50%)` | Sama persis, rasio dari `SystemSettings` |
| Jatah Tab. Pribadi | `IF(SEPI, Gaji×30%, Gaji×50%)` | Sama persis |
| Sisa/Selisih Jatah Hidup | `Jatah Hidup − Pengeluaran Pribadi Riil` | Sama persis (bisa negatif) |
| Tab. Pribadi Hari Ini | `Jatah Tab. Pribadi + Sisa/Selisih` | Sama persis — efek boros otomatis memotong tabungan hari itu |
| Saldo Tab. Usaha/Pribadi/Modal | `Saldo awal + SUM kumulatif sejak hari pertama` | Sama persis, tapi diurutkan berdasarkan **tanggal**, bukan baris input |
