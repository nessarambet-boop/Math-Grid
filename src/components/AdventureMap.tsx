import React from 'react';
import {
  BookOpen,
  Building2,
  Compass,
  Lock,
  PencilRuler,
  Puzzle,
  Trophy,
} from 'lucide-react';
import { BUILDING_LOCATIONS } from '../game/buildingData';
import { LOCKED_ISLANDS } from '../game/curriculumData';
import { getWorldProgressSummary, isLocationUnlocked } from '../game/storage';
import { WorldId, type GameProgress } from '../game/types';

interface AdventureMapProps {
  progress: GameProgress;
  onSelectWorld: (world: WorldId) => void;
  compact?: boolean;
}

interface WorldCardConfig {
  id: WorldId;
  title: string;
  subtitle: string;
  badgeText: string;
  accentBg: string;
  accentBorder: string;
  iconBg: string;
  iconColor: string;
  Icon: React.FC<{ className?: string }>;
}

const PLAYABLE_WORLDS: WorldCardConfig[] = [
  {
    id: WorldId.LEARN,
    title: '1. Learn World',
    subtitle: 'Mengenal Persegi & Persegi Panjang lewat animasi',
    badgeText: 'Dunia Belajar',
    accentBg: 'bg-emerald-50/95',
    accentBorder: 'border-emerald-300 hover:border-emerald-500',
    iconBg: 'bg-emerald-600',
    iconColor: 'text-white',
    Icon: BookOpen,
  },
  {
    id: WorldId.PRACTICE,
    title: '2. Practice World',
    subtitle: 'Gambar bangun & ukur luas serta keliling di grid',
    badgeText: 'Dunia Latihan',
    accentBg: 'bg-sky-50/95',
    accentBorder: 'border-sky-300 hover:border-sky-500',
    iconBg: 'bg-sky-600',
    iconColor: 'text-white',
    Icon: PencilRuler,
  },
  {
    id: WorldId.PUZZLE,
    title: '3. Puzzle World',
    subtitle: 'Pecahkan teka-teki ruang & rintangan grid',
    badgeText: 'Dunia Teka-Teki',
    accentBg: 'bg-amber-50/95',
    accentBorder: 'border-amber-300 hover:border-amber-500',
    iconBg: 'bg-amber-500',
    iconColor: 'text-white',
    Icon: Puzzle,
  },
  {
    id: WorldId.CHALLENGE,
    title: '4. Challenge World',
    subtitle: 'Uji ketangkasan & ketepatan dalam 3 tingkat',
    badgeText: 'Dunia Tantangan',
    accentBg: 'bg-orange-50/95',
    accentBorder: 'border-orange-300 hover:border-orange-500',
    iconBg: 'bg-orange-600',
    iconColor: 'text-white',
    Icon: Trophy,
  },
  {
    id: WorldId.BUILDING,
    title: '5. Building World',
    subtitle: 'Rancang kota & bangunan dari 9 bentuk geometri 2D',
    badgeText: 'Bangun Kota',
    accentBg: 'bg-violet-50/95',
    accentBorder: 'border-violet-300 hover:border-violet-500',
    iconBg: 'bg-violet-600',
    iconColor: 'text-white',
    Icon: Building2,
  },
];

export const AdventureMap: React.FC<AdventureMapProps> = ({
  progress,
  onSelectWorld,
  compact = false,
}) => {
  const summary = getWorldProgressSummary(progress);

  const getCount = (id: WorldId) => {
    switch (id) {
      case WorldId.LEARN:
        return summary.learn;
      case WorldId.PRACTICE:
        return summary.practice;
      case WorldId.PUZZLE:
        return summary.puzzle;
      case WorldId.CHALLENGE:
        return summary.challenge;
      case WorldId.BUILDING:
        return summary.building;
    }
  };

  return (
    <section
      aria-label="Peta Petualangan Dunia Matematika"
      className="relative overflow-hidden rounded-3xl border-2 border-teal-200 bg-gradient-to-b from-sky-100/95 via-teal-50/95 to-emerald-50/95 p-4 sm:p-6 shadow-md"
    >
      {/* Decorative SVG Archipelago Sea & Dashed Trail */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
        viewBox="0 0 1000 320"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M 90 150 Q 220 70 330 150 T 550 140 T 760 150 T 920 140"
          fill="none"
          stroke="#0D9488"
          strokeWidth="5"
          strokeDasharray="12 12"
          strokeLinecap="round"
        />
        <circle cx="90" cy="150" r="9" fill="#0D9488" />
        <circle cx="330" cy="150" r="9" fill="#0284C7" />
        <circle cx="550" cy="140" r="9" fill="#D97706" />
        <circle cx="760" cy="150" r="9" fill="#EA580C" />
        <circle cx="920" cy="140" r="9" fill="#7C3AED" />
      </svg>

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-teal-700" aria-hidden="true" />
          <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900">
            Peta Pulau Matematika · Eksplorasi &amp; Bangun Kota
          </h2>
        </div>
        <span className="text-xs sm:text-sm font-semibold text-teal-800">
          Pilih pulau untuk memulai
        </span>
      </div>

      {/* 5 Active Islands */}
      <div
        className={`relative z-10 grid gap-3 sm:gap-4 ${
          compact
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {PLAYABLE_WORLDS.map((world) => {
          const stat = getCount(world.id);
          const pct = stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0;
          const isLast = progress.lastWorld === world.id && progress.hasStarted;
          const Icon = world.Icon;

          return (
            <button
              key={world.id}
              type="button"
              onClick={() => onSelectWorld(world.id)}
              className={`group flex flex-col justify-between rounded-2xl border-2 ${world.accentBorder} ${world.accentBg} p-4 text-left shadow-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 cursor-pointer min-h-[136px]`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${world.iconBg} ${world.iconColor} shadow-sm`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span className="font-mono-num text-xs font-bold text-slate-600">
                    {stat.done}/{stat.total} Selesai
                  </span>
                </div>

                <h3 className="mt-3 font-display text-base sm:text-lg font-bold text-slate-900 group-hover:text-teal-800">
                  {world.title}
                </h3>
                <p className="mt-0.5 text-xs text-slate-600 leading-snug">
                  {world.subtitle}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/70">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span>{isLast ? 'Terakhir dimainkan' : world.badgeText}</span>
                  <span className="font-mono-num">{pct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/90 border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${world.iconBg}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Building World 4 Exploration Locations Strip */}
      <div className="relative z-10 mt-4 pt-4 border-t border-teal-200/80">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-violet-900">
            Lokasi Eksplorasi Building World
          </span>
          <button
            type="button"
            onClick={() => onSelectWorld(WorldId.BUILDING)}
            className="text-xs font-bold text-violet-700 hover:underline cursor-pointer"
          >
            Buka Building World →
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {BUILDING_LOCATIONS.map((loc) => {
            const unlocked = isLocationUnlocked(loc.id, progress);
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => onSelectWorld(WorldId.BUILDING)}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition cursor-pointer ${
                  unlocked
                    ? 'border-violet-200 bg-white/90 hover:border-violet-400'
                    : 'border-slate-300 bg-slate-100/85 text-slate-500'
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    unlocked ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {unlocked ? (
                    <Building2 className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Lock className="h-4 w-4" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-display text-xs font-bold text-slate-800 truncate">
                    {loc.name}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {unlocked ? 'Terbuka · Siap dibangun' : loc.unlockRequirementText}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Locked Future Islands */}
      <div className="relative z-10 mt-4 pt-4 border-t border-teal-200/80">
        <div className="text-xs font-bold text-slate-600 mb-2.5">
          Pulau Petualangan Berikutnya (Terkunci)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {LOCKED_ISLANDS.map((island) => (
            <div
              key={island.id}
              aria-disabled="true"
              className="flex items-center gap-3 rounded-xl border border-slate-300/80 bg-slate-100/85 px-3.5 py-2.5 text-slate-500"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-500">
                <Lock className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="font-display text-sm font-bold text-slate-700 truncate">
                  {island.title}
                </div>
                <div className="text-xs text-slate-500 truncate">{island.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
