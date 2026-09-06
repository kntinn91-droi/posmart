import React from 'react';
import { formatRupiah } from '../../lib/formatters';
import { Card } from '../common/Card';
import { LucideIcon } from 'lucide-react';

interface KantongCardProps {
  nomor: 1 | 2 | 3;
  title: string;
  subtitle: string;
  totalSaldo: number;
  todayAddition: number;
  colorScheme: 'blue' | 'green' | 'purple';
  icon: LucideIcon;
  breakdownNotes?: { label: string; value: number }[];
  onActionClick?: () => void;
  actionLabel?: string;
}

export const KantongCard: React.FC<KantongCardProps> = ({
  nomor,
  title,
  subtitle,
  totalSaldo,
  todayAddition,
  colorScheme,
  icon: Icon,
  breakdownNotes = [],
  onActionClick,
  actionLabel
}) => {
  const styles = {
    blue: {
      accentBg: 'bg-sky-50 text-sky-600',
      badgeBg: 'bg-sky-100 text-sky-800',
      border: 'border-sky-100',
      highlight: 'text-sky-600'
    },
    green: {
      accentBg: 'bg-emerald-50 text-emerald-600',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      border: 'border-emerald-100',
      highlight: 'text-emerald-600'
    },
    purple: {
      accentBg: 'bg-purple-50 text-purple-600',
      badgeBg: 'bg-purple-100 text-purple-800',
      border: 'border-purple-100',
      highlight: 'text-purple-600'
    }
  }[colorScheme];

  return (
    <Card className={`relative overflow-hidden border-2 ${styles.border}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`p-2.5 rounded-xl ${styles.accentBg}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${styles.badgeBg}`}>
                KANTONG {nomor}
              </span>
              <h4 className="text-sm font-bold text-slate-800">{title}</h4>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-slate-500 font-medium">Saldo Kumulatif:</span>
          <span className={`text-base font-black ${styles.highlight}`}>
            {formatRupiah(totalSaldo)}
          </span>
        </div>
        <div className="flex justify-between items-baseline mt-1 text-xs">
          <span className="text-slate-400">Masuk Hari Ini:</span>
          <span className={`font-bold ${todayAddition >= 0 ? 'text-slate-700' : 'text-rose-600'}`}>
            {todayAddition >= 0 ? '+' : ''}{formatRupiah(todayAddition)}
          </span>
        </div>
      </div>

      {breakdownNotes.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-slate-50 space-y-1">
          {breakdownNotes.map((note, idx) => (
            <div key={idx} className="flex justify-between text-[11px] text-slate-500">
              <span>{note.label}</span>
              <span className="font-semibold text-slate-700">{formatRupiah(note.value)}</span>
            </div>
          ))}
        </div>
      )}

      {onActionClick && (
        <button
          onClick={onActionClick}
          className={`mt-3 w-full py-2 rounded-xl text-xs font-bold border-2 transition-all active:scale-95 ${styles.badgeBg} border-transparent hover:opacity-80`}
        >
          💸 {actionLabel || 'Gunakan'}
        </button>
      )}
    </Card>
  );
};
