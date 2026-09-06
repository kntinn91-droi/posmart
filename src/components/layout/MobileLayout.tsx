import React from 'react';
import { Header } from './Header';
import { BottomNav, NavTab } from './BottomNav';
import { OfflineIndicator } from './OfflineIndicator';

interface MobileLayoutProps {
  children: React.ReactNode;
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  cartCount?: number;
  title?: string;
  subtitle?: string;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  activeTab,
  onChangeTab,
  cartCount = 0,
  title,
  subtitle
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <OfflineIndicator />
      <Header title={title} subtitle={subtitle} />
      
      <main className="flex-1 max-w-lg mx-auto w-full pb-24 px-3 pt-3">
        {children}
      </main>

      <BottomNav
        activeTab={activeTab}
        onChangeTab={onChangeTab}
        cartCount={cartCount}
      />
    </div>
  );
};
