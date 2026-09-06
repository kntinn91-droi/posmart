import { useState, useEffect } from 'react';
import { Product } from '../types/database';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { localDb } from '../lib/db';

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Terang Bulan Coklat 10k', category: 'Terang Bulan', selling_price: 10000, hpp_per_pcs: 5740, status: 'aktif', created_at: '', updated_at: '' },
  { id: 'p2', name: 'Terang Bulan Coklat 15k', category: 'Terang Bulan', selling_price: 15000, hpp_per_pcs: 6565, status: 'aktif', created_at: '', updated_at: '' },
  { id: 'p3', name: 'Terang Bulan Coklat 20k', category: 'Terang Bulan', selling_price: 20000, hpp_per_pcs: 7390, status: 'aktif', created_at: '', updated_at: '' },
  { id: 'p4', name: 'Terang Bulan Kacang 10k', category: 'Terang Bulan', selling_price: 10000, hpp_per_pcs: 5515, status: 'aktif', created_at: '', updated_at: '' },
  { id: 'p5', name: 'Terang Bulan Kacang 15k', category: 'Terang Bulan', selling_price: 15000, hpp_per_pcs: 6227, status: 'aktif', created_at: '', updated_at: '' },
  { id: 'p6', name: 'Terang Bulan Kacang 20k', category: 'Terang Bulan', selling_price: 20000, hpp_per_pcs: 6940, status: 'aktif', created_at: '', updated_at: '' },
  { id: 'p7', name: 'Terang Bulan Strawberry 10k', category: 'Terang Bulan', selling_price: 10000, hpp_per_pcs: 4930, status: 'aktif', created_at: '', updated_at: '' },
  { id: 'p8', name: 'Terang Bulan Strawberry 15k', category: 'Terang Bulan', selling_price: 15000, hpp_per_pcs: 5350, status: 'aktif', created_at: '', updated_at: '' },
  { id: 'p9', name: 'Terang Bulan Coklat-Kacang 15k', category: 'Terang Bulan', selling_price: 15000, hpp_per_pcs: 6396, status: 'aktif', created_at: '', updated_at: '' },
  { id: 'p10', name: 'Terang Bulan Coklat-Kacang 20k', category: 'Terang Bulan', selling_price: 20000, hpp_per_pcs: 7165, status: 'aktif', created_at: '', updated_at: '' },
  { id: 'p11', name: 'Terang Bulan Keju 20k', category: 'Terang Bulan', selling_price: 20000, hpp_per_pcs: 6257, status: 'aktif', created_at: '', updated_at: '' },
  { id: 'p12', name: 'Terang Bulan Keju 25k', category: 'Terang Bulan', selling_price: 25000, hpp_per_pcs: 6690, status: 'aktif', created_at: '', updated_at: '' },
  { id: 'p13', name: 'Terang Bulan Keju Kacang 20k', category: 'Terang Bulan', selling_price: 20000, hpp_per_pcs: 6598, status: 'aktif', created_at: '', updated_at: '' },
  { id: 'p14', name: 'Terang Bulan Keju Kacang 25k', category: 'Terang Bulan', selling_price: 25000, hpp_per_pcs: 7171, status: 'aktif', created_at: '', updated_at: '' },
  { id: 'p15', name: 'Terang Bulan Keju Coklat 20k', category: 'Terang Bulan', selling_price: 20000, hpp_per_pcs: 6823, status: 'aktif', created_at: '', updated_at: '' },
  { id: 'p16', name: 'Terang Bulan Keju Coklat 25k', category: 'Terang Bulan', selling_price: 25000, hpp_per_pcs: 7453, status: 'aktif', created_at: '', updated_at: '' },
  { id: 'p17', name: 'Terang Bulan Keju Kacang Coklat 25k', category: 'Terang Bulan', selling_price: 25000, hpp_per_pcs: 7520, status: 'aktif', created_at: '', updated_at: '' },
  { id: 'p18', name: 'Martabak Telur 1', category: 'Martabak', selling_price: 15000, hpp_per_pcs: 5451, status: 'aktif', created_at: '', updated_at: '' },
  { id: 'p19', name: 'Martabak Telur 2', category: 'Martabak', selling_price: 20000, hpp_per_pcs: 7614, status: 'aktif', created_at: '', updated_at: '' },
  { id: 'p20', name: 'Martabak Telur 3', category: 'Martabak', selling_price: 25000, hpp_per_pcs: 9776, status: 'aktif', created_at: '', updated_at: '' },
  { id: 'p21', name: 'Martabak Telur 4', category: 'Martabak', selling_price: 35000, hpp_per_pcs: 11939, status: 'aktif', created_at: '', updated_at: '' },
  { id: 'p22', name: 'Terang Bulan Kacang Hijau', category: 'Terang Bulan', selling_price: null, hpp_per_pcs: null, status: 'nonaktif', created_at: '', updated_at: '' },
  { id: 'p23', name: 'Terang Bulan Ketan Hitam', category: 'Terang Bulan', selling_price: null, hpp_per_pcs: null, status: 'nonaktif', created_at: '', updated_at: '' },
  { id: 'p24', name: 'Terang Bulan Pisang', category: 'Terang Bulan', selling_price: null, hpp_per_pcs: null, status: 'nonaktif', created_at: '', updated_at: '' },
  { id: 'p25', name: 'Martabak Telur Bebek', category: 'Martabak', selling_price: null, hpp_per_pcs: null, status: 'nonaktif', created_at: '', updated_at: '' },
];

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('products').select('*').order('name');
        if (!error && data && data.length > 0) {
          setProducts(data);
          await localDb.products.bulkPut(data);
          setLoading(false);
          return;
        }
      }

      // Check IndexedDB
      const cached = await localDb.products.toArray();
      if (cached.length > 0) {
        setProducts(cached);
      } else {
        // Fallback to initial seeds
        setProducts(INITIAL_PRODUCTS);
        await localDb.products.bulkPut(INITIAL_PRODUCTS);
      }
    } catch (err) {
      console.warn('Using local initial products', err);
      setProducts(INITIAL_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const saveProduct = async (productData: Partial<Product>) => {
    if (productData.id) {
      // Update
      const updated = { ...productData, updated_at: new Date().toISOString() } as Product;
      setProducts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
      await localDb.products.put(updated);
      if (isSupabaseConfigured) {
        await supabase.from('products').update(productData).eq('id', productData.id);
      }
    } else {
      // Insert
      const newProd: Product = {
        id: 'prod_' + Date.now(),
        name: productData.name || '',
        category: productData.category || 'Terang Bulan',
        selling_price: productData.selling_price ?? null,
        hpp_per_pcs: productData.hpp_per_pcs ?? null,
        status: productData.status || 'aktif',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProducts(prev => [...prev, newProd]);
      await localDb.products.put(newProd);
      if (isSupabaseConfigured) {
        await supabase.from('products').insert([productData]);
      }
    }
  };

  return {
    products,
    activeProducts: products.filter(p => p.status === 'aktif'),
    loading,
    refreshProducts: fetchProducts,
    saveProduct
  };
}
