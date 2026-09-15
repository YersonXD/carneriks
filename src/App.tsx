import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { WaiterView } from './components/WaiterView';
import { KitchenView } from './components/KitchenView';
import { TablesView } from './components/TablesView';
import { MenuManager } from './components/MenuManager';
import { Dish, Order, UserRole, RestaurantTable } from './types';
import { 
  subscribeToDishes, 
  subscribeToOrders, 
  subscribeToTables,
  seedInitialDishesIfEmpty,
  seedInitialTablesIfEmpty
} from './services/restaurantService';
import { playKitchenChime } from './utils/sound';
import { UtensilsCrossed, ChefHat, BookOpen, AlertTriangle, Users } from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('mesero');
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedTableForWaiterView, setSelectedTableForWaiterView] = useState<RestaurantTable | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Keep track of order count to detect new incoming orders for the kitchen chime
  const prevOrdersCountRef = useRef<number>(0);
  const isFirstLoadRef = useRef<boolean>(true);

  // Initialize and subscribe to Firestore
  useEffect(() => {
    // 1. Seed initial dishes and tables if database is currently empty
    seedInitialDishesIfEmpty().catch((err) => {
      console.error('Dish seed check error:', err);
    });
    seedInitialTablesIfEmpty().catch((err) => {
      console.error('Table seed check error:', err);
    });

    // 2. Real-time subscription to Dishes
    const unsubscribeDishes = subscribeToDishes(
      (loadedDishes) => {
        setDishes(loadedDishes);
        setIsLoading(false);
        setFirestoreError(null);
      },
      (error) => {
        console.error('Error fetching dishes:', error);
        setFirestoreError(
          error instanceof Error ? error.message : 'Error al conectar con la colección dishes en Firebase'
        );
        setIsLoading(false);
      }
    );

    // 3. Real-time subscription to Orders
    const unsubscribeOrders = subscribeToOrders(
      (loadedOrders) => {
        // Detect new order arrival
        if (!isFirstLoadRef.current && loadedOrders.length > prevOrdersCountRef.current) {
          if (soundEnabled) {
            playKitchenChime();
          }
        }
        isFirstLoadRef.current = false;
        prevOrdersCountRef.current = loadedOrders.length;
        setOrders(loadedOrders);
      },
      (error) => {
        console.error('Error fetching orders:', error);
      }
    );

    // 4. Real-time subscription to Tables
    const unsubscribeTables = subscribeToTables(
      (loadedTables) => {
        setTables(loadedTables);
      },
      (error) => {
        console.error('Error fetching tables:', error);
      }
    );

    return () => {
      unsubscribeDishes();
      unsubscribeOrders();
      unsubscribeTables();
    };
  }, [soundEnabled]);

  // Active orders (pending or in preparation)
  const activeOrdersCount = orders.filter(
    (o) => o.status === 'pendiente' || o.status === 'en_preparacion'
  ).length;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans selection:bg-amber-500 selection:text-white pb-16 sm:pb-0">
      {/* Top Application Bar */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        activeOrdersCount={activeOrdersCount}
        dishesCount={dishes.length}
        tablesCount={tables.length}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
      />

      {/* Database Warning/Notice if rules or network issues arise */}
      {firestoreError && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-amber-900 text-xs sm:text-sm">
          <div className="max-w-7xl mx-auto flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Aviso de conexión con Firebase (Proyecto carnerikls)</p>
              <p className="text-amber-800 mt-0.5">
                {firestoreError}
              </p>
              <p className="text-stone-600 mt-1">
                Nota: Si es un proyecto nuevo, verifica en tu consola de Firebase que <strong>Cloud Firestore</strong> esté creado y sus <strong>Reglas de Seguridad</strong> permitan lectura/escritura (por ejemplo, en modo de prueba o con reglas públicas para <code className="bg-amber-100 px-1 py-0.5 rounded">dishes</code> y <code className="bg-amber-100 px-1 py-0.5 rounded">orders</code>).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFirestoreError(null)}
              className="text-xs bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold px-2 py-1 rounded transition-colors"
            >
              Cerrar aviso
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="w-9 h-9 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-semibold text-stone-600">
              Conectando con base de datos de Carneriks...
            </p>
          </div>
        ) : (
          <>
            {currentRole === 'mesero' && (
              <WaiterView
                dishes={dishes}
                tables={tables}
                selectedTableFromParent={selectedTableForWaiterView}
                onOrderSent={() => {
                  setSelectedTableForWaiterView(null);
                }}
              />
            )}

            {currentRole === 'cocina' && (
              <KitchenView orders={orders} />
            )}

            {currentRole === 'mesas' && (
              <TablesView
                tables={tables}
                orders={orders}
                onSelectTableForOrder={(table) => {
                  setSelectedTableForWaiterView(table);
                  setCurrentRole('mesero');
                }}
              />
            )}

            {currentRole === 'carta' && (
              <MenuManager dishes={dishes} />
            )}
          </>
        )}
      </main>

      {/* Quick Mobile Role Bar at bottom for tablets and phones */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-stone-950 border-t border-stone-800 py-2 px-3 flex justify-around z-30 shadow-lg">
        <button
          type="button"
          onClick={() => setCurrentRole('mesero')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            currentRole === 'mesero' ? 'text-amber-400' : 'text-stone-400'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Mesero</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentRole('cocina')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold relative ${
            currentRole === 'cocina' ? 'text-amber-400' : 'text-stone-400'
          }`}
        >
          <ChefHat className="w-4 h-4" />
          <span>Cocina</span>
          {activeOrdersCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] px-1.5 rounded-full">
              {activeOrdersCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setCurrentRole('mesas')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            currentRole === 'mesas' ? 'text-amber-400' : 'text-stone-400'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Mesas</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentRole('carta')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            currentRole === 'carta' ? 'text-amber-400' : 'text-stone-400'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Menú</span>
        </button>
      </div>
    </div>
  );
}
