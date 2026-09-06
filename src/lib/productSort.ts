import { Product } from '../types/database';

export type ProductSortOption = 'variant_asc' | 'price_asc' | 'price_desc' | 'name_asc';

/**
 * Ekstraksi nama kelompok/varian dasar dari nama produk.
 * Contoh:
 * - "Terang Bulan Coklat 10k" -> "Coklat"
 * - "Terang Bulan Coklat 15k" -> "Coklat"
 * - "Terang Bulan Coklat-Kacang 15k" -> "Coklat-Kacang"
 * - "Terang Bulan Keju Coklat 25k" -> "Keju Coklat"
 * - "Martabak Telur 1" -> "Telur"
 * - "Martabak Telur 2" -> "Telur"
 */
export function extractProductGroup(name: string, _category?: string): string {
  let cleaned = name.trim();
  // Hapus awalan kategori seperti Terang Bulan / Terbul / Martabak Manis / Martabak
  cleaned = cleaned.replace(/^(?:terang\s*bulan|terbul|martabak\s*manis|martabak)\s+/i, '');
  // Hapus akhiran harga atau nomor porsi seperti ' 10k', ' 15k', ' 1', ' 2', ' 20', dsb.
  cleaned = cleaned.replace(/\s+\(?\d+([.,]\d+)?\s*[kK]?\)?$/i, '');
  return cleaned.trim() || name;
}

/**
 * Mengurutkan produk:
 * - 'variant_asc': Varian rasa yang sama dikelompokkan bersama, diurutkan dari harga termurah ke termahal.
 *   Kelompok rasa yang paling murah (misal 10k) muncul lebih awal dibanding kelompok rasa mahal (20k).
 * - 'price_asc': Semua produk diurutkan murni dari harga termurah ke termahal.
 * - 'price_desc': Semua produk diurutkan murni dari harga termahal ke termurah.
 * - 'name_asc': Alfabetis A-Z.
 */
export function sortProducts(products: Product[], sortOption: ProductSortOption = 'variant_asc'): Product[] {
  if (!products || products.length === 0) return [];

  if (sortOption === 'price_asc') {
    return [...products].sort((a, b) => {
      const priceA = a.selling_price ?? Infinity;
      const priceB = b.selling_price ?? Infinity;
      if (priceA !== priceB) return priceA - priceB;
      return a.name.localeCompare(b.name, 'id');
    });
  }

  if (sortOption === 'price_desc') {
    return [...products].sort((a, b) => {
      const priceA = a.selling_price ?? -Infinity;
      const priceB = b.selling_price ?? -Infinity;
      if (priceA !== priceB) return priceB - priceA;
      return a.name.localeCompare(b.name, 'id');
    });
  }

  if (sortOption === 'name_asc') {
    return [...products].sort((a, b) => a.name.localeCompare(b.name, 'id'));
  }

  // Default: 'variant_asc' (kelompok varian bersama & urut dari murah ke mahal)
  const groupMinPrice = new Map<string, number>();
  for (const p of products) {
    const grp = extractProductGroup(p.name, p.category);
    const key = `${p.category}___${grp}`;
    const price = p.selling_price ?? Infinity;
    if (!groupMinPrice.has(key) || price < groupMinPrice.get(key)!) {
      groupMinPrice.set(key, price);
    }
  }

  return [...products].sort((a, b) => {
    // 1. Kategori: Terang Bulan dahulu, lalu Martabak, baru lainnya
    if (a.category !== b.category) {
      if (a.category === 'Terang Bulan') return -1;
      if (b.category === 'Terang Bulan') return 1;
      if (a.category === 'Martabak') return -1;
      if (b.category === 'Martabak') return 1;
      return a.category.localeCompare(b.category, 'id');
    }

    const grpA = extractProductGroup(a.name, a.category);
    const grpB = extractProductGroup(b.name, b.category);
    const keyA = `${a.category}___${grpA}`;
    const keyB = `${b.category}___${grpB}`;

    // 2. Jika beda kelompok varian: urutkan dari harga varian termurah di kelompok itu
    if (grpA !== grpB) {
      const minA = groupMinPrice.get(keyA) ?? Infinity;
      const minB = groupMinPrice.get(keyB) ?? Infinity;
      if (minA !== minB) return minA - minB;
      return grpA.localeCompare(grpB, 'id');
    }

    // 3. Di dalam kelompok varian yang sama: urutkan harga jual dari murah ke mahal
    const priceA = a.selling_price ?? Infinity;
    const priceB = b.selling_price ?? Infinity;
    if (priceA !== priceB) return priceA - priceB;

    return a.name.localeCompare(b.name, 'id');
  });
}
