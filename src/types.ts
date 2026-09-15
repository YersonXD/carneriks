export type OrderStatus = 'pendiente' | 'en_preparacion' | 'servido' | 'archivado';

export interface OrderItem {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  category?: string;
}

export interface Order {
  id: string;
  tableNumber: string;
  tableId?: string;
  waiterName: string;
  items: OrderItem[];
  status: OrderStatus;
  notes?: string;
  total: number;
  createdAt: number; // Unix timestamp ms
  updatedAt: number; // Unix timestamp ms
}

export interface Dish {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  available: boolean;
  createdAt: number;
}

export type TableStatus = 'libre' | 'ocupada' | 'cuenta';

export interface RestaurantTable {
  id: string;
  number: string; // e.g. "Mesa 1", "Mesa 2", "Barra 1"
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  currentWaiter?: string;
  notes?: string;
  updatedAt: number;
}

export type UserRole = 'mesero' | 'cocina' | 'carta' | 'mesas';

export const DISH_CATEGORIES = [
  'Cortes & Carnes',
  'Hamburguesas & Asados',
  'Entradas & Picadas',
  'Guarniciones',
  'Bebidas & Coctelería',
  'Postres'
] as const;
