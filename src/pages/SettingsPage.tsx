import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { isSupabaseConfigured } from '../lib/supabase';
import { Sliders, Database, ShieldCheck, Save, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [ambangRamai, setAmbangRamai] = useState(() => localStorage.getItem('cfg_ambang_ramai') || '200000');
  const [rasioGajiRamai, setRasioGajiRamai] = useState(() => localStorage.getItem('cfg_rasio_gaji_ramai') || '50');
  const [rasioGajiSepi, setRasioGajiSepi] = useState(() => localStorage.getItem('cfg_rasio_gaji_sepi') || '50');
  const [rasioHidupSepi, setRasioHidupSepi] = useState(() => localStorage.getItem('cfg_rasio_hidup_sepi') || '70');
  const [rasioHidupRamai, setRasioHidupRamai] = useState(() => localStorage.getItem('cfg_rasio_hidup_ramai') || '50');

  const [saldoAwalUsaha, setSaldoAwalUsaha] = useState(() => localStorage.getItem('cfg_saldo_usaha') || '0');
  const [saldoAwalPribadi, setSaldoAwalPribadi] = useState(() => localStorage.getItem('cfg_saldo_pribadi') || '0');
  const [saldoAwalModal, setSaldoAwalModal] = useState(() => localStorage.getItem('cfg_saldo_modal') || '0');

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('cfg_ambang_ramai', ambangRamai);
    localStorage.setItem('cfg_rasio_gaji_ramai', rasioGajiRamai);
    localStorage.setItem('cfg_rasio_gaji_sepi', rasioGajiSepi);
    localStorage.setItem('cfg_rasio_hidup_sepi', rasioHidupSepi);
    localStorage.setItem('cfg_rasio_hidup_ramai', rasioHidupRamai);
    localStorage.setItem('cfg_saldo_usaha', saldoAwalUsaha);
    localStorage.setItem('cfg_saldo_pribadi', saldoAwalPribadi);
    localStorage.setItem('cfg_saldo_modal', saldoAwalModal);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-bold text-slate-900">Pengaturan Parameter Sistem</h2>
        <p className="text-[11px] text-slate-500">Konfigurasi Sistem 3 Kantong & Koneksi Cloud</p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Pengaturan berhasil disimpan!</span>
        </div>
      )}

      {/* Cloud / Database Status */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white">Status Database Cloud</h4>
          </div>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
            isSupabaseConfigured ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
            {isSupabaseConfigured ? 'Terhubung (Supabase)' : 'Mode Lokal (IndexedDB)'}
          </span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          {isSupabaseConfigured
            ? 'Aplikasi terhubung ke PostgreSQL Supabase. Seluruh data transaksi, 3 Kantong, dan rekap otomatis tersinkron ke cloud.'
            : 'Aplikasi saat ini berjalan offline-first menggunakan browser IndexedDB. Untuk mengaktifkan cloud backup & multi-device, pasang kunci Supabase di file .env.'}
        </p>
      </Card>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Parameter Mode & Gaji */}
        <Card className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold text-slate-800">Parameter Sistem 3 Kantong</h4>
          </div>

          <div className="space-y-3">
            <div>
              <Input
                label="Ambang Profit Mode Ramai (Rp)"
                type="number"
                value={ambangRamai}
                onChange={(e) => setAmbangRamai(e.target.value)}
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Batas profit kotor harian: ≥ nilai ini berstatus <strong>RAMAI</strong>, di bawahnya <strong>SEPI</strong>.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <div>
                <Input
                  label="Rasio Gaji Ramai (%)"
                  type="number"
                  value={rasioGajiRamai}
                  onChange={(e) => setRasioGajiRamai(e.target.value)}
                />
                <span className="text-[9px] text-slate-400 block mt-0.5">% profit kotor untuk gaji saat Ramai</span>
              </div>
              <div>
                <Input
                  label="Rasio Gaji Sepi (%)"
                  type="number"
                  value={rasioGajiSepi}
                  onChange={(e) => setRasioGajiSepi(e.target.value)}
                />
                <span className="text-[9px] text-slate-400 block mt-0.5">% profit kotor untuk gaji saat Sepi</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <div>
                <Input
                  label="Jatah Hidup Ramai (%)"
                  type="number"
                  value={rasioHidupRamai}
                  onChange={(e) => setRasioHidupRamai(e.target.value)}
                />
                <span className="text-[9px] text-slate-400 block mt-0.5">% gaji untuk jatah hidup saat Ramai</span>
              </div>
              <div>
                <Input
                  label="Jatah Hidup Sepi (%)"
                  type="number"
                  value={rasioHidupSepi}
                  onChange={(e) => setRasioHidupSepi(e.target.value)}
                />
                <span className="text-[9px] text-slate-400 block mt-0.5">% gaji untuk jatah hidup saat Sepi</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Saldo Awal Migrasi */}
        <Card className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <div>
              <h4 className="text-xs font-bold text-slate-800">Saldo Awal Migrasi Excel</h4>
              <p className="text-[10px] text-slate-400">Diisi satu kali untuk kontinuitas saldo</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Input
              label="Kas Modal (Rp)"
              type="number"
              value={saldoAwalModal}
              onChange={(e) => setSaldoAwalModal(e.target.value)}
            />
            <Input
              label="Tab. Usaha (Rp)"
              type="number"
              value={saldoAwalUsaha}
              onChange={(e) => setSaldoAwalUsaha(e.target.value)}
            />
            <Input
              label="Tab. Pribadi (Rp)"
              type="number"
              value={saldoAwalPribadi}
              onChange={(e) => setSaldoAwalPribadi(e.target.value)}
            />
          </div>
        </Card>

        <Button type="submit" variant="primary" fullWidth>
          <Save className="w-4 h-4 mr-2" />
          Simpan Konfigurasi
        </Button>
      </form>
    </div>
  );
};
