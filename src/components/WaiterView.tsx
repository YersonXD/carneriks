import React, { useState } from 'react';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  CheckCircle2, 
  Search, 
  ShoppingBag, 
  Clock, 
  User, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { Dish, OrderItem, RestaurantTable } from '../types';
import { createOrder } from '../services/restaurantService';
import { formatCurrency } from '../utils/format';

interface WaiterViewProps {
  dishes: Dish[];
  tables?: RestaurantTable[];
  selectedTableFromParent?: RestaurantTable | null;
  onOrderSent?: () => void;
}

export const WaiterView: React.FC<WaiterViewProps> = ({ 
  dishes, 
  tables = [], 
  selectedTableFromParent,
  onOrderSent 
}) => {
  const [selectedTableId, setSelectedTableId] = useState<string>(() => {
    if (selectedTableFromParent) return selectedTableFromParent.id;
    return tables[0]?.id || '';
  });
  const [selectedTable, setSelectedTable] = useState<string>(() => {
    if (selectedTableFromParent) return selectedTableFromParent.number;
    return tables[0]?.number || 'Mesa 1';
  });
  const [customTable, setCustomTable] = useState<string>('');
  const [isCustomTable, setIsCustomTable] = useState<boolean>(false);

  // Sync when selectedTableFromParent changes
  React.useEffect(() => {
    if (selectedTableFromParent) {
      setSelectedTableId(selectedTableFromParent.id);
      setSelectedTable(selectedTableFromParent.number);
      setIsCustomTable(false);
    }
  }, [selectedTableFromParent]);
  
  const [waiterName, setWaiterName] = useState<string>(() => {
    return localStorage.getItem('carneriks_waiter_name') || 'Mesero 1';
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Current order state
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [editingItemNoteIndex, setEditingItemNoteIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter dishes
  const categories: string[] = ['Todos', ...Array.from(new Set<string>(dishes.map((d) => d.category)))];

  const filteredDishes = dishes.filter((dish) => {
    const matchesCategory = selectedCategory === 'Todos' || dish.category === selectedCategory;
    const matchesSearch =
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dish.description && dish.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const activeTable = isCustomTable ? customTable.trim() || 'Mesa Especial' : selectedTable;

  // Add dish to order
  const handleAddDish = (dish: Dish) => {
    if (!dish.available) return;

    setOrderItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.dishId === dish.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + 1,
        };
        return next;
      } else {
        return [
          ...prev,
          {
            dishId: dish.id,
            name: dish.name,
            price: dish.price,
            quantity: 1,
            notes: '',
            category: dish.category,
          },
        ];
      }
    });
  };

  // Modify quantity
  const handleUpdateQuantity = (index: number, delta: number) => {
    setOrderItems((prev) => {
      const item = prev[index];
      const newQuantity = item.quantity + delta;
      if (newQuantity <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      const next = [...prev];
      next[index] = { ...item, quantity: newQuantity };
      return next;
    });
  };

  // Update item note
  const handleUpdateItemNote = (index: number, note: string) => {
    setOrderItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], notes: note };
      return next;
    });
  };

  // Remove single item
  const handleRemoveItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Total calculation
  const totalAmount = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalItemsCount = orderItems.reduce((acc, item) => acc + item.quantity, 0);

  // Send order to Firebase
  const handleSubmitOrder = async () => {
    if (orderItems.length === 0) {
      setErrorMessage('Agrega al menos un plato a la comanda antes de enviarla.');
      return;
    }

    if (!activeTable) {
      setErrorMessage('Por favor selecciona o especifica una mesa.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Save waiter name in local storage for convenience
      localStorage.setItem('carneriks_waiter_name', waiterName);

      await createOrder({
        tableNumber: activeTable,
        tableId: isCustomTable ? undefined : selectedTableId,
        waiterName: waiterName || 'Mesero',
        items: orderItems,
        notes: orderNotes.trim(),
        total: Number(totalAmount.toFixed(2)),
      });

      // Clear current draft
      setOrderItems([]);
      setOrderNotes('');
      setShowSuccessToast(`¡Comanda enviada a Cocina para ${activeTable}!`);
      if (onOrderSent) onOrderSent();

      setTimeout(() => {
        setShowSuccessToast(null);
      }, 4000);
    } catch (err) {
      console.error(err);
      setErrorMessage('Error al enviar la comanda. Verifica la conexión a Firebase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* Toast alert */}
      {showSuccessToast && (
        <div className="mb-4 bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl flex items-center justify-between shadow-md animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold text-sm sm:text-base">{showSuccessToast}</span>
          </div>
          <button
            onClick={() => setShowSuccessToast(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 underline font-medium"
          >
            Cerrar
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 bg-rose-50 border border-rose-300 text-rose-900 px-4 py-3 rounded-xl flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span className="text-sm font-medium">{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-auto text-xs text-rose-700 hover:underline font-semibold"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Mesero Header Bar: Table Selection and Waiter Identification */}
      <div className="bg-white border border-stone-200 rounded-xl p-3 sm:p-4 mb-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Waiter Name */}
          <div className="md:col-span-4 flex items-center gap-2">
            <div className="p-2 bg-stone-100 rounded-lg text-stone-600">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <label htmlFor="waiter-name-input" className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                Atendido por
              </label>
              <input
                id="waiter-name-input"
                type="text"
                value={waiterName}
                onChange={(e) => setWaiterName(e.target.value)}
                placeholder="Nombre o ID del mesero"
                className="w-full text-sm font-semibold text-stone-900 bg-transparent border-b border-stone-300 focus:border-amber-600 focus:outline-none pb-0.5"
              />
            </div>
          </div>

          {/* Quick Table Selector backed by Firestore */}
          <div className="md:col-span-8">
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                Mesa seleccionada: <span className="text-amber-700 font-bold">{activeTable}</span>
              </label>

              {/* Status legend */}
              <div className="flex items-center gap-2 text-[10px] text-stone-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Libre
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> Ocupada
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-500 inline-block"></span> Cuenta
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap max-h-24 overflow-y-auto pr-1">
              {tables.length > 0 ? (
                tables.map((table) => {
                  const isSelected = !isCustomTable && selectedTableId === table.id;
                  const isOccupied = table.status === 'ocupada';
                  const isBill = table.status === 'cuenta';

                  return (
                    <button
                      key={table.id}
                      id={`table-select-${table.id}`}
                      type="button"
                      onClick={() => {
                        setSelectedTableId(table.id);
                        setSelectedTable(table.number);
                        setIsCustomTable(false);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          isOccupied
                            ? isSelected ? 'bg-white' : 'bg-amber-500'
                            : isBill
                            ? isSelected ? 'bg-white' : 'bg-sky-500'
                            : isSelected ? 'bg-white' : 'bg-emerald-500'
                        }`}
                      />
                      <span>{table.number}</span>
                    </button>
                  );
                })
              ) : (
                ['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Mesa 5', 'Mesa 6', 'Barra 1', 'Terraza 1'].map((tbl) => (
                  <button
                    key={tbl}
                    type="button"
                    onClick={() => {
                      setSelectedTable(tbl);
                      setIsCustomTable(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      !isCustomTable && selectedTable === tbl
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {tbl}
                  </button>
                ))
              )}

              <button
                id="table-select-custom-btn"
                type="button"
                onClick={() => setIsCustomTable(true)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isCustomTable
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                + Otra
              </button>

              {isCustomTable && (
                <input
                  id="custom-table-input"
                  type="text"
                  value={customTable}
                  onChange={(e) => setCustomTable(e.target.value)}
                  placeholder="Ej. Mesa VIP, Salón 2"
                  className="px-2 py-1 text-xs border border-amber-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-800"
                  autoFocus
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Waiter Workspace: Left: Dishes, Right: Order Tray */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Dish Catalog (7 cols on lg) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          {/* Search and Category Filter */}
          <div className="bg-white border border-stone-200 rounded-xl p-3 shadow-xs">
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between mb-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="search-dishes-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar corte, entrada, bebida..."
                  className="w-full pl-9 pr-3 py-1.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
              <span className="text-xs text-stone-500 font-medium whitespace-nowrap self-end sm:self-auto">
                {filteredDishes.length} {filteredDishes.length === 1 ? 'plato' : 'platos'}
              </span>
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {categories.map((cat) => (
                <button
                  key={cat}
                  id={`cat-filter-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Dishes Grid */}
          {filteredDishes.length === 0 ? (
            <div className="bg-stone-50 border border-dashed border-stone-300 rounded-xl p-8 text-center">
              <p className="text-sm text-stone-500 font-medium">
                No se encontraron platos con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredDishes.map((dish) => {
                const inCartItem = orderItems.find((item) => item.dishId === dish.id);
                const quantityInCart = inCartItem?.quantity || 0;

                return (
                  <div
                    key={dish.id}
                    id={`dish-card-${dish.id}`}
                    className={`bg-white border rounded-xl p-3.5 flex flex-col justify-between transition-all duration-150 relative ${
                      dish.available
                        ? 'border-stone-200 hover:border-amber-400 hover:shadow-sm'
                        : 'border-stone-200 bg-stone-50/60 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                          {dish.category}
                        </span>
                        <span className="text-base font-bold text-stone-900">
                          {formatCurrency(dish.price)}
                        </span>
                      </div>

                      <h4 className="font-bold text-stone-900 text-sm leading-snug mb-1">
                        {dish.name}
                      </h4>

                      {dish.description && (
                        <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed mb-3">
                          {dish.description}
                        </p>
                      )}
                    </div>

                    {/* Action Area */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between mt-auto">
                      {!dish.available ? (
                        <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                          Agotado
                        </span>
                      ) : quantityInCart > 0 ? (
                        <div className="flex items-center justify-between w-full bg-amber-50 rounded-lg p-1 border border-amber-200">
                          <button
                            type="button"
                            onClick={() => {
                              const idx = orderItems.findIndex((it) => it.dishId === dish.id);
                              if (idx > -1) handleUpdateQuantity(idx, -1);
                            }}
                            className="w-7 h-7 bg-white text-stone-800 rounded-md flex items-center justify-center font-bold text-xs shadow-2xs hover:bg-stone-100"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-amber-900 text-xs px-2">
                            {quantityInCart} en orden
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddDish(dish)}
                            className="w-7 h-7 bg-amber-600 text-white rounded-md flex items-center justify-center font-bold text-xs shadow-2xs hover:bg-amber-700"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          id={`btn-add-dish-${dish.id}`}
                          type="button"
                          onClick={() => handleAddDish(dish)}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-stone-900 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar al Pedido</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Active Order Tray (5 cols on lg) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="bg-white border border-stone-200 rounded-xl shadow-sm sticky top-20 flex flex-col max-h-[calc(100vh-6rem)]">
            {/* Tray Header */}
            <div className="p-3.5 border-b border-stone-200 bg-stone-900 text-white rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm tracking-tight">Comanda Actual</h3>
                  <p className="text-[11px] text-stone-400">
                    Destino: <span className="text-amber-300 font-semibold">{activeTable}</span>
                  </p>
                </div>
              </div>

              {orderItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setOrderItems([])}
                  title="Vaciar comanda"
                  className="text-xs text-stone-400 hover:text-rose-400 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Limpiar</span>
                </button>
              )}
            </div>

            {/* Tray Content: Items list */}
            <div className="p-3.5 overflow-y-auto flex-1 divide-y divide-stone-100">
              {orderItems.length === 0 ? (
                <div className="py-12 text-center text-stone-400 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-2">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-stone-700">La comanda está vacía</p>
                  <p className="text-xs text-stone-400 mt-1 max-w-[200px]">
                    Selecciona platos de la carta a la izquierda para armar el pedido.
                  </p>
                </div>
              ) : (
                orderItems.map((item, index) => (
                  <div key={`${item.dishId}-${index}`} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between">
                          <h5 className="font-bold text-xs text-stone-900">{item.name}</h5>
                          <span className="text-xs font-bold text-stone-700 ml-2">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                        <span className="text-[11px] text-stone-500">
                          {formatCurrency(item.price)} c/u
                        </span>

                        {/* Specific Item Note */}
                        {item.notes ? (
                          <div className="mt-1 bg-amber-50/80 border border-amber-200/70 rounded px-2 py-0.5 text-[11px] text-amber-900 flex items-center justify-between">
                            <span className="italic">Nota: {item.notes}</span>
                            <button
                              type="button"
                              onClick={() => setEditingItemNoteIndex(editingItemNoteIndex === index ? null : index)}
                              className="text-[10px] text-amber-700 font-semibold underline ml-1.5"
                            >
                              Editar
                            </button>
                          </div>
                        ) : (
                          <div className="mt-0.5">
                            <button
                              type="button"
                              onClick={() => setEditingItemNoteIndex(editingItemNoteIndex === index ? null : index)}
                              className="text-[10px] text-stone-500 hover:text-amber-700 flex items-center gap-1 font-medium"
                            >
                              <FileText className="w-3 h-3" />
                              <span>+ Añadir nota (ej. término, sin salsas)</span>
                            </button>
                          </div>
                        )}

                        {editingItemNoteIndex === index && (
                          <div className="mt-1.5 flex gap-1">
                            <input
                              type="text"
                              value={item.notes || ''}
                              onChange={(e) => handleUpdateItemNote(index, e.target.value)}
                              placeholder="Ej. Término medio, sin sal..."
                              className="flex-1 text-xs border border-amber-400 rounded px-2 py-1 focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => setEditingItemNoteIndex(null)}
                              className="px-2 py-1 text-xs bg-stone-900 text-white rounded font-medium"
                            >
                              OK
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Quantity buttons */}
                      <div className="flex items-center gap-1 bg-stone-100 rounded-md p-0.5 ml-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(index, -1)}
                          className="w-6 h-6 bg-white hover:bg-stone-200 text-stone-800 rounded flex items-center justify-center font-bold text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-stone-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(index, 1)}
                          className="w-6 h-6 bg-white hover:bg-stone-200 text-stone-800 rounded flex items-center justify-center font-bold text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Tray Footer & Dispatch */}
            {orderItems.length > 0 && (
              <div className="p-3.5 border-t border-stone-200 bg-stone-50 rounded-b-xl space-y-3">
                {/* General notes for order */}
                <div>
                  <label htmlFor="general-order-notes" className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
                    Instrucciones generales de comanda
                  </label>
                  <input
                    id="general-order-notes"
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Ej. Servir bebidas primero, comensal alérgico..."
                    className="w-full text-xs bg-white border border-stone-300 rounded-lg p-2 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Subtotal & Items count */}
                <div className="flex items-center justify-between pt-1 border-t border-stone-200 text-sm">
                  <span className="text-stone-600 font-medium">Total ({totalItemsCount} items):</span>
                  <span className="text-lg font-bold text-stone-900">{formatCurrency(totalAmount)}</span>
                </div>

                {/* Send button */}
                <button
                  id="btn-submit-order-to-kitchen"
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitOrder}
                  className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-700 hover:to-red-700 text-white font-bold rounded-xl text-sm shadow-md shadow-amber-900/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>
                    {isSubmitting ? 'Enviando a Cocina...' : `Enviar a Cocina · ${activeTable}`}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
