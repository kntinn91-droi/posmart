import React from 'react';
import { ShoppingBag, Receipt, LayoutDashboard, Calendar, UtensilsCrossed, Settings } from 'lucide-react';

export type NavTab = 'pos' | 'expenses' | 'dashboard' | 'recap' | 'products' | 'settings';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  cartCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  cartCount = 0
}) => {
  const navItems = [
    { id: 'pos' as NavTab, label: 'Kasir', icon: ShoppingBag, badge: cartCount },
    { id: 'expenses' as NavTab, label: 'Pengeluaran', icon: Receipt },
    { id: 'dashboard' as NavTab, label: '3 Kantong', icon: LayoutDashboard },
    { id: 'recap' as NavTab, label: 'Rekap', icon: Calendar },
    { id: 'products' as NavTab, label: 'Produk', icon: UtensilsCrossed },
    { id: 'settings' as NavTab, label: 'Setting', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/80 px-2 py-1.5 shadow-lg safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
                isActive
                  ? 'text-amber-600 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center animate-bounce">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
