import React from 'react';
import { ArrowLeft, Home, Pause, Save, Sparkles, Star, Volume2, VolumeX } from 'lucide-react';
import type { SaveStatusState } from '../game/types';
import { LogoLockup } from './LogoLockup';
import { SaveStatusBadge } from './SaveStatusBadge';

interface GameHeaderProps {
  worldTitle: string;
  progressLabel?: string;
  totalStars: number;
  soundEnabled: boolean;
  saveStatus: SaveStatusState;
  lastSavedAt?: number;
  saveError?: string | null;
  onSaveProgress: () => void;
  onRetrySave: () => void;
  onHome: () => void;
  onBack: () => void;
  onPause: () => void;
  onToggleSound: () => void;
  onOpenMentor?: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  worldTitle,
  progressLabel,
  totalStars,
  soundEnabled,
  saveStatus,
  lastSavedAt,
  saveError,
  onSaveProgress,
  onRetrySave,
  onHome,
  onBack,
  onPause,
  onToggleSound,
  onOpenMentor,
}) => {
  return (
    <header className="relative z-20 w-full border-b-2 border-teal-100 bg-white/95 px-3 py-2.5 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-1.5 sm:gap-3">
          {/* Left: Home & Back */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={onHome}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border-2 border-slate-200 bg-slate-50 px-2.5 sm:px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 cursor-pointer whitespace-nowrap"
              aria-label="Kembali ke Halaman Utama"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Beranda</span>
            </button>

            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-2.5 sm:px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer whitespace-nowrap"
              aria-label="Kembali ke Peta Dunia"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Peta</span>
            </button>
          </div>

          {/* Center: World Title + Clean Progress Text (lg+ single row) */}
          <div className="hidden lg:flex min-w-0 flex-1 flex-col items-center text-center">
            <div className="hidden lg:block">
              <LogoLockup compact />
            </div>
            <div className="flex max-w-full items-center gap-2 text-base font-bold text-slate-900">
              <span className="font-display truncate">{worldTitle}</span>
              {progressLabel && (
                <>
                  <span className="text-slate-300 shrink-0" aria-hidden="true">
                    ·
                  </span>
                  <span className="font-mono-num text-sm font-semibold text-teal-700 whitespace-nowrap shrink-0">
                    {progressLabel}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right: Save Status + Save Button + Stars + AI Mentor + Sound + Pause */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="hidden md:block">
              <SaveStatusBadge
                status={saveStatus}
                lastSavedAt={lastSavedAt}
                error={saveError}
                onRetry={onRetrySave}
                compact
              />
            </div>

            <button
              type="button"
              onClick={onSaveProgress}
              data-testid="header-save-progress-btn"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-2.5 sm:px-3 text-xs sm:text-sm font-bold text-emerald-800 transition hover:bg-emerald-100 cursor-pointer whitespace-nowrap"
              aria-label="Simpan Progres"
            >
              <Save className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              <span className="hidden lg:inline">Save Progress</span>
            </button>

            <div
              className="flex items-center gap-1 px-1.5 sm:px-2 py-1.5 text-sm font-bold text-amber-700"
              aria-label={`Total bintang ${totalStars}`}
            >
              <Star className="h-5 w-5 fill-amber-400 text-amber-500" aria-hidden="true" />
              <span className="font-mono-num">{totalStars}</span>
            </div>

            {onOpenMentor && (
              <button
                type="button"
                onClick={onOpenMentor}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border-2 border-teal-200 bg-teal-50 px-2.5 sm:px-3 text-xs sm:text-sm font-bold text-teal-800 transition hover:bg-teal-100 cursor-pointer whitespace-nowrap"
                aria-label="Tanya HIGAYON AI Mentor"
              >
                <Sparkles className="h-4 w-4 text-teal-600" aria-hidden="true" />
                <span className="hidden xl:inline">Tanya HIGAYON</span>
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleSound();
              }}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 cursor-pointer"
              aria-label={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
            >
              {soundEnabled ? (
                <Volume2 className="h-5 w-5 text-teal-600" aria-hidden="true" />
              ) : (
                <VolumeX className="h-5 w-5 text-slate-400" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border-2 border-amber-300 bg-amber-50 px-2.5 sm:px-3 text-sm font-bold text-amber-900 transition hover:bg-amber-100 cursor-pointer whitespace-nowrap"
              aria-label="Jeda Permainan"
            >
              <Pause className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Jeda</span>
            </button>
          </div>
        </div>

        {/* Mobile & Tablet sub-row for World Title + Progress */}
        <div className="mt-2 flex lg:hidden items-center justify-center gap-2 border-t border-slate-100 pt-1.5 text-xs sm:text-sm font-bold text-slate-900">
          <span className="font-display truncate">{worldTitle}</span>
          {progressLabel && (
            <>
              <span className="text-slate-300 shrink-0" aria-hidden="true">
                ·
              </span>
              <span className="font-mono-num font-semibold text-teal-700 whitespace-nowrap shrink-0">
                {progressLabel}
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
