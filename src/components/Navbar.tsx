import React from 'react';
import { ChefHat, UtensilsCrossed, BookOpen, Flame, Bell, Wifi, Users } from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeOrdersCount: number;
  dishesCount: number;
  tablesCount?: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  activeOrdersCount,
  dishesCount,
  tablesCount = 0,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 to-red-700 flex items-center justify-center text-white shadow-md shadow-amber-950/40">
              <Flame className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">Carneriks</span>
                <span className="hidden sm:inline-block text-[11px] uppercase tracking-wider font-semibold bg-stone-800 text-amber-400 px-2 py-0.5 rounded border border-stone-700">
                  Comandas en Vivo
                </span>
              </div>
              <p className="text-[11px] text-stone-400 hidden sm:block">
                Parrilla & Restaurante · Sistema Interno
              </p>
            </div>
          </div>

          {/* Navigation / Role Selector */}
          <nav className="flex items-center gap-1.5 sm:gap-2 p-1 bg-stone-950/80 rounded-xl border border-stone-800">
            <button
              id="role-btn-mesero"
              type="button"
              onClick={() => onRoleChange('mesero')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentRole === 'mesero'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-850'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Mesero</span>
            </button>

            <button
              id="role-btn-cocina"
              type="button"
              onClick={() => onRoleChange('cocina')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all relative ${
                currentRole === 'cocina'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-850'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>Cocina</span>
              {activeOrdersCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-500 text-white animate-pulse">
                  {activeOrdersCount}
                </span>
              )}
            </button>

            <button
              id="role-btn-mesas"
              type="button"
              onClick={() => onRoleChange('mesas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentRole === 'mesas'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-850'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Mesas</span>
              <span className="hidden md:inline-block text-[10px] bg-stone-800 text-stone-400 px-1.5 py-0.5 rounded ml-0.5">
                {tablesCount}
              </span>
            </button>

            <button
              id="role-btn-carta"
              type="button"
              onClick={() => onRoleChange('carta')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentRole === 'carta'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-850'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Menú</span>
              <span className="hidden md:inline-block text-[10px] bg-stone-800 text-stone-400 px-1.5 py-0.5 rounded ml-0.5">
                {dishesCount}
              </span>
            </button>
          </nav>

          {/* Quick status & Sound toggle */}
          <div className="flex items-center gap-2">
            <button
              id="btn-sound-toggle"
              type="button"
              onClick={onToggleSound}
              title={soundEnabled ? 'Sonido de nuevas comandas activado' : 'Sonido desactivado'}
              className={`p-2 rounded-lg border transition-colors ${
                soundEnabled
                  ? 'bg-stone-800 text-amber-400 border-stone-700 hover:bg-stone-700'
                  : 'bg-stone-900 text-stone-500 border-stone-800 hover:text-stone-300'
              }`}
            >
              <Bell className="w-4 h-4" />
            </button>

            <div className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-lg">
              <Wifi className="w-3.5 h-3.5" />
              <span>Firebase Conectado</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
