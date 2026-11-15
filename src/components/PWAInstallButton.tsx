import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-teal-700 bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 active:translate-y-0.5 whitespace-nowrap shrink-0 cursor-pointer"
        aria-label="Pasang Aplikasi ke Perangkat"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        <span>Pasang Aplikasi</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-slate-300 bg-white/95 px-3.5 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
          aria-label="Cara Pasang di iPhone atau iPad"
        >
          <Smartphone className="h-4 w-4 text-teal-600" aria-hidden="true" />
          <span>Pasang di iOS</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
          >
            <div className="w-full max-w-sm rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <h3
                  id="ios-install-title"
                  className="font-display text-xl font-bold text-slate-900"
                >
                  Pasang di iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
                  aria-label="Tutup panduan pasang"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ol className="mt-3 space-y-2 text-sm text-slate-700 leading-relaxed">
                <li>
                  1. Ketuk tombol <strong>Bagikan (Share)</strong> pada bilah Safari.
                </li>
                <li>
                  2. Gulir ke bawah lalu pilih{' '}
                  <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
                </li>
                <li>3. Ketuk <strong>Tambah</strong> untuk bermain secara offline kapan saja!</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 min-h-[44px] w-full rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white hover:bg-teal-700 cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-900 shadow-md"
      role="status"
    >
      <WifiOff className="h-4 w-4 text-amber-700" aria-hidden="true" />
      <span>Mode Offline — Permainan tetap berjalan lancar</span>
    </div>
  );
};
