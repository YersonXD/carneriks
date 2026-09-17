import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Users, 
  Utensils, 
  Clock, 
  Sparkles, 
  RotateCcw, 
  Receipt,
  Search,
  ExternalLink
} from 'lucide-react';
import { RestaurantTable, TableStatus, Order } from '../types';
import { 
  addTable, 
  updateTableStatus, 
  freeTable, 
  deleteTable, 
  seedInitialTablesIfEmpty 
} from '../services/restaurantService';
import { formatCurrency } from '../utils/format';

interface TablesViewProps {
  tables: RestaurantTable[];
  orders: Order[];
  onSelectTableForOrder: (table: RestaurantTable) => void;
}

export const TablesView: React.FC<TablesViewProps> = ({
  tables,
  orders,
  onSelectTableForOrder,
}) => {
  // Filters & Search
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add Table Modal / Form
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTableNumber, setNewTableNumber] = useState<string>('');
  const [newTableCapacity, setNewTableCapacity] = useState<number>(4);
  const [newTableStatus, setNewTableStatus] = useState<TableStatus>('libre');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Selected table detail modal
  const [selectedTableForDetail, setSelectedTableForDetail] = useState<RestaurantTable | null>(null);

  // Handle Add Table to Firestore
  const handleAddTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNumber = newTableNumber.trim();
    if (!trimmedNumber) return;

    setIsSubmitting(true);
    try {
      await addTable({
        number: trimmedNumber,
        capacity: Number(newTableCapacity) || 4,
        status: newTableStatus,
      });

      setNewTableNumber('');
      setNewTableCapacity(4);
      setNewTableStatus('libre');
      setShowAddModal(false);
      setFeedbackMessage(`Mesa "${trimmedNumber}" guardada en la base de datos.`);
      setTimeout(() => setFeedbackMessage(null), 3500);
    } catch (err) {
      console.error(err);
      setFeedbackMessage('Error al crear la mesa en Firebase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Free Table
  const handleFreeTable = async (tableId: string, tableNumber: string) => {
    try {
      await freeTable(tableId);
      setFeedbackMessage(`Mesa "${tableNumber}" liberada y disponible.`);
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Delete Table
  const handleDeleteTable = async (tableId: string, tableNumber: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${tableNumber}" de la base de datos?`)) {
      return;
    }
    try {
      await deleteTable(tableId);
      setFeedbackMessage(`Mesa "${tableNumber}" eliminada.`);
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter tables
  const filteredTables = tables.filter((table) => {
    const matchesStatus = filterStatus === 'todos' || table.status === filterStatus;
    const matchesSearch = table.number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate statistics
  const totalTables = tables.length;
  const freeTablesCount = tables.filter((t) => t.status === 'libre').length;
  const occupiedTablesCount = tables.filter((t) => t.status === 'ocupada').length;
  const billTablesCount = tables.filter((t) => t.status === 'cuenta').length;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="mb-4 bg-amber-50 border border-amber-300 text-amber-900 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-semibold">{feedbackMessage}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs text-amber-700 underline font-medium"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Header & Stats */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 mb-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 flex items-center gap-2">
              <span>Gestión de Mesas</span>
              <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                Firestore en Vivo
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Monitorea en tiempo real el estado de ocupación, comandas activas y capacidad del salón.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              id="btn-add-table-modal"
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Mesa</span>
            </button>

            {tables.length === 0 && (
              <button
                type="button"
                onClick={() => seedInitialTablesIfEmpty()}
                className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-2 rounded-xl text-xs font-semibold transition-all border border-stone-300"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Cargar 12 Mesas Base</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Counter Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-stone-100">
          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200">
            <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Total Mesas</p>
            <p className="text-2xl font-black text-stone-900 mt-0.5">{totalTables}</p>
          </div>

          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Mesas Libres</p>
            <p className="text-2xl font-black text-emerald-800 mt-0.5">{freeTablesCount}</p>
          </div>

          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Ocupadas / En Comanda</p>
            <p className="text-2xl font-black text-amber-800 mt-0.5">{occupiedTablesCount}</p>
          </div>

          <div className="bg-sky-50 rounded-xl p-3 border border-sky-200">
            <p className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">Pidiendo Cuenta</p>
            <p className="text-2xl font-black text-sky-800 mt-0.5">{billTablesCount}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'todos', label: 'Todas', count: totalTables },
            { id: 'libre', label: 'Libres', count: freeTablesCount },
            { id: 'ocupada', label: 'Ocupadas', count: occupiedTablesCount },
            { id: 'cuenta', label: 'Cuenta', count: billTablesCount },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                filterStatus === tab.id
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filterStatus === tab.id ? 'bg-stone-700 text-stone-200' : 'bg-stone-100 text-stone-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar mesa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-amber-600"
          />
        </div>
      </div>

      {/* Tables Grid */}
      {filteredTables.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center text-stone-500">
          <Users className="w-10 h-10 mx-auto text-stone-300 mb-2" />
          <p className="font-semibold text-stone-700">No se encontraron mesas con los filtros actuales</p>
          <p className="text-xs mt-1 text-stone-400">Puedes agregar una mesa o cambiar el criterio de búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTables.map((table) => {
            // Find active order if linked
            const activeOrder = orders.find(
              (o) => 
                (table.currentOrderId && o.id === table.currentOrderId) || 
                (o.tableNumber === table.number && (o.status === 'pendiente' || o.status === 'en_preparacion'))
            );

            const isOccupied = table.status === 'ocupada' || Boolean(activeOrder);
            const isBill = table.status === 'cuenta';

            return (
              <div
                key={table.id}
                id={`table-card-${table.id}`}
                className={`bg-white rounded-2xl border transition-all p-4 flex flex-col justify-between shadow-xs hover:shadow-md ${
                  isOccupied
                    ? 'border-amber-300 bg-amber-50/20'
                    : isBill
                    ? 'border-sky-300 bg-sky-50/20'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                {/* Top: Name, Capacity & Status Badge */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-1.5">
                        <span>{table.number}</span>
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-stone-500 mt-0.5">
                        <Users className="w-3.5 h-3.5 text-stone-400" />
                        <span>Hasta {table.capacity} personas</span>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        isOccupied
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : isBill
                          ? 'bg-sky-100 text-sky-800 border border-sky-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {isOccupied ? 'Ocupada' : isBill ? 'Cuenta' : 'Libre'}
                    </span>
                  </div>

                  {/* Occupied State Details */}
                  {isOccupied && (
                    <div className="my-3 p-2.5 bg-amber-100/60 rounded-xl border border-amber-200/80 text-xs">
                      {activeOrder ? (
                        <div>
                          <div className="flex items-center justify-between font-bold text-amber-900 mb-1">
                            <span className="flex items-center gap-1">
                              <Utensils className="w-3.5 h-3.5 text-amber-700" />
                              Comanda #{activeOrder.id.slice(-4).toUpperCase()}
                            </span>
                            <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                              {activeOrder.status === 'pendiente' ? 'En espera' : 'En cocina'}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 truncate">
                            {activeOrder.items.length} platos · Total: {formatCurrency(activeOrder.total)}
                          </p>
                          <p className="text-[10px] text-stone-500 mt-0.5">
                            Mesero: {activeOrder.waiterName}
                          </p>
                        </div>
                      ) : (
                        <p className="text-amber-900 font-semibold text-xs">
                          {table.currentWaiter ? `Atendido por ${table.currentWaiter}` : 'Comensales en mesa'}
                        </p>
                      )}
                    </div>
                  )}

                  {!isOccupied && !isBill && (
                    <div className="my-3 py-2 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-xl">
                      Mesa lista para clientes
                    </div>
                  )}
                </div>

                {/* Actions bottom */}
                <div className="pt-3 border-t border-stone-100 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSelectTableForOrder(table)}
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1 transition-colors"
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      <span>Tomar Pedido</span>
                    </button>

                    {isOccupied && (
                      <button
                        type="button"
                        onClick={() => handleFreeTable(table.id, table.number)}
                        title="Liberar mesa y marcar como disponible"
                        className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold py-1.5 px-2.5 rounded-lg flex items-center gap-1 transition-colors border border-stone-200"
                      >
                        <RotateCcw className="w-3 h-3 text-stone-500" />
                        <span>Liberar</span>
                      </button>
                    )}
                  </div>

                  {/* Status switcher & delete */}
                  <div className="flex items-center justify-between gap-1 text-[11px] pt-1">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateTableStatus(table.id, 'libre')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          table.status === 'libre' ? 'bg-emerald-600 text-white' : 'text-stone-500 hover:bg-stone-100'
                        }`}
                      >
                        Libre
                      </button>
                      <button
                        type="button"
                        onClick={() => updateTableStatus(table.id, 'ocupada')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          table.status === 'ocupada' ? 'bg-amber-600 text-white' : 'text-stone-500 hover:bg-stone-100'
                        }`}
                      >
                        Ocupada
                      </button>
                      <button
                        type="button"
                        onClick={() => updateTableStatus(table.id, 'cuenta')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          table.status === 'cuenta' ? 'bg-sky-600 text-white' : 'text-stone-500 hover:bg-stone-100'
                        }`}
                      >
                        Cuenta
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTable(table.id, table.number)}
                      title="Eliminar mesa"
                      className="p-1 text-stone-400 hover:text-red-600 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add Table */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl animate-fade-in border border-stone-200">
            <h2 className="text-lg font-bold text-stone-900 mb-1">
              Agregar Nueva Mesa a Firebase
            </h2>
            <p className="text-xs text-stone-500 mb-4">
              La mesa se guardará en la colección <code className="bg-stone-100 px-1 py-0.5 rounded text-amber-700">tables</code> en tiempo real.
            </p>

            <form onSubmit={handleAddTableSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nombre o Número de Mesa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mesa 13, Barra 3, VIP 1, Terraza 3"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full text-sm p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Capacidad (Personas)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={newTableCapacity}
                    onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 2)}
                    className="w-full text-sm p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Estado Inicial
                  </label>
                  <select
                    value={newTableStatus}
                    onChange={(e) => setNewTableStatus(e.target.value as TableStatus)}
                    className="w-full text-sm p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-600 bg-white"
                  >
                    <option value="libre">Libre</option>
                    <option value="ocupada">Ocupada</option>
                    <option value="cuenta">Pidiendo cuenta</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Mesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
