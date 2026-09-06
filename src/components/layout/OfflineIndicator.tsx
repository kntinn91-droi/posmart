import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 py-1.5 px-4 text-center text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all ${
      isOnline ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white animate-pulse'
    }`}>
      {isOnline ? (
        <>
          <Wifi className="w-3.5 h-3.5" />
          <span>Koneksi kembali terhubung. Data tersinkronisasi.</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          <span>Mode Offline. Transaksi disimpan lokal di HP.</span>
        </>
      )}
    </div>
  );
};
