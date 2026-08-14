export type Product = {
  id: string;
  name: string;
  price: number;
  unit: string;
  color: string;
  barcode?: string;
};

export type CartLine = {
  lineId: string;
  productId: string;
  name: string;
  price: number;
  unit: string;
  qty: number;
  weight?: number;
};

export type DueCollection = {
  id: string;
  amount: number;
  createdAt: string;
  note?: string;
};

export type Sale = {
  id: string;
  invoiceNo: string;
  items: CartLine[];
  total: number;
  paid: number;
  change: number;
  due: number;
  customerName?: string;
  customerPhone?: string;
  collections: DueCollection[];
  createdAt: string;
};

export type PosSettings = {
  shopName: string;
};

export type PosData = {
  products: Product[];
  sales: Sale[];
  settings: PosSettings;
  invoiceCounter: number;
};
