import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, Loader2, RefreshCw } from 'lucide-react';
import { formatSavedTimestamp } from '../game/storage';
import type { SaveStatusState } from '../game/types';

interface SaveStatusBadgeProps {
  status: SaveStatusState;
  lastSavedAt?: number;
  error?: string | null;
  onRetry?: () => void;
  compact?: boolean;
}

export const SaveStatusBadge: React.FC<SaveStatusBadgeProps> = ({
  status,
  lastSavedAt,
  error,
  onRetry,
  compact = false,
}) => {
  if (status === 'error') {
    return (
      <div
        role="alert"
        data-testid="save-status-badge"
        data-save-state="error"
        className="inline-flex flex-wrap items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-800"
        title={error ?? 'Gagal menyimpan progres'}
      >
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600" aria-hidden="true" />
        <span>{compact ? 'Save Failed' : 'Save Failed — Gagal menyimpan'}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-rose-700 cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            <span>Coba Lagi</span>
          </button>
        )}
      </div>
    );
  }

  if (status === 'saving') {
    return (
      <div
        role="status"
        data-testid="save-status-badge"
        data-save-state="saving"
        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-700" aria-hidden="true" />
        <span>Saving...</span>
      </div>
    );
  }

  if (status === 'saved' || lastSavedAt) {
    return (
      <div
        role="status"
        data-testid="save-status-badge"
        data-save-state="saved"
        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-900"
        title={lastSavedAt ? `Terakhir disimpan: ${formatSavedTimestamp(lastSavedAt)}` : undefined}
      >
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
        <span>{compact ? 'Saved' : 'Saved Successfully'}</span>
        {!compact && lastSavedAt && (
          <span className="font-mono-num text-[11px] font-semibold text-emerald-700">
            · {formatSavedTimestamp(lastSavedAt)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      data-testid="save-status-badge"
      data-save-state="idle"
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600"
    >
      <Clock className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
      <span>{compact ? 'Auto Save' : 'Auto Save Aktif (Lokal)'}</span>
    </div>
  );
};
