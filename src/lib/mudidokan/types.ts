export type Product = {
  id: string;
  name: string;
  price: number;
  unit: string;
};

export type CartLine = {
  productId: string;
  name: string;
  price: number;
  unit: string;
  qty: number;
};

export type Sale = {
  id: string;
  items: CartLine[];
  total: number;
  paid: number;
  change: number;
  createdAt: string;
};

export type PosSettings = {
  shopName: string;
};

export type PosData = {
  products: Product[];
  sales: Sale[];
  settings: PosSettings;
};
