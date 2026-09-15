import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  Flame, 
  Sparkles, 
  Trash2, 
  AlertTriangle,
  History,
  CheckCheck
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { updateOrderStatus, clearServedOrders } from '../services/restaurantService';

interface KitchenViewProps {
  orders: Order[];
}

export const KitchenView: React.FC<KitchenViewProps> = ({ orders }) => {
  const [statusFilter, setStatusFilter] = useState<'activas' | 'pendiente' | 'en_preparacion' | 'servido' | 'archivado'>('activas');
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [clearFeedback, setClearFeedback] = useState<string | null>(null);
  const [, setNowTick] = useState<number>(Date.now());

  // Re-render every 30 seconds to refresh "Hace X min" elapsed counters
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Filter orders based on selected tab
  const activeOrders = orders.filter((o) => o.status !== 'archivado');
  const pendingOrders = orders.filter((o) => o.status === 'pendiente');
  const preparingOrders = orders.filter((o) => o.status === 'en_preparacion');
  const servedOrders = orders.filter((o) => o.status === 'servido');
  const archivedOrders = orders.filter((o) => o.status === 'archivado');

  let displayedOrders: Order[] = [];
  if (statusFilter === 'activas') {
    displayedOrders = activeOrders;
  } else if (statusFilter === 'pendiente') {
    displayedOrders = pendingOrders;
  } else if (statusFilter === 'en_preparacion') {
    displayedOrders = preparingOrders;
  } else if (statusFilter === 'servido') {
    displayedOrders = servedOrders;
  } else if (statusFilter === 'archivado') {
    displayedOrders = archivedOrders;
  }

  // Format elapsed time (e.g., "Hace 3 min")
  const getElapsedTime = (createdAt: number) => {
    const diffSecs = Math.floor((Date.now() - createdAt) / 1000);
    if (diffSecs < 60) return 'Hace unos segundos';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    return `Hace ${diffHours} h ${diffMins % 60} m`;
  };

  // Change status of an order
  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, nextStatus);
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    }
  };

  // Clear served orders (The requested feature: "un boton para limpiar las comandas ya servidas")
  const handleClearServed = async () => {
    if (servedOrders.length === 0) return;

    setIsClearing(true);
    try {
      const count = await clearServedOrders('archive');
      setClearFeedback(`Se limpiaron ${count} ${count === 1 ? 'comanda servida' : 'comandas servidas'} del panel de cocina.`);
      setTimeout(() => {
        setClearFeedback(null);
      }, 4000);
    } catch (err) {
      console.error('Error al limpiar comandas servidas:', err);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* Clear feedback toast */}
      {clearFeedback && (
        <div className="mb-4 bg-stone-900 text-stone-100 border border-stone-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium">{clearFeedback}</span>
          </div>
          <button
            onClick={() => setClearFeedback(null)}
            className="text-xs text-stone-400 hover:text-white underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Control Panel: Metrics, Filter tabs & The Clear Served Orders Button */}
      <div className="bg-white border border-stone-200 rounded-xl p-3 sm:p-4 mb-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 flex-wrap">
          {/* Filter Pills with Counts */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              id="filter-kds-all"
              type="button"
              onClick={() => setStatusFilter('activas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'activas'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <span>Activas</span>
              <span className="bg-stone-800 text-stone-200 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {activeOrders.length}
              </span>
            </button>

            <button
              id="filter-kds-pending"
              type="button"
              onClick={() => setStatusFilter('pendiente')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'pendiente'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
              }`}
            >
              <span>Pendientes</span>
              <span className="bg-amber-700 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {pendingOrders.length}
              </span>
            </button>

            <button
              id="filter-kds-preparing"
              type="button"
              onClick={() => setStatusFilter('en_preparacion')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'en_preparacion'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200/60'
              }`}
            >
              <span>En Cocción</span>
              <span className="bg-blue-700 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {preparingOrders.length}
              </span>
            </button>

            <button
              id="filter-kds-served"
              type="button"
              onClick={() => setStatusFilter('servido')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === 'servido'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              <span>Servidas</span>
              <span className="bg-emerald-700 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {servedOrders.length}
              </span>
            </button>

            <button
              id="filter-kds-archived"
              type="button"
              onClick={() => setStatusFilter('archivado')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                statusFilter === 'archivado'
                  ? 'bg-stone-800 text-stone-200 shadow-xs'
                  : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
              }`}
              title="Ver comandas que ya fueron limpiadas"
            >
              <History className="w-3.5 h-3.5" />
              <span>Historial</span>
            </button>
          </div>

          {/* Core Feature: Button to Clean/Clear Served Orders */}
          <div className="flex items-center gap-2">
            <button
              id="btn-limpiar-comandas-servidas"
              type="button"
              disabled={servedOrders.length === 0 || isClearing}
              onClick={handleClearServed}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                servedOrders.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow active:scale-98'
                  : 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
              }`}
              title={
                servedOrders.length > 0
                  ? 'Archivar y retirar de la vista todas las órdenes que ya fueron servidas'
                  : 'No hay comandas con estado servido para limpiar'
              }
            >
              <Trash2 className="w-4 h-4" />
              <span>Limpiar comandas ya servidas</span>
              {servedOrders.length > 0 && (
                <span className="bg-emerald-800 text-emerald-100 text-[11px] px-1.5 py-0.5 rounded-full font-mono">
                  {servedOrders.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Orders Grid / KDS Ticket Board */}
      {displayedOrders.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-900 mb-1">
            {statusFilter === 'activas'
              ? 'No hay comandas activas en cocina'
              : `No hay comandas en estado "${statusFilter}"`}
          </h3>
          <p className="text-sm text-stone-500 leading-relaxed">
            {statusFilter === 'activas'
              ? 'Cuando los meseros envíen un pedido desde las mesas, aparecerá aquí en tiempo real de inmediato.'
              : 'Selecciona la pestaña "Activas" para ver todas las comandas en curso.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayedOrders.map((order) => {
            const isLate = Date.now() - order.createdAt > 15 * 60 * 1000 && order.status !== 'servido' && order.status !== 'archivado';

            return (
              <div
                key={order.id}
                id={`ticket-order-${order.id}`}
                className={`bg-white border rounded-xl overflow-hidden shadow-xs flex flex-col justify-between transition-all ${
                  order.status === 'pendiente'
                    ? 'border-amber-300 ring-1 ring-amber-400/30'
                    : order.status === 'en_preparacion'
                    ? 'border-blue-300 ring-1 ring-blue-400/30'
                    : order.status === 'servido'
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-stone-200 opacity-75'
                }`}
              >
                {/* Ticket Top Header: Table, Waiter, Time Elapsed */}
                <div
                  className={`px-4 py-3 border-b flex items-start justify-between ${
                    order.status === 'pendiente'
                      ? 'bg-amber-50/80 border-amber-200'
                      : order.status === 'en_preparacion'
                      ? 'bg-blue-50/80 border-blue-200'
                      : order.status === 'servido'
                      ? 'bg-emerald-50/80 border-emerald-200'
                      : 'bg-stone-100 border-stone-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black tracking-tight text-stone-900">
                        {order.tableNumber}
                      </span>
                      {isLate && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded">
                          <AlertTriangle className="w-3 h-3" />
                          Demorado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 font-medium">
                      Mesero: <span className="text-stone-800 font-semibold">{order.waiterName}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    {/* Status Pill */}
                    <span
                      className={`inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-1 ${
                        order.status === 'pendiente'
                          ? 'bg-amber-500 text-white'
                          : order.status === 'en_preparacion'
                          ? 'bg-blue-600 text-white'
                          : order.status === 'servido'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-500 text-white'
                      }`}
                    >
                      {order.status === 'pendiente' && 'Pendiente'}
                      {order.status === 'en_preparacion' && 'En Cocción'}
                      {order.status === 'servido' && 'Servido'}
                      {order.status === 'archivado' && 'Archivado'}
                    </span>

                    <div className="flex items-center gap-1 text-[11px] text-stone-500 font-mono justify-end">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>{getElapsedTime(order.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Ticket Body: Order items list */}
                <div className="p-4 flex-1 divide-y divide-stone-100">
                  <div className="space-y-2.5 pb-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <span className="text-sm font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-mono flex-shrink-0">
                          {item.quantity}x
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-stone-900 leading-tight">
                            {item.name}
                          </p>
                          {item.notes && (
                            <div className="mt-1 bg-amber-50 border border-amber-200 text-amber-900 text-xs px-2 py-1 rounded font-medium">
                              ⚠️ <span className="font-semibold">{item.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* General order notes */}
                  {order.notes && (
                    <div className="pt-2.5 mt-1 bg-stone-50 rounded-lg p-2 border border-stone-200/60 text-xs text-stone-700">
                      <span className="font-bold text-stone-800">Nota comanda:</span> {order.notes}
                    </div>
                  )}
                </div>

                {/* Ticket Footer: Actions / State Progression */}
                <div className="p-3 bg-stone-50/80 border-t border-stone-200 flex items-center justify-between gap-2">
                  <div className="text-xs text-stone-400 font-mono">
                    Total: <span className="font-bold text-stone-700">${order.total?.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {order.status === 'pendiente' && (
                      <button
                        id={`btn-start-cook-${order.id}`}
                        type="button"
                        onClick={() => handleStatusChange(order.id, 'en_preparacion')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Comenzar</span>
                      </button>
                    )}

                    {order.status === 'en_preparacion' && (
                      <button
                        id={`btn-mark-served-${order.id}`}
                        type="button"
                        onClick={() => handleStatusChange(order.id, 'servido')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Marcar Servido</span>
                      </button>
                    )}

                    {order.status === 'servido' && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Listo para retirar
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(order.id, 'archivado')}
                          className="text-xs text-stone-400 hover:text-stone-600 p-1.5 hover:bg-stone-200 rounded"
                          title="Limpiar este ticket individual"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {order.status === 'archivado' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.id, 'pendiente')}
                        className="text-xs text-amber-700 hover:text-amber-900 underline font-medium"
                      >
                        Reabrir ticket
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
