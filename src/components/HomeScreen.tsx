import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  BarChart3,
  BookOpen,
  Compass,
  FolderHeart,
  Grid,
  Info,
  Play,
  RotateCcw,
  RotateCw,
  Save,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import titleBackdrop from '../assets/images/title_islands_bg_1794732086419.jpg';
import {
  formatSavedTimestamp,
  getTotalStars,
  getUnlockedAchievementIds,
  hasExistingProgress,
} from '../game/storage';
import {
  WorldId,
  type AvatarId,
  type GameProgress,
  type SaveStatusState,
} from '../game/types';
import { speakRobot } from '../game/voice';
import { AdventureMap } from './AdventureMap';
import { LogoLockup } from './LogoLockup';
import { PWAInstallButton } from './PWAInstallButton';
import { SaveStatusBadge } from './SaveStatusBadge';
import { TutorRobot } from './TutorRobot';

interface HomeScreenProps {
  progress: GameProgress;
  saveStatus: SaveStatusState;
  lastSavedAt?: number;
  saveError?: string | null;
  onStartAdventure: () => void;
  onContinueGame: () => void;
  onNewGame: () => void;
  onSaveProgress: () => void;
  onRetrySave: () => void;
  onLearnMath: () => void;
  onOpenBuildingCreator: () => void;
  onOpenMyBuildings: () => void;
  onSelectWorld: (world: WorldId) => void;
  onOpenAchievements: () => void;
  onOpenProgress: () => void;
  onOpenAbout: () => void;
  onOpenSoundSettings: () => void;
  onOpenProfile: () => void;
}

const AVATAR_LABELS: Record<AvatarId, string> = {
  kompas: 'Penjelajah Kompas',
  roket: 'Kapten Roket',
  kristal: 'Penjaga Kristal',
  mahkota: 'Juara Pulau',
};

const WORLD_NAMES: Record<WorldId, string> = {
  [WorldId.LEARN]: 'Learn World',
  [WorldId.PRACTICE]: 'Practice World',
  [WorldId.PUZZLE]: 'Puzzle World',
  [WorldId.CHALLENGE]: 'Challenge World',
  [WorldId.BUILDING]: 'Building World',
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  progress,
  saveStatus,
  lastSavedAt,
  saveError,
  onStartAdventure,
  onContinueGame,
  onNewGame,
  onSaveProgress,
  onRetrySave,
  onLearnMath,
  onOpenBuildingCreator,
  onOpenMyBuildings,
  onSelectWorld,
  onOpenAchievements,
  onOpenProgress,
  onOpenAbout,
  onOpenSoundSettings,
  onOpenProfile,
}) => {
  const [imgError, setImgError] = useState(false);
  const [noProgressNotice, setNoProgressNotice] = useState(false);
  const [confirmNewGame, setConfirmNewGame] = useState(false);

  const totalStars = getTotalStars(progress);
  const unlockedAchCount = getUnlockedAchievementIds(progress).size;
  const savedBuildingCount = (progress.savedBuildings ?? []).length;
  const hasProgress = hasExistingProgress(progress);

  const handleContinueClick = () => {
    if (!hasProgress) {
      setNoProgressNotice(true);
      speakRobot(
        'Belum ada progres petualangan tersimpan. Ayo klik Start Adventure atau Learn Mathematics untuk memulai!',
        { fromUserAction: true }
      );
      return;
    }
    setNoProgressNotice(false);
    onContinueGame();
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-transparent">
      {/* Illustrated Key-Art Backdrop with Safe Fallback & Transparency for Living Background */}
      {!imgError && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] sm:h-[620px] overflow-hidden opacity-65">
          <img
            src={titleBackdrop}
            alt="Pemandangan pulau matematika terapung"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover object-right opacity-90"
          />
          <div className="absolute inset-0 bg-sky-100/65 sm:bg-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-sky-100/90 via-sky-100/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-teal-50/90 via-teal-50/70 to-transparent" />
        </div>
      )}

      {/* Main Content Container */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 pt-3 pb-8 sm:px-6 sm:pt-5">
        {/* Top Utility Strip: Profile + Save Status + Sound + PWA Install */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          {/* Player Simple Profile Button */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="inline-flex min-h-[44px] items-center gap-3 rounded-2xl border-2 border-white bg-white/90 px-3.5 py-1.5 text-left shadow-sm transition hover:bg-white cursor-pointer"
            aria-label="Ubah Profil Pemain"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white">
              <User className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-slate-900 truncate max-w-[160px]">
                {progress.profile.name}
              </div>
              <div className="text-xs font-medium text-slate-600">
                {AVATAR_LABELS[progress.profile.avatar]} ·{' '}
                <span className="font-mono-num font-bold text-amber-700">
                  {totalStars} Bintang
                </span>
              </div>
            </div>
          </button>

          {/* Right Controls: Save Status + Info + Sound Settings + PWA Install */}
          <div className="flex flex-wrap items-center gap-2">
            <SaveStatusBadge
              status={saveStatus}
              lastSavedAt={lastSavedAt}
              error={saveError}
              onRetry={onRetrySave}
            />

            <button
              type="button"
              onClick={onOpenAbout}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-white bg-white/90 px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-white cursor-pointer whitespace-nowrap shrink-0"
              aria-label="Tentang Aplikasi dan Bantuan"
            >
              <Info className="h-4 w-4 text-sky-600" aria-hidden="true" />
              <span className="hidden sm:inline">Info &amp; Kredit</span>
            </button>

            <button
              type="button"
              onClick={onOpenSoundSettings}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-white bg-white/90 px-3.5 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-white cursor-pointer whitespace-nowrap shrink-0"
              aria-label="Pengaturan Suara"
            >
              {progress.sound.enabled ? (
                <Volume2 className="h-4 w-4 text-teal-600" aria-hidden="true" />
              ) : (
                <VolumeX className="h-4 w-4 text-slate-400" aria-hidden="true" />
              )}
              <span>Suara {progress.sound.enabled ? 'Aktif' : 'Mati'}</span>
            </button>

            <PWAInstallButton />
          </div>
        </div>

        {/* Hero Split: Logo & Primary Menu over Negative Space + HIGAYON Mascot */}
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-6 lg:gap-8 mb-8">
          <div className="lg:col-span-7 space-y-5">
            <LogoLockup />

            <p className="max-w-xl text-base sm:text-lg font-medium text-slate-800 leading-relaxed">
              Jelajahi pulau-pulau matematika bersama robot tutor <strong>HIGAYON</strong>! Belajar bangun{' '}
              <strong className="text-teal-800">Persegi</strong>,{' '}
              <strong className="text-teal-800">Persegi Panjang</strong>, hingga membangun kota
              dari berbagai bentuk geometri 2D di atas grid interaktif.
            </p>

            {/* Primary & Secondary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                data-start="true"
                onClick={onStartAdventure}
                className="inline-flex min-h-[52px] items-center gap-2.5 rounded-2xl border-b-4 border-amber-700 bg-amber-500 px-6 py-3 font-display text-lg font-bold text-slate-950 shadow-md transition hover:bg-amber-400 active:translate-y-0.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Play className="h-5 w-5 fill-slate-950" aria-hidden="true" />
                <span>START ADVENTURE</span>
              </button>

              <button
                type="button"
                onClick={handleContinueClick}
                data-testid="continue-game-btn"
                className={`inline-flex min-h-[52px] items-center gap-2 rounded-2xl border-2 px-5 py-3 text-sm sm:text-base font-bold shadow-sm transition cursor-pointer whitespace-nowrap shrink-0 ${
                  hasProgress
                    ? 'border-teal-700 bg-teal-600 text-white hover:bg-teal-700'
                    : 'border-slate-300 bg-white/90 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <RotateCw className="h-4 w-4" aria-hidden="true" />
                <span>
                  {hasProgress
                    ? `Continue Game · ${WORLD_NAMES[progress.lastWorld]}`
                    : 'Continue Game'}
                </span>
              </button>

              {hasProgress && (
                <button
                  type="button"
                  onClick={() => setConfirmNewGame(true)}
                  data-testid="new-game-btn"
                  className="inline-flex min-h-[52px] items-center gap-1.5 rounded-2xl border-2 border-rose-200 bg-white/95 px-4 py-3 text-sm font-bold text-rose-700 shadow-sm transition hover:bg-rose-50 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  <span>New Game</span>
                </button>
              )}
            </div>

            {/* Continue Game Summary or No-Progress Guidance */}
            {hasProgress ? (
              <div
                data-testid="continue-summary-box"
                className="rounded-2xl border border-teal-200 bg-white/90 px-4 py-2.5 text-xs text-slate-700 shadow-sm"
              >
                <span className="font-bold text-teal-800">Progres Tersimpan:</span>{' '}
                <span className="font-mono-num font-bold">{totalStars}</span> Bintang ·{' '}
                <span className="font-mono-num font-bold">{progress.xp}</span> XP ·{' '}
                <span className="font-mono-num font-bold">{unlockedAchCount}</span> Lencana ·{' '}
                <span className="font-mono-num font-bold">{savedBuildingCount}</span> Bangunan ·{' '}
                Terakhir di <strong>{WORLD_NAMES[progress.lastWorld]}</strong>
                {lastSavedAt ? ` (${formatSavedTimestamp(lastSavedAt)})` : ''}
              </div>
            ) : (
              noProgressNotice && (
                <div
                  role="status"
                  data-testid="no-progress-notice"
                  className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-amber-950 shadow-sm"
                >
                  Belum ada progres tersimpan di perangkat ini. Klik{' '}
                  <strong>START ADVENTURE</strong> atau <strong>Learn Mathematics</strong> untuk
                  memulai petualangan barumu!
                </div>
              )
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onLearnMath}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-emerald-300 bg-white/95 px-3.5 py-2 text-xs sm:text-sm font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-50 cursor-pointer whitespace-nowrap shrink-0"
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                <span>Learn Mathematics</span>
              </button>

              <button
                type="button"
                onClick={onOpenBuildingCreator}
                data-testid="home-building-creator-btn"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-teal-300 bg-white/95 px-3.5 py-2 text-xs sm:text-sm font-bold text-teal-800 shadow-sm transition hover:bg-teal-50 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Grid className="h-4 w-4 text-teal-600" aria-hidden="true" />
                <span>Building Creator</span>
              </button>

              <button
                type="button"
                onClick={onOpenMyBuildings}
                data-testid="home-my-buildings-btn"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-indigo-200 bg-white/95 px-3.5 py-2 text-xs sm:text-sm font-bold text-indigo-900 shadow-sm transition hover:bg-indigo-50 cursor-pointer whitespace-nowrap shrink-0"
              >
                <FolderHeart className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                <span>My Buildings ({savedBuildingCount})</span>
              </button>

              <button
                type="button"
                onClick={onOpenAchievements}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-amber-300 bg-white/95 px-3.5 py-2 text-xs sm:text-sm font-bold text-amber-900 shadow-sm transition hover:bg-amber-50 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Award className="h-4 w-4 text-amber-600" aria-hidden="true" />
                <span>My Achievement</span>
              </button>

              <button
                type="button"
                onClick={onOpenProgress}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-sky-300 bg-white/95 px-3.5 py-2 text-xs sm:text-sm font-bold text-sky-900 shadow-sm transition hover:bg-sky-50 cursor-pointer whitespace-nowrap shrink-0"
              >
                <BarChart3 className="h-4 w-4 text-sky-600" aria-hidden="true" />
                <span>My Progress</span>
              </button>

              <button
                type="button"
                onClick={onSaveProgress}
                data-testid="home-save-progress-btn"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-emerald-400 bg-emerald-50 px-3.5 py-2 text-xs sm:text-sm font-bold text-emerald-900 shadow-sm transition hover:bg-emerald-100 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Save className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                <span>Save Progress</span>
              </button>
            </div>

            <div className="text-xs font-medium text-slate-600">
              Progres tersimpan lokal di browser/perangkat ini · Tekan Enter atau klik Start Adventure
            </div>
          </div>

          {/* Mascot Showcase Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <button
              type="button"
              onClick={() =>
                speakRobot(
                  `Halo ${progress.profile.name}! Aku HIGAYON, siap menemanimu menjelajahi dunia matematika dan membangun kota geometri!`,
                  { fromUserAction: true }
                )
              }
              className="flex flex-col items-center rounded-3xl border-2 border-white bg-white/92 p-5 sm:p-6 shadow-md max-w-sm w-full text-center transition hover:scale-[1.01] cursor-pointer"
              aria-label="Sapa robot tutor HIGAYON"
            >
              <TutorRobot
                mood="happy"
                size={136}
                accessory={progress.profile.activeAccessory ?? 'syal'}
              />
              <div className="mt-2 font-display text-lg font-bold text-slate-900">
                Halo, Aku HIGAYON!
              </div>
              <p className="mt-1 text-sm text-slate-700 leading-snug">
                &ldquo;Ayo berpetualang bersama! Klik aku untuk mendengar sapaanku atau pilih pulau
                petualangan di bawah.&rdquo;
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-teal-700">
                <Compass className="h-4 w-4" aria-hidden="true" />
                <span>Robot Tutor Matematika · Kelas 3–6 SD</span>
              </div>
            </button>
          </div>
        </div>

        {/* Adventure World Map Directly Visible & Interactive on Main Screen */}
        <AdventureMap progress={progress} onSelectWorld={onSelectWorld} compact />

        {/* Proportional Home Footer with Official Credits */}
        <footer className="mt-8 rounded-2xl border border-white/80 bg-white/85 px-4 py-3 text-center sm:flex sm:items-center sm:justify-between gap-3 shadow-sm">
          <div className="text-xs sm:text-sm font-semibold text-slate-700">
            <span className="font-display font-bold text-slate-900">MATH GRID ADVENTURE</span> ·{' '}
            <span className="text-teal-700">An Interactive Mathematics Learning Game</span>
          </div>
          <div className="mt-1 sm:mt-0 flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-slate-700">
            <span>Maskot: HIGAYON</span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="text-slate-900">Created by VANESSA RAMBET</span>
          </div>
        </footer>
      </main>

      {/* New Game Confirmation Modal */}
      {confirmNewGame && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-game-confirm-title"
        >
          <div className="animate-pop-in w-full max-w-sm rounded-3xl border-2 border-rose-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <AlertTriangle className="h-6 w-6" aria-hidden="true" />
              </div>
              <h2
                id="new-game-confirm-title"
                className="font-display text-lg font-bold text-slate-900"
              >
                Mulai Permainan Baru?
              </h2>
            </div>
            <p className="mt-3 text-sm text-slate-700 leading-relaxed">
              Memulai <strong>New Game</strong> akan menghapus progres lama ({totalStars} bintang,{' '}
              {progress.xp} XP, dan {savedBuildingCount} bangunan tersimpan) di perangkat ini.
              Apakah kamu yakin?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmNewGame(false)}
                className="min-h-[42px] rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmNewGame(false);
                  onNewGame();
                }}
                data-testid="confirm-new-game-btn"
                className="min-h-[42px] rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 cursor-pointer"
              >
                Ya, Mulai Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
