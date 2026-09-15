import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Dish, Order, OrderStatus, RestaurantTable, TableStatus } from '../types';

const DISHES_COLLECTION = 'dishes';
const ORDERS_COLLECTION = 'orders';
const TABLES_COLLECTION = 'tables';

// Initial default menu items for Carneriks
const DEFAULT_DISHES: Omit<Dish, 'id'>[] = [
  {
    name: 'Bife de Chorizo Angus (350g)',
    price: 18.5,
    category: 'Cortes & Carnes',
    description: 'Corte jugoso a las brasas con chimichurri rústico y sal marina.',
    available: true,
    createdAt: Date.now() - 100000,
  },
  {
    name: 'Picanha Premium a la Espada',
    price: 19.9,
    category: 'Cortes & Carnes',
    description: 'Finas lonchas de picanha marinada al punto con manteca de hierbas.',
    available: true,
    createdAt: Date.now() - 90000,
  },
  {
    name: 'Costillas BBQ Carneriks',
    price: 16.0,
    category: 'Cortes & Carnes',
    description: 'Costillar ahumado en leña durante 6 horas bañado en salsa barbacoa artesanal.',
    available: true,
    createdAt: Date.now() - 80000,
  },
  {
    name: 'Hamburguesa Doble Smash Carneriks',
    price: 11.5,
    category: 'Hamburguesas & Asados',
    description: 'Doble medallón 100% res, queso cheddar fundido, panceta crocante y salsa secreta.',
    available: true,
    createdAt: Date.now() - 70000,
  },
  {
    name: 'Provoleta a la Parrilla con Orégano',
    price: 7.5,
    category: 'Entradas & Picadas',
    description: 'Queso provolone fundido al hierro con tomate confitado y orégano fresco.',
    available: true,
    createdAt: Date.now() - 60000,
  },
  {
    name: 'Empanadas Criollas de Carne Cortada a Cuchillo (x2)',
    price: 5.5,
    category: 'Entradas & Picadas',
    description: 'Rellenas de carne suave especiada, cebolla de verdeo y huevo duro.',
    available: true,
    createdAt: Date.now() - 50000,
  },
  {
    name: 'Papas Rústicas con Romero y Ajo',
    price: 4.5,
    category: 'Guarniciones',
    description: 'Papas doradas crocantes con romero del huerto y mayonesa ahumada.',
    available: true,
    createdAt: Date.now() - 40000,
  },
  {
    name: 'Ensalada Fresca de Rúcula y Parmesano',
    price: 5.0,
    category: 'Guarniciones',
    description: 'Hojas frescas de rúcula, lascas de parmesano maduro y vinagreta balsámica.',
    available: true,
    createdAt: Date.now() - 30000,
  },
  {
    name: 'Limonada de Menta y Jengibre (1L)',
    price: 4.0,
    category: 'Bebidas & Coctelería',
    description: 'Limonada artesanal batida con hojas de menta fresca y toque de jengibre.',
    available: true,
    createdAt: Date.now() - 20000,
  },
  {
    name: 'Cerveza Artesanal IPA Carneriks (500ml)',
    price: 4.8,
    category: 'Bebidas & Coctelería',
    description: 'Cerveza rubia con aromas cítricos y amargor equilibrado.',
    available: true,
    createdAt: Date.now() - 10000,
  },
];

/**
 * Seed initial dishes if collection is empty
 */
export async function seedInitialDishesIfEmpty(): Promise<void> {
  try {
    const dishesRef = collection(db, DISHES_COLLECTION);
    const snapshot = await getDocs(dishesRef);
    if (snapshot.empty) {
      const batch = writeBatch(db);
      for (const dish of DEFAULT_DISHES) {
        const docRef = doc(dishesRef);
        batch.set(docRef, dish);
      }
      await batch.commit();
    }
  } catch (error) {
    console.error('Error al inicializar platos por defecto:', error);
    // Don't throw to allow app to continue gracefully
  }
}

/**
 * Real-time listener for dishes
 */
export function subscribeToDishes(
  onSuccess: (dishes: Dish[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const dishesRef = collection(db, DISHES_COLLECTION);

  return onSnapshot(
    dishesRef,
    (snapshot) => {
      const dishes: Dish[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || 'Sin nombre',
          price: Number(data.price) || 0,
          category: data.category || 'Otros',
          description: data.description || '',
          available: data.available !== false,
          createdAt: data.createdAt || Date.now(),
        };
      });

      // Sort by category and name
      dishes.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
      onSuccess(dishes);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, DISHES_COLLECTION);
    }
  );
}

/**
 * Add a new dish to the database
 */
export async function addDish(
  dishData: Omit<Dish, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const dishesRef = collection(db, DISHES_COLLECTION);
    const docRef = await addDoc(dishesRef, {
      ...dishData,
      createdAt: Date.now(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, DISHES_COLLECTION);
  }
}

/**
 * Update dish availability
 */
export async function toggleDishAvailability(dishId: string, available: boolean): Promise<void> {
  const path = `${DISHES_COLLECTION}/${dishId}`;
  try {
    const dishRef = doc(db, DISHES_COLLECTION, dishId);
    await updateDoc(dishRef, { available });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete a dish
 */
export async function deleteDish(dishId: string): Promise<void> {
  const path = `${DISHES_COLLECTION}/${dishId}`;
  try {
    const dishRef = doc(db, DISHES_COLLECTION, dishId);
    await deleteDoc(dishRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Real-time listener for orders
 */
export function subscribeToOrders(
  onSuccess: (orders: Order[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const ordersRef = collection(db, ORDERS_COLLECTION);

  return onSnapshot(
    ordersRef,
    (snapshot) => {
      const orders: Order[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          tableNumber: String(data.tableNumber || ''),
          waiterName: String(data.waiterName || 'Mesero'),
          items: Array.isArray(data.items) ? data.items : [],
          status: (data.status as OrderStatus) || 'pendiente',
          notes: data.notes || '',
          total: Number(data.total) || 0,
          createdAt: Number(data.createdAt) || Date.now(),
          updatedAt: Number(data.updatedAt) || Date.now(),
        };
      });

      // Sort with newest or priority first
      orders.sort((a, b) => b.createdAt - a.createdAt);
      onSuccess(orders);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, ORDERS_COLLECTION);
    }
  );
}

/**
 * Initial default tables for Carneriks
 */
const DEFAULT_TABLES: Omit<RestaurantTable, 'id'>[] = [
  { number: 'Mesa 1', capacity: 4, status: 'libre', updatedAt: Date.now() },
  { number: 'Mesa 2', capacity: 4, status: 'libre', updatedAt: Date.now() },
  { number: 'Mesa 3', capacity: 2, status: 'libre', updatedAt: Date.now() },
  { number: 'Mesa 4', capacity: 2, status: 'libre', updatedAt: Date.now() },
  { number: 'Mesa 5', capacity: 6, status: 'libre', updatedAt: Date.now() },
  { number: 'Mesa 6', capacity: 6, status: 'libre', updatedAt: Date.now() },
  { number: 'Mesa 7', capacity: 4, status: 'libre', updatedAt: Date.now() },
  { number: 'Mesa 8', capacity: 4, status: 'libre', updatedAt: Date.now() },
  { number: 'Barra 1', capacity: 2, status: 'libre', updatedAt: Date.now() },
  { number: 'Barra 2', capacity: 2, status: 'libre', updatedAt: Date.now() },
  { number: 'Terraza 1', capacity: 4, status: 'libre', updatedAt: Date.now() },
  { number: 'Terraza 2', capacity: 6, status: 'libre', updatedAt: Date.now() },
];

/**
 * Seed initial tables if collection is empty in Firestore
 */
export async function seedInitialTablesIfEmpty(): Promise<void> {
  try {
    const tablesRef = collection(db, TABLES_COLLECTION);
    const snapshot = await getDocs(tablesRef);
    if (snapshot.empty) {
      const batch = writeBatch(db);
      for (const table of DEFAULT_TABLES) {
        const docRef = doc(tablesRef);
        batch.set(docRef, table);
      }
      await batch.commit();
    }
  } catch (error) {
    console.error('Error al inicializar mesas por defecto:', error);
  }
}

/**
 * Real-time listener for tables in Firestore
 */
export function subscribeToTables(
  onSuccess: (tables: RestaurantTable[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const tablesRef = collection(db, TABLES_COLLECTION);

  return onSnapshot(
    tablesRef,
    (snapshot) => {
      const tables: RestaurantTable[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          number: String(data.number || 'Mesa'),
          capacity: Number(data.capacity) || 4,
          status: (data.status as TableStatus) || 'libre',
          currentOrderId: data.currentOrderId || undefined,
          currentWaiter: data.currentWaiter || undefined,
          notes: data.notes || undefined,
          updatedAt: Number(data.updatedAt) || Date.now(),
        };
      });

      // Natural sort by table number (Mesa 1, Mesa 2... Barra 1, Terraza 1)
      tables.sort((a, b) => {
        return a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' });
      });

      onSuccess(tables);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, TABLES_COLLECTION);
    }
  );
}

/**
 * Add a new table to Firestore
 */
export async function addTable(
  tableData: Omit<RestaurantTable, 'id' | 'updatedAt'>
): Promise<string> {
  try {
    const tablesRef = collection(db, TABLES_COLLECTION);
    const docRef = await addDoc(tablesRef, {
      ...tableData,
      updatedAt: Date.now(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, TABLES_COLLECTION);
  }
}

/**
 * Update table status in Firestore
 */
export async function updateTableStatus(
  tableId: string, 
  status: TableStatus, 
  extra?: { currentOrderId?: string; currentWaiter?: string; notes?: string }
): Promise<void> {
  const path = `${TABLES_COLLECTION}/${tableId}`;
  try {
    const tableRef = doc(db, TABLES_COLLECTION, tableId);
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: Date.now(),
    };
    if (extra?.currentOrderId !== undefined) updateData.currentOrderId = extra.currentOrderId;
    if (extra?.currentWaiter !== undefined) updateData.currentWaiter = extra.currentWaiter;
    if (extra?.notes !== undefined) updateData.notes = extra.notes;

    await updateDoc(tableRef, updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Free up a table (mark as libre and clear order reference in Firestore)
 */
export async function freeTable(tableId: string): Promise<void> {
  const path = `${TABLES_COLLECTION}/${tableId}`;
  try {
    const tableRef = doc(db, TABLES_COLLECTION, tableId);
    await updateDoc(tableRef, {
      status: 'libre',
      currentOrderId: '',
      currentWaiter: '',
      notes: '',
      updatedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete a table from Firestore
 */
export async function deleteTable(tableId: string): Promise<void> {
  const path = `${TABLES_COLLECTION}/${tableId}`;
  try {
    const tableRef = doc(db, TABLES_COLLECTION, tableId);
    await deleteDoc(tableRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Create and send a new order to kitchen, and link to table in Firestore
 */
export async function createOrder(
  orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<string> {
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const now = Date.now();
    const docRef = await addDoc(ordersRef, {
      ...orderData,
      status: 'pendiente',
      createdAt: now,
      updatedAt: now,
    });

    // If order is linked to a tableId, update table in Firestore
    if (orderData.tableId) {
      try {
        const tableRef = doc(db, TABLES_COLLECTION, orderData.tableId);
        await updateDoc(tableRef, {
          status: 'ocupada',
          currentOrderId: docRef.id,
          currentWaiter: orderData.waiterName,
          updatedAt: now,
        });
      } catch (tableErr) {
        console.warn('No se pudo actualizar estado de la mesa en Firestore:', tableErr);
      }
    }

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, ORDERS_COLLECTION);
  }
}

/**
 * Update the status of an order
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const path = `${ORDERS_COLLECTION}/${orderId}`;
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Clear all served orders: updates all orders with status === 'servido' to 'archivado'
 * (Or permanently removes them so kitchen display is clean)
 */
export async function clearServedOrders(mode: 'archive' | 'delete' = 'archive'): Promise<number> {
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(ordersRef, where('status', '==', 'servido'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return 0;

    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      if (mode === 'delete') {
        batch.delete(docSnap.ref);
      } else {
        batch.update(docSnap.ref, {
          status: 'archivado',
          updatedAt: Date.now(),
        });
      }
    });

    await batch.commit();
    return snapshot.size;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, ORDERS_COLLECTION);
  }
}
