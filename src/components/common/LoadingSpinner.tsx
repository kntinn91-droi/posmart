import React from 'react';

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Memuat data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      <p className="text-xs font-medium text-slate-500">{message}</p>
    </div>
  );
};
