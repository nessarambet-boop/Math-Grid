import React, { useState } from 'react';
import {
  Award,
  BarChart3,
  CheckCircle2,
  Compass,
  Crown,
  Grid,
  HelpCircle,
  History,
  Home,
  Info,
  Lock,
  Map as MapIcon,
  MessageSquare,
  Music,
  Play,
  Puzzle,
  RotateCcw,
  Save,
  Shield,
  Sparkles,
  Star,
  Trash2,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { BUILDING_LOCATIONS } from '../game/buildingData';
import { ACHIEVEMENTS, LEARN_MODULES } from '../game/curriculumData';
import {
  formatSavedTimestamp,
  getMaxPossibleStars,
  getTotalStars,
  getUnlockedAchievementIds,
  getWorldProgressSummary,
  isLocationUnlocked,
} from '../game/storage';
import { sfx } from '../game/sound';
import type {
  AvatarId,
  GameProgress,
  HigayonAccessoryId,
  SaveStatusState,
  SoundSettings,
} from '../game/types';
import { speakRobot } from '../game/voice';
import { SaveStatusBadge } from './SaveStatusBadge';
import { TutorRobot } from './TutorRobot';

interface PauseModalProps {
  worldLabel: string;
  accessory?: HigayonAccessoryId;
  onResume: () => void;
  onSaveProgress?: () => void;
  onRestart?: () => void;
  onGoMap: () => void;
  onGoHome: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  worldLabel,
  accessory = 'syal',
  onResume,
  onSaveProgress,
  onRestart,
  onGoMap,
  onGoHome,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-modal-title"
    >
      <div className="animate-pop-in w-full max-w-sm rounded-3xl border-2 border-teal-200 bg-white p-6 shadow-xl text-center">
        <div className="flex justify-center">
          <TutorRobot mood="thinking" size={88} animateFloat={false} accessory={accessory} />
        </div>
        <h2
          id="pause-modal-title"
          className="mt-2 font-display text-2xl font-bold text-slate-900"
        >
          Permainan Dijeda
        </h2>
        <p className="mt-1 text-sm text-slate-600">{worldLabel}</p>

        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            onClick={onResume}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-base font-bold text-white shadow-sm hover:bg-teal-700 cursor-pointer"
          >
            <Play className="h-4 w-4 fill-white" aria-hidden="true" />
            <span>Continue (Lanjutkan)</span>
          </button>

          {onSaveProgress && (
            <button
              type="button"
              onClick={onSaveProgress}
              className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-900 hover:bg-emerald-100 cursor-pointer"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              <span>Save Progress (Simpan Progres)</span>
            </button>
          )}

          {onRestart && (
            <button
              type="button"
              onClick={onRestart}
              className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-900 hover:bg-amber-100 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Ulangi Level Ini</span>
            </button>
          )}

          <button
            type="button"
            onClick={onGoMap}
            className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <MapIcon className="h-4 w-4" aria-hidden="true" />
            <span>Kembali ke Peta Dunia</span>
          </button>

          <button
            type="button"
            onClick={onGoHome}
            className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface AchievementModalProps {
  progress: GameProgress;
  onClose: () => void;
}

const ACH_ICON_MAP = {
  star: Star,
  compass: Compass,
  grid: Grid,
  puzzle: Puzzle,
  trophy: Trophy,
  spark: Sparkles,
  shield: Shield,
  crown: Crown,
};

export const AchievementModal: React.FC<AchievementModalProps> = ({
  progress,
  onClose,
}) => {
  const unlocked = getUnlockedAchievementIds(progress);
  const totalStars = getTotalStars(progress);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ach-modal-title"
    >
      <div className="animate-pop-in flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border-2 border-amber-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Award className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="ach-modal-title"
                className="font-display text-xl sm:text-2xl font-bold text-slate-900"
              >
                My Achievement
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                <span className="font-mono-num font-bold text-teal-700">
                  {unlocked.size}/{ACHIEVEMENTS.length}
                </span>{' '}
                Lencana Terbuka ·{' '}
                <span className="font-mono-num font-bold text-amber-700">
                  {totalStars} Bintang
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
            aria-label="Tutup daftar pencapaian"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ACHIEVEMENTS.map((ach) => {
              const isUnlocked = unlocked.has(ach.id);
              const Icon = ACH_ICON_MAP[ach.icon];
              return (
                <div
                  key={ach.id}
                  className={`flex items-start gap-3 rounded-2xl border-2 p-3.5 ${
                    isUnlocked
                      ? 'border-amber-300 bg-amber-50/80'
                      : 'border-slate-200 bg-slate-50 opacity-80'
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      isUnlocked
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isUnlocked ? (
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Lock className="h-5 w-5" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-base font-bold text-slate-900 truncate">
                        {ach.title}
                      </h3>
                      {isUnlocked ? (
                        <CheckCircle2
                          className="h-4 w-4 shrink-0 text-emerald-600"
                          aria-label="Terbuka"
                        />
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-500">
                          Terkunci
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600 leading-snug">
                      {ach.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-200 px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-xl bg-teal-600 px-6 py-2 text-sm font-bold text-white hover:bg-teal-700 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

interface ProfileModalProps {
  progress: GameProgress;
  onSaveProfile: (name: string, avatar: AvatarId, activeAccessory: HigayonAccessoryId) => void;
  onClose: () => void;
}

const AVATARS: { id: AvatarId; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'kompas', label: 'Kompas', Icon: Compass },
  { id: 'roket', label: 'Roket', Icon: Sparkles },
  { id: 'kristal', label: 'Kristal', Icon: Shield },
  { id: 'mahkota', label: 'Juara', Icon: Crown },
];

const ACCESSORIES: { id: HigayonAccessoryId; label: string }[] = [
  { id: 'syal', label: 'Syal Petualang' },
  { id: 'topi_arsitek', label: 'Topi Arsitek' },
  { id: 'kacamata_bintang', label: 'Kacamata Bintang' },
  { id: 'mahkota_emas', label: 'Mahkota Emas' },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  progress,
  onSaveProfile,
  onClose,
}) => {
  const [name, setName] = useState(progress.profile.name);
  const [avatar, setAvatar] = useState<AvatarId>(progress.profile.avatar);
  const [accessory, setAccessory] = useState<HigayonAccessoryId>(
    progress.profile.activeAccessory ?? 'syal'
  );
  const [error, setError] = useState('');
  const totalStars = getTotalStars(progress);
  const unlockedAcc = progress.unlockedAccessories ?? ['syal'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Nama pemain tidak boleh kosong.');
      return;
    }
    sfx.success();
    onSaveProfile(trimmed, avatar, accessory);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className="animate-pop-in w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl border-2 border-teal-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between gap-2">
          <h2
            id="profile-modal-title"
            className="font-display text-2xl font-bold text-slate-900"
          >
            Profil Pemain &amp; HIGAYON
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
            aria-label="Tutup profil pemain"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-teal-50 px-4 py-3 border border-teal-200">
          <TutorRobot mood="happy" size={64} animateFloat={false} accessory={accessory} />
          <div className="text-sm">
            <div className="font-bold text-slate-900">Statistik Petualangan</div>
            <div className="text-slate-700 font-mono-num">
              {totalStars} Bintang · {progress.xp} XP
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="player-name-input"
              className="block text-sm font-bold text-slate-800 mb-1.5"
            >
              Nama Petualang
            </label>
            <input
              id="player-name-input"
              type="text"
              maxLength={24}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Contoh: Adi, Sinta, Budi"
              className="w-full min-h-[44px] rounded-xl border-2 border-slate-300 px-3.5 py-2 text-base font-medium text-slate-900 focus:border-teal-600 focus:outline-none"
            />
            {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
          </div>

          <div>
            <span className="block text-sm font-bold text-slate-800 mb-1.5">
              Pilih Lencana Penjelajah
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AVATARS.map(({ id, label, Icon }) => {
                const selected = avatar === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      sfx.click();
                      setAvatar(id);
                    }}
                    className={`flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-xl border-2 p-2 text-xs font-bold transition cursor-pointer ${
                      selected
                        ? 'border-teal-600 bg-teal-50 text-teal-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="block text-sm font-bold text-slate-800 mb-1.5">
              Aksesori Robot HIGAYON (Buka dari Peti Harta Karun)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {ACCESSORIES.map((item) => {
                const isUnlocked = unlockedAcc.includes(item.id);
                const selected = accessory === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!isUnlocked}
                    onClick={() => {
                      sfx.click();
                      setAccessory(item.id);
                    }}
                    className={`flex min-h-[44px] items-center justify-between gap-1.5 rounded-xl border-2 px-3 py-2 text-xs font-bold transition ${
                      !isUnlocked
                        ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                        : selected
                        ? 'border-amber-500 bg-amber-50 text-amber-950 cursor-pointer'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer'
                    }`}
                  >
                    <span className="truncate">{item.label}</span>
                    {!isUnlocked && <Lock className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-xl border-2 border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[44px] rounded-xl bg-teal-600 px-5 py-2 text-sm font-bold text-white hover:bg-teal-700 cursor-pointer"
            >
              Simpan Profil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface SoundModalProps {
  sound: SoundSettings;
  onChangeSound: (next: SoundSettings) => void;
  onClose: () => void;
}

export const SoundModal: React.FC<SoundModalProps> = ({
  sound,
  onChangeSound,
  onClose,
}) => {
  const pct = Math.round(sound.volume * 100);
  const voiceEnabled = sound.voiceEnabled !== false;
  const musicEnabled = sound.musicEnabled !== false;
  const voiceRate = sound.voiceRate ?? 1.0;
  const animationsEnabled = sound.animationsEnabled !== false;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sound-modal-title"
    >
      <div className="animate-pop-in w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl border-2 border-teal-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2
            id="sound-modal-title"
            className="font-display text-2xl font-bold text-slate-900"
          >
            Pengaturan Suara &amp; Animasi
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
            aria-label="Tutup pengaturan suara"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-3.5">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center gap-2.5">
              {sound.enabled ? (
                <Volume2 className="h-5 w-5 text-teal-600" aria-hidden="true" />
              ) : (
                <VolumeX className="h-5 w-5 text-slate-400" aria-hidden="true" />
              )}
              <span className="text-sm font-bold text-slate-800">Efek Suara Game</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = { ...sound, enabled: !sound.enabled };
                onChangeSound(next);
                if (next.enabled) setTimeout(() => sfx.success(), 20);
              }}
              className={`min-h-[40px] rounded-xl px-4 text-sm font-bold transition cursor-pointer ${
                sound.enabled
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {sound.enabled ? 'Aktif' : 'Mati'}
            </button>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center gap-2.5">
              <Music
                className={`h-5 w-5 ${musicEnabled && sound.enabled ? 'text-emerald-600' : 'text-slate-400'}`}
                aria-hidden="true"
              />
              <span className="text-sm font-bold text-slate-800">Musik Latar Petualangan</span>
            </div>
            <button
              type="button"
              onClick={() => onChangeSound({ ...sound, musicEnabled: !musicEnabled })}
              className={`min-h-[40px] rounded-xl px-4 text-sm font-bold transition cursor-pointer ${
                musicEnabled && sound.enabled
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {musicEnabled && sound.enabled ? 'Aktif' : 'Mati'}
            </button>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center gap-2.5">
              <MessageSquare
                className={`h-5 w-5 ${voiceEnabled ? 'text-sky-600' : 'text-slate-400'}`}
                aria-hidden="true"
              />
              <span className="text-sm font-bold text-slate-800">Suara Ucapan Robot HIGAYON</span>
            </div>
            <button
              type="button"
              onClick={() => onChangeSound({ ...sound, voiceEnabled: !voiceEnabled })}
              className={`min-h-[40px] rounded-xl px-4 text-sm font-bold transition cursor-pointer ${
                voiceEnabled ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {voiceEnabled ? 'Aktif' : 'Mati'}
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm font-bold text-slate-800 mb-1.5">
              <label htmlFor="sound-volume-slider">Volume Suara</label>
              <span className="font-mono-num text-teal-700">{pct}%</span>
            </div>
            <input
              id="sound-volume-slider"
              type="range"
              min={0}
              max={100}
              step={5}
              value={pct}
              disabled={!sound.enabled}
              onChange={(e) =>
                onChangeSound({ ...sound, volume: Number(e.target.value) / 100 })
              }
              className="w-full accent-teal-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-sm font-bold text-slate-800 mb-1.5">
              <label htmlFor="voice-rate-slider">Kecepatan Bicara HIGAYON</label>
              <span className="font-mono-num text-sky-700">{voiceRate.toFixed(2)}x</span>
            </div>
            <input
              id="voice-rate-slider"
              type="range"
              min={0.75}
              max={1.3}
              step={0.05}
              value={voiceRate}
              disabled={!sound.enabled || !voiceEnabled}
              onChange={(e) =>
                onChangeSound({ ...sound, voiceRate: Number(e.target.value) })
              }
              className="w-full accent-sky-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center gap-2.5">
              <Sparkles
                className={`h-5 w-5 ${animationsEnabled ? 'text-amber-500' : 'text-slate-400'}`}
                aria-hidden="true"
              />
              <span className="text-sm font-bold text-slate-800">Animasi Latar Hidup</span>
            </div>
            <button
              type="button"
              onClick={() =>
                onChangeSound({ ...sound, animationsEnabled: !animationsEnabled })
              }
              className={`min-h-[40px] rounded-xl px-4 text-sm font-bold transition cursor-pointer ${
                animationsEnabled ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {animationsEnabled ? 'Aktif' : 'Hemat Gerak'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                sfx.success();
                if (voiceEnabled) {
                  speakRobot('Halo penjelajah! Suara robot HIGAYON siap membimbingmu.', {
                    fromUserAction: true,
                  });
                }
              }}
              disabled={!sound.enabled}
              className="min-h-[44px] flex-1 rounded-xl border-2 border-amber-300 bg-amber-50 px-3 py-2 text-xs sm:text-sm font-bold text-amber-900 hover:bg-amber-100 disabled:opacity-50 cursor-pointer"
            >
              Tes Suara HIGAYON
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] flex-1 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700 cursor-pointer"
            >
              Selesai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ProgressModalProps {
  progress: GameProgress;
  saveStatus: SaveStatusState;
  lastSavedAt?: number;
  saveError?: string | null;
  onSaveProgress: () => void;
  onRetrySave: () => void;
  onResetProgress: () => void;
  onClose: () => void;
}

const WORLD_TITLE_MAP: Record<string, string> = {
  learn: 'Learn World',
  practice: 'Practice World',
  puzzle: 'Puzzle World',
  challenge: 'Challenge World',
  building: 'Building World',
};

export const ProgressModal: React.FC<ProgressModalProps> = ({
  progress,
  saveStatus,
  lastSavedAt,
  saveError,
  onSaveProgress,
  onRetrySave,
  onResetProgress,
  onClose,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const summary = getWorldProgressSummary(progress);
  const totalStars = getTotalStars(progress);
  const maxStars = getMaxPossibleStars();
  const unlockedAch = getUnlockedAchievementIds(progress).size;
  const unlockedLocations = BUILDING_LOCATIONS.filter((l) => isLocationUnlocked(l.id, progress));
  const activeDraftCount = Object.values(progress.draftBuildings ?? {}).filter(
    (list) => list.length > 0
  ).length;
  const masteredTitles = (progress.masteredModules ?? []).map(
    (id) => LEARN_MODULES.find((m) => m.id === id)?.title ?? id
  );

  const rows = [
    { label: 'Learn World (Modul Materi)', done: summary.learn.done, total: summary.learn.total, color: 'bg-emerald-500' },
    { label: 'Practice World (Latihan Grid)', done: summary.practice.done, total: summary.practice.total, color: 'bg-sky-500' },
    { label: 'Puzzle World (Teka-Teki)', done: summary.puzzle.done, total: summary.puzzle.total, color: 'bg-violet-500' },
    { label: 'Challenge World (Ujian Tingkat)', done: summary.challenge.done, total: summary.challenge.total, color: 'bg-amber-500' },
    { label: 'Building World (Misi Arsitek)', done: summary.building.done, total: summary.building.total, color: 'bg-teal-600' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="progress-modal-title"
    >
      <div className="animate-pop-in flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border-2 border-teal-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
              <BarChart3 className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="progress-modal-title"
                className="font-display text-xl sm:text-2xl font-bold text-slate-900"
              >
                My Progress · {progress.profile.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-mono-num">
                {totalStars}/{maxStars} Bintang · {progress.xp} XP · {unlockedAch}/{ACHIEVEMENTS.length} Lencana
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
            aria-label="Tutup ringkasan progres"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Save Status & Manual Save Box */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border-2 border-emerald-200 bg-emerald-50/70 p-3.5">
            <div className="space-y-1">
              <SaveStatusBadge
                status={saveStatus}
                lastSavedAt={lastSavedAt}
                error={saveError}
                onRetry={onRetrySave}
              />
              <p className="text-[11px] font-medium text-slate-600">
                Disimpan otomatis di perangkat &amp; browser ini · Terakhir:{' '}
                <span className="font-semibold text-slate-800">
                  {formatSavedTimestamp(lastSavedAt)}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={onSaveProgress}
              data-testid="modal-save-progress-btn"
              className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-emerald-700 cursor-pointer shrink-0"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              <span>Save Progress</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {rows.map((r) => {
              const pct = r.total > 0 ? Math.min(100, Math.round((r.done / r.total) * 100)) : 0;
              return (
                <div key={r.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                    <span>{r.label}</span>
                    <span className="font-mono-num text-teal-700">
                      {r.done}/{r.total} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${r.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <div className="text-[11px] font-semibold text-amber-800">Bangunan Tersimpan</div>
              <div className="font-display text-xl font-bold text-amber-950 font-mono-num">
                {(progress.savedBuildings ?? []).length}
              </div>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3">
              <div className="text-[11px] font-semibold text-sky-800">Draf Bangunan</div>
              <div className="font-display text-xl font-bold text-sky-950 font-mono-num">
                {activeDraftCount}
              </div>
            </div>
            <div className="rounded-2xl border border-teal-200 bg-teal-50 p-3">
              <div className="text-[11px] font-semibold text-teal-800">Peti Terbuka</div>
              <div className="font-display text-xl font-bold text-teal-950 font-mono-num">
                {(progress.openedChests ?? []).length}/3
              </div>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-3">
              <div className="text-[11px] font-semibold text-violet-800">Lokasi Terbuka</div>
              <div className="font-display text-xl font-bold text-violet-950 font-mono-num">
                {unlockedLocations.length}/{BUILDING_LOCATIONS.length}
              </div>
            </div>
          </div>

          {/* Detail Saved State Summary (Last Position, Mastered Topics, Settings, Attempt History) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-1.5">
              <div className="font-bold text-slate-900">Posisi Terakhir &amp; Pengaturan</div>
              <p className="text-slate-700">
                Dunia terakhir:{' '}
                <strong>{WORLD_TITLE_MAP[progress.lastWorld] ?? progress.lastWorld}</strong>
              </p>
              <p className="text-slate-700">
                Lokasi terbuka:{' '}
                <strong>{unlockedLocations.map((l) => l.name).join(', ')}</strong>
              </p>
              <p className="text-slate-700">
                Suara:{' '}
                <strong>{progress.sound.enabled ? `Aktif (${Math.round(progress.sound.volume * 100)}%)` : 'Mati'}</strong>{' '}
                · Animasi:{' '}
                <strong>{progress.sound.animationsEnabled !== false ? 'Aktif' : 'Hemat Gerak'}</strong>
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-1.5">
              <div className="font-bold text-slate-900">
                Topik Dikuasai ({masteredTitles.length})
              </div>
              {masteredTitles.length === 0 ? (
                <p className="text-slate-600">
                  Selesaikan modul di Learn World untuk menandai topik yang dikuasai.
                </p>
              ) : (
                <ul className="space-y-1 text-slate-700">
                  {masteredTitles.slice(0, 4).map((t) => (
                    <li key={t} className="truncate">
                      • {t}
                    </li>
                  ))}
                  {masteredTitles.length > 4 && (
                    <li className="text-teal-700 font-semibold">
                      +{masteredTitles.length - 4} topik lainnya
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>

          {/* Recent Attempt History */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-2">
              <History className="h-4 w-4 text-teal-600" aria-hidden="true" />
              <span>Riwayat Percobaan Terbaru ({(progress.attemptHistory ?? []).length})</span>
            </div>
            {(progress.attemptHistory ?? []).length === 0 ? (
              <p className="text-xs text-slate-500">
                Belum ada riwayat percobaan tercatat. Mulailah bermain untuk merekam hasil latihanmu!
              </p>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {(progress.attemptHistory ?? []).slice(0, 8).map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-1.5 text-xs"
                  >
                    <div className="min-w-0 truncate">
                      <span className="font-bold text-slate-800">{att.itemTitle}</span>{' '}
                      <span className="text-slate-500">
                        ({WORLD_TITLE_MAP[att.world] ?? att.world})
                      </span>
                    </div>
                    <span className="font-mono-num font-bold text-amber-700 shrink-0">
                      {att.stars} ★
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/70 p-4">
            {!confirmReset ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-rose-900">Mulai Ulang Petualangan</div>
                  <p className="text-xs text-rose-700">
                    Hapus seluruh bintang, XP, lencana, dan bangunan tersimpan di perangkat ini.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sfx.click();
                    setConfirmReset(true);
                  }}
                  className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border-2 border-rose-300 bg-white px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer shrink-0"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  <span>Reset Progress</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3" role="alert">
                <p className="text-sm font-bold text-rose-900">
                  Apakah kamu yakin ingin menghapus seluruh progres permainan? Tindakan ini tidak bisa dibatalkan.
                </p>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sfx.click();
                      setConfirmReset(false);
                    }}
                    className="min-h-[40px] rounded-xl border border-slate-300 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sfx.tileErase();
                      onResetProgress();
                      setConfirmReset(false);
                      onClose();
                    }}
                    className="min-h-[40px] rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer"
                  >
                    Ya, Hapus Semua Progres
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 px-6 py-3.5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-xl bg-teal-600 px-6 py-2 text-sm font-bold text-white hover:bg-teal-700 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

interface AboutCreditsModalProps {
  accessory?: HigayonAccessoryId;
  onClose: () => void;
}

export const AboutCreditsModal: React.FC<AboutCreditsModalProps> = ({
  accessory = 'syal',
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
    >
      <div className="animate-pop-in flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border-2 border-teal-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
              <Info className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="about-modal-title"
                className="font-display text-xl font-bold text-slate-900"
              >
                Tentang Aplikasi &amp; Bantuan
              </h2>
              <p className="text-xs font-semibold text-teal-700">
                MATH GRID ADVENTURE
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
            aria-label="Tutup info aplikasi"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-teal-200 bg-teal-50/70 p-4">
            <TutorRobot mood="happy" size={84} animateFloat={false} accessory={accessory} />
            <div className="text-center sm:text-left">
              <div className="font-display text-lg font-bold text-slate-900">
                MATH GRID ADVENTURE
              </div>
              <div className="text-xs font-bold text-teal-700">
                An Interactive Mathematics Learning Game
              </div>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                Permainan edukasi matematika untuk siswa SD kelas 3–6 bersama maskot resmi{' '}
                <strong>HIGAYON</strong>. Belajar bangun persegi, persegi panjang, koordinat
                grid, bentuk 2D, dan mengenal bangun ruang 3D secara visual dan interaktif.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-950">
              <HelpCircle className="h-4 w-4 text-amber-700" aria-hidden="true" />
              <span>Panduan Singkat Bermain</span>
            </div>
            <ul className="text-xs text-slate-700 space-y-1 leading-relaxed">
              <li>• Setiap 1 petak pada grid bernilai 1 satuan panjang (1 cm pada latihan).</li>
              <li>• Di Building World, pilih bentuk 2D, geser di grid, atur ukuran &amp; rotasi, lalu periksa atau simpan karyamu.</li>
              <li>• Buka Peti Harta Karun untuk mendapatkan bintang ekstra dan aksesori HIGAYON!</li>
              <li>• Semua progres tersimpan otomatis di perangkat dan game inti tetap dapat dimainkan saat offline.</li>
            </ul>
          </div>

          <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Credits
            </div>
            <div className="mt-0.5 font-display text-base font-bold text-slate-900">
              Created by VANESSA RAMBET
            </div>
            <div className="text-xs text-slate-600">
              Official Robot Tutor Mascot: <strong>HIGAYON</strong>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 px-6 py-3.5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-xl bg-teal-600 px-6 py-2 text-sm font-bold text-white hover:bg-teal-700 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
