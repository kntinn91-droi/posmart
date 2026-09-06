import { Product } from './database';

export interface CartItem {
  product: Product;
  qty: number;
}

export interface CheckoutPayload {
  transaction_date: string;
  transaction_no: string;
  items: {
    product_id: string;
    qty: number;
    unit_price: number;
    unit_hpp: number;
  }[];
}

export interface ReceiptData {
  transaction_id: string;
  transaction_no: string;
  transaction_date: string;
  items: {
    name: string;
    qty: number;
    unit_price: number;
    subtotal: number;
  }[];
  total_omzet: number;
  created_at: string;
}
