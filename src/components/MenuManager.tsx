import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  ToggleLeft, 
  ToggleRight, 
  Sparkles,
  Search
} from 'lucide-react';
import { Dish, DISH_CATEGORIES } from '../types';
import { addDish, toggleDishAvailability, deleteDish, seedInitialDishesIfEmpty } from '../services/restaurantService';

interface MenuManagerProps {
  dishes: Dish[];
}

export const MenuManager: React.FC<MenuManagerProps> = ({ dishes }) => {
  // Form state
  const [name, setName] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [category, setCategory] = useState<string>(DISH_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [available, setAvailable] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const numPrice = parseFloat(price);
    const finalCategory = category === 'Otro' ? customCategory.trim() || 'General' : category;

    if (!trimmedName) {
      setErrorToast('Por favor escribe el nombre del plato.');
      return;
    }

    if (isNaN(numPrice) || numPrice <= 0) {
      setErrorToast('Por favor especifica un precio válido mayor a 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorToast(null);

    try {
      await addDish({
        name: trimmedName,
        price: Number(numPrice.toFixed(2)),
        category: finalCategory,
        description: description.trim(),
        available,
      });

      // Clear form
      setName('');
      setPrice('');
      setDescription('');
      setAvailable(true);
      setSuccessToast(`¡"${trimmedName}" se agregó correctamente a la base de datos!`);

      setTimeout(() => {
        setSuccessToast(null);
      }, 4000);
    } catch (err) {
      console.error(err);
      setErrorToast('Error al guardar el plato en Firebase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (dish: Dish) => {
    try {
      await toggleDishAvailability(dish.id, !dish.available);
    } catch (err) {
      console.error('Error al cambiar disponibilidad:', err);
    }
  };

  const handleDelete = async (dish: Dish) => {
    if (window.confirm(`¿Estás seguro de eliminar "${dish.name}" de la carta?`)) {
      try {
        await deleteDish(dish.id);
      } catch (err) {
        console.error('Error al eliminar plato:', err);
      }
    }
  };

  const handleSeedDefaults = async () => {
    setIsSeeding(true);
    try {
      await seedInitialDishesIfEmpty();
      setSuccessToast('Menú base cargado en Firebase.');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  };

  const filtered = dishes.filter((d) =>
    d.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    d.category.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* Toast notifications */}
      {successToast && (
        <div className="mb-4 bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-semibold">{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-xs text-emerald-700 underline font-medium">
            Cerrar
          </button>
        </div>
      )}

      {errorToast && (
        <div className="mb-4 bg-rose-50 border border-rose-300 text-rose-900 px-4 py-3 rounded-xl flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <span className="text-sm font-medium">{errorToast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Add New Dish Form (5 cols on lg) */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs sticky top-20">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-stone-100">
              <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-stone-900">Agregar Nuevo Plato</h3>
                <p className="text-xs text-stone-500">Se guardará directamente en la base de datos Firebase</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Dish Name */}
              <div>
                <label htmlFor="dish-name" className="block text-xs font-semibold text-stone-700 mb-1">
                  Nombre del Plato *
                </label>
                <input
                  id="dish-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. T-Bone Steak 500g, Papas Trufadas..."
                  className="w-full text-sm border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              {/* Price & Category in row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="dish-price" className="block text-xs font-semibold text-stone-700 mb-1">
                    Precio ($) *
                  </label>
                  <input
                    id="dish-price"
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="15.50"
                    className="w-full text-sm border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>

                <div>
                  <label htmlFor="dish-category" className="block text-xs font-semibold text-stone-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    id="dish-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-sm border border-stone-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  >
                    {DISH_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="Otro">Otra categoría...</option>
                  </select>
                </div>
              </div>

              {/* Custom category if "Otro" is chosen */}
              {category === 'Otro' && (
                <div>
                  <label htmlFor="custom-category" className="block text-xs font-semibold text-stone-700 mb-1">
                    Nombre de la nueva categoría
                  </label>
                  <input
                    id="custom-category"
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Ej. Tragos de Autor, Menú Infantil"
                    className="w-full text-sm border border-amber-300 rounded-lg px-3 py-2 focus:outline-none"
                    autoFocus
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label htmlFor="dish-description" className="block text-xs font-semibold text-stone-700 mb-1">
                  Descripción / Ingredientes (Opcional)
                </label>
                <textarea
                  id="dish-description"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles de preparación, guarniciones incluidas, corte..."
                  className="w-full text-sm border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 resize-none"
                />
              </div>

              {/* Initial availability */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="dish-available-checkbox"
                  type="checkbox"
                  checked={available}
                  onChange={(e) => setAvailable(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="dish-available-checkbox" className="text-xs font-medium text-stone-700 cursor-pointer">
                  Marcar como disponible de inmediato para los meseros
                </label>
              </div>

              {/* Submit Button */}
              <button
                id="btn-save-dish"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-stone-900 hover:bg-amber-600 text-white font-bold rounded-lg text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Guardando en Firebase...' : 'Guardar Plato en Menú'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right column: Current Dishes in Database (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-stone-600" />
                <div>
                  <h3 className="font-bold text-base text-stone-900">
                    Platos en Base de Datos ({dishes.length})
                  </h3>
                  <p className="text-xs text-stone-500">
                    {dishes.filter((d) => d.available).length} disponibles ·{' '}
                    {dishes.filter((d) => !d.available).length} agotados
                  </p>
                </div>
              </div>

              {dishes.length === 0 && (
                <button
                  type="button"
                  onClick={handleSeedDefaults}
                  disabled={isSeeding}
                  className="flex items-center gap-1.5 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-100"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Cargar Menú Sugerido Carneriks</span>
                </button>
              )}
            </div>

            {/* Filter Search */}
            <div className="mt-3 relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filtrar por nombre o categoría..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* List */}
            <div className="mt-3 divide-y divide-stone-100 max-h-[600px] overflow-y-auto pr-1">
              {filtered.length === 0 ? (
                <div className="py-10 text-center text-stone-400 text-xs">
                  No hay platos registrados con este filtro.
                </div>
              ) : (
                filtered.map((dish) => (
                  <div
                    key={dish.id}
                    className="py-3 flex items-start justify-between gap-3 group hover:bg-stone-50/70 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-stone-900">{dish.name}</h4>
                        <span className="text-[10px] font-semibold bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded">
                          {dish.category}
                        </span>
                        <span className="text-xs font-bold text-amber-700">
                          ${dish.price.toFixed(2)}
                        </span>
                      </div>
                      {dish.description && (
                        <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">{dish.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Availability toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggle(dish)}
                        className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md transition-colors cursor-pointer ${
                          dish.available
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-200'
                        }`}
                        title={dish.available ? 'Click para marcar como Agotado' : 'Click para marcar como Disponible'}
                      >
                        {dish.available ? (
                          <>
                            <ToggleRight className="w-4 h-4 text-emerald-600" />
                            <span>Disponible</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 text-stone-400" />
                            <span>Agotado</span>
                          </>
                        )}
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDelete(dish)}
                        className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Eliminar plato de la base de datos"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
