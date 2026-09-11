/**
 * Utility pemformat angka ke mata uang Rupiah (IDR)
 */
export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format angka biasa dengan pemisah ribuan
 */
export function formatNumber(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '0';
  return new Intl.NumberFormat('id-ID').format(amount);
}

/**
 * Format persentase (e.g. 0.456 -> 45.6%)
 */
export function formatPercent(rate: number | null | undefined): string {
  if (rate === null || rate === undefined || isNaN(rate)) return '0%';
  return `${(rate * 100).toFixed(1)}%`;
}

/**
 * Format tanggal format Indonesia (e.g. 4 September 2026)
 */
export function formatDateIndo(dateStr: string | Date): string {
  if (!dateStr) return '-';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d);
}

/**
 * Dapatkan string tanggal YYYY-MM-DD lokal
 */
export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format string YYYY-MM ke nama bulan dan tahun Indonesia (e.g. '2026-09' -> 'September 2026')
 */
export function formatMonthYearIndo(monthStr: string): string {
  if (!monthStr) return '-';
  const parts = monthStr.split('-');
  if (parts.length < 2) return monthStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const d = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(d);
}

/**
 * Dapatkan nama hari format Indonesia (e.g. 'Sabtu')
 */
export function getDayNameIndo(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(d);
}
