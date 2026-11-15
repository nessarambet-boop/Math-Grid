import React from 'react';

interface LogoLockupProps {
  compact?: boolean;
}

export const LogoLockup: React.FC<LogoLockupProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-2.5 shrink-0">
        <svg
          width="36"
          height="36"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="2" y="2" width="44" height="44" rx="12" fill="#0D9488" stroke="#0F766E" strokeWidth="2.5" />
          <rect x="10" y="10" width="12" height="12" rx="2.5" fill="#F59E0B" />
          <rect x="26" y="10" width="12" height="12" rx="2.5" fill="#38BDF8" />
          <rect x="10" y="26" width="12" height="12" rx="2.5" fill="#38BDF8" />
          <rect x="26" y="26" width="12" height="12" rx="2.5" fill="#FEF3C7" />
        </svg>
        <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap">
          Math Grid Adventure
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-3.5">
      <svg
        width="64"
        height="64"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm"
        aria-hidden="true"
      >
        {/* Crest Base */}
        <rect
          x="6"
          y="6"
          width="68"
          height="68"
          rx="18"
          fill="#0D9488"
          stroke="#FFFFFF"
          strokeWidth="3.5"
        />
        {/* Inner Grid */}
        <rect x="17" y="17" width="20" height="20" rx="4" fill="#F59E0B" stroke="#FEF3C7" strokeWidth="2" />
        <rect x="43" y="17" width="20" height="20" rx="4" fill="#38BDF8" stroke="#E0F2FE" strokeWidth="2" />
        <rect x="17" y="43" width="20" height="20" rx="4" fill="#38BDF8" stroke="#E0F2FE" strokeWidth="2" />
        <rect x="43" y="43" width="20" height="20" rx="4" fill="#FBBF24" stroke="#FEF3C7" strokeWidth="2" />
        {/* Compass Star Accent */}
        <path
          d="M40 27 L43.5 36.5 L53 40 L43.5 43.5 L40 53 L36.5 43.5 L27 40 L36.5 36.5 Z"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
      <div>
        <div className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-none">
          MATH GRID
        </div>
        <div className="font-display text-xl sm:text-2xl font-bold tracking-wide text-teal-700 leading-tight">
          ADVENTURE
        </div>
        <div className="mt-1 text-xs sm:text-sm font-bold tracking-wide text-slate-600">
          An Interactive Mathematics Learning Game
        </div>
      </div>
    </div>
  );
};
