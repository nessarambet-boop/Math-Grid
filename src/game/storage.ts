import { BUILDING_CHALLENGES, BUILDING_LOCATIONS, TREASURE_CHESTS } from './buildingData';
import {
  ACHIEVEMENTS,
  CHALLENGE_TIERS,
  LEARN_MODULES,
  PRACTICE_TASKS,
  PUZZLE_LEVELS,
} from './curriculumData';
import {
  WorldId,
  type AttemptRecord,
  type AvatarId,
  type BuildingLocationId,
  type GameProgress,
  type HigayonAccessoryId,
  type PlacedShape,
  type SaveWriteResult,
  type SavedBuilding,
} from './types';

const LEGACY_STORAGE_KEY_V1 = 'math_grid_adventure_progress_v1';
const LEGACY_STORAGE_KEY_V2 = 'math_grid_adventure_progress_v2';
export const STORAGE_KEY_V3 = 'math_grid_adventure_progress_v3';

export const HIGAYON_BUILDING_SAVED_MSG =
  'Hebat! Bangunanmu berhasil disimpan. Kamu bisa melanjutkannya nanti!';
export const HIGAYON_PROGRESS_SAVED_MSG =
  'Progres petualanganmu sudah aman. Sampai jumpa di petualangan berikutnya!';
export const HIGAYON_OBJECT_DELETED_MSG =
  'Tidak masalah! Kamu bisa mencoba membangun kembali.';

export const DEFAULT_PROGRESS: GameProgress = {
  schemaVersion: 3,
  profile: {
    name: 'Penjelajah Cilik',
    avatar: 'kompas',
    activeAccessory: 'syal',
  },
  sound: {
    enabled: true,
    volume: 0.65,
    voiceEnabled: true,
    voiceRate: 1.0,
    animationsEnabled: true,
    musicEnabled: true,
  },
  lastWorld: WorldId.LEARN,
  hasStarted: false,
  learnCompleted: [],
  masteredModules: [],
  practiceStars: {},
  puzzleStars: {},
  challengeStars: {},
  buildingStars: {},
  savedBuildings: [],
  draftBuildings: {},
  activeBuildingLocationId: 'geometry-village',
  activeBuildingChallengeId: 'bld-rumah',
  attemptHistory: [],
  openedChests: [],
  unlockedAccessories: ['syal'],
  xp: 0,
  lastSavedAt: undefined,
};

function normalizeSavedBuildings(raw: unknown): SavedBuilding[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Partial<SavedBuilding> => Boolean(item && typeof item === 'object'))
    .map((item, idx) => {
      const createdAt = typeof item.createdAt === 'number' ? item.createdAt : Date.now();
      const updatedAt = typeof item.updatedAt === 'number' ? item.updatedAt : createdAt;
      const shapes = Array.isArray(item.shapes) ? (item.shapes as PlacedShape[]) : [];
      return {
        id: typeof item.id === 'string' && item.id ? item.id : `bld-migrated-${idx}-${createdAt}`,
        name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : `Bangunan #${idx + 1}`,
        locationId: (item.locationId as BuildingLocationId) || 'geometry-village',
        challengeId: typeof item.challengeId === 'string' ? item.challengeId : undefined,
        createdAt,
        updatedAt,
        shapes,
      };
    });
}

function normalizeDraftBuildings(raw: unknown): Record<string, PlacedShape[]> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const result: Record<string, PlacedShape[]> = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(val)) {
      result[key] = val as PlacedShape[];
    }
  }
  return result;
}

function normalizeProgress(parsed: Partial<GameProgress>): GameProgress {
  const accessories = Array.isArray(parsed.unlockedAccessories)
    ? [...parsed.unlockedAccessories]
    : ['syal'];
  if (!accessories.includes('syal')) accessories.unshift('syal');

  const learnCompleted = Array.isArray(parsed.learnCompleted) ? parsed.learnCompleted : [];
  const masteredModules = Array.isArray(parsed.masteredModules)
    ? parsed.masteredModules
    : [...learnCompleted];

  return {
    schemaVersion: 3,
    profile: {
      name: parsed.profile?.name?.trim() || DEFAULT_PROGRESS.profile.name,
      avatar: (parsed.profile?.avatar as AvatarId) || DEFAULT_PROGRESS.profile.avatar,
      activeAccessory:
        (parsed.profile?.activeAccessory as HigayonAccessoryId) || 'syal',
    },
    sound: {
      enabled: parsed.sound?.enabled ?? DEFAULT_PROGRESS.sound.enabled,
      volume:
        typeof parsed.sound?.volume === 'number'
          ? Math.min(1, Math.max(0, parsed.sound.volume))
          : DEFAULT_PROGRESS.sound.volume,
      voiceEnabled:
        parsed.sound?.voiceEnabled ?? DEFAULT_PROGRESS.sound.voiceEnabled,
      voiceRate:
        typeof parsed.sound?.voiceRate === 'number'
          ? Math.min(1.4, Math.max(0.7, parsed.sound.voiceRate))
          : DEFAULT_PROGRESS.sound.voiceRate,
      animationsEnabled:
        parsed.sound?.animationsEnabled ?? DEFAULT_PROGRESS.sound.animationsEnabled,
      musicEnabled:
        parsed.sound?.musicEnabled ?? DEFAULT_PROGRESS.sound.musicEnabled,
    },
    lastWorld: parsed.lastWorld ?? WorldId.LEARN,
    hasStarted: Boolean(parsed.hasStarted),
    learnCompleted,
    masteredModules,
    practiceStars: parsed.practiceStars ?? {},
    puzzleStars: parsed.puzzleStars ?? {},
    challengeStars: parsed.challengeStars ?? {},
    buildingStars: parsed.buildingStars ?? {},
    savedBuildings: normalizeSavedBuildings(parsed.savedBuildings),
    draftBuildings: normalizeDraftBuildings(parsed.draftBuildings),
    activeBuildingLocationId:
      (parsed.activeBuildingLocationId as BuildingLocationId) || 'geometry-village',
    activeBuildingChallengeId:
      typeof parsed.activeBuildingChallengeId === 'string' && parsed.activeBuildingChallengeId
        ? parsed.activeBuildingChallengeId
        : 'bld-rumah',
    attemptHistory: Array.isArray(parsed.attemptHistory)
      ? (parsed.attemptHistory as AttemptRecord[]).slice(0, 40)
      : [],
    openedChests: Array.isArray(parsed.openedChests) ? parsed.openedChests : [],
    unlockedAccessories: accessories as HigayonAccessoryId[],
    xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
    lastSavedAt: typeof parsed.lastSavedAt === 'number' ? parsed.lastSavedAt : undefined,
  };
}

export function loadProgress(storage?: Pick<Storage, 'getItem'>): GameProgress {
  const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) return structuredClone(DEFAULT_PROGRESS);
  try {
    // Prefer versioned v3 storage, seamlessly migrate v2 / v1 user data if present
    const rawV3 = store.getItem(STORAGE_KEY_V3);
    if (rawV3) {
      return normalizeProgress(JSON.parse(rawV3) as Partial<GameProgress>);
    }
    const rawV2 = store.getItem(LEGACY_STORAGE_KEY_V2);
    if (rawV2) {
      return normalizeProgress(JSON.parse(rawV2) as Partial<GameProgress>);
    }
    const rawV1 = store.getItem(LEGACY_STORAGE_KEY_V1);
    if (rawV1) {
      return normalizeProgress(JSON.parse(rawV1) as Partial<GameProgress>);
    }
    return structuredClone(DEFAULT_PROGRESS);
  } catch {
    return structuredClone(DEFAULT_PROGRESS);
  }
}

export function saveProgress(
  progress: GameProgress,
  storage?: Pick<Storage, 'setItem'>
): SaveWriteResult {
  const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) {
    return {
      ok: false,
      error: 'Penyimpanan lokal browser tidak tersedia di lingkungan ini.',
    };
  }
  try {
    const savedAt = Date.now();
    const payload = JSON.stringify({
      ...progress,
      schemaVersion: 3,
      lastSavedAt: savedAt,
    });
    store.setItem(STORAGE_KEY_V3, payload);
    return { ok: true, savedAt };
  } catch (err) {
    const detail =
      err instanceof Error && err.message
        ? err.message
        : 'Memori penyimpanan penuh atau diblokir oleh browser.';
    return {
      ok: false,
      error: `Gagal menyimpan progres: ${detail}`,
    };
  }
}

export function resetProgress(
  storage?: Pick<Storage, 'removeItem' | 'setItem'>
): GameProgress {
  const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  const fresh = structuredClone(DEFAULT_PROGRESS);
  if (store) {
    try {
      store.removeItem(STORAGE_KEY_V3);
      store.removeItem(LEGACY_STORAGE_KEY_V2);
      store.removeItem(LEGACY_STORAGE_KEY_V1);
      store.setItem(STORAGE_KEY_V3, JSON.stringify(fresh));
    } catch {
      // Ignore storage errors gracefully during explicit reset
    }
  }
  return fresh;
}

export function hasExistingProgress(progress: GameProgress): boolean {
  if (progress.hasStarted) return true;
  if (getTotalStars(progress) > 0) return true;
  if (progress.xp > 0) return true;
  if (progress.learnCompleted.length > 0) return true;
  if (Object.keys(progress.practiceStars).length > 0) return true;
  if (Object.keys(progress.puzzleStars).length > 0) return true;
  if (Object.keys(progress.challengeStars).length > 0) return true;
  if (Object.keys(progress.buildingStars ?? {}).length > 0) return true;
  if ((progress.savedBuildings ?? []).length > 0) return true;
  if (Object.values(progress.draftBuildings ?? {}).some((arr) => arr.length > 0)) return true;
  return false;
}

export function upsertSavedBuilding(
  savedBuildings: SavedBuilding[],
  building: SavedBuilding
): SavedBuilding[] {
  const existingIdx = savedBuildings.findIndex((b) => b.id === building.id);
  if (existingIdx >= 0) {
    const updated = [...savedBuildings];
    updated[existingIdx] = {
      ...building,
      createdAt: savedBuildings[existingIdx].createdAt,
      updatedAt: building.updatedAt || Date.now(),
    };
    return updated;
  }
  return [building, ...savedBuildings].slice(0, 30);
}

export function renameSavedBuilding(
  savedBuildings: SavedBuilding[],
  buildingId: string,
  nextName: string,
  now = Date.now()
): SavedBuilding[] {
  const trimmed = nextName.trim();
  if (!trimmed) return savedBuildings;
  return savedBuildings.map((b) =>
    b.id === buildingId ? { ...b, name: trimmed, updatedAt: now } : b
  );
}

export function duplicateSavedBuilding(
  savedBuildings: SavedBuilding[],
  buildingId: string,
  now = Date.now()
): SavedBuilding[] {
  const source = savedBuildings.find((b) => b.id === buildingId);
  if (!source) return savedBuildings;
  const copy: SavedBuilding = {
    ...structuredClone(source),
    id: `bld-save-${now}-${Math.floor(Math.random() * 1000)}`,
    name: `${source.name} (Salinan)`,
    createdAt: now,
    updatedAt: now,
  };
  return [copy, ...savedBuildings].slice(0, 30);
}

export function formatSavedTimestamp(ts?: number): string {
  if (!ts) return 'Belum tersimpan';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: 'short',
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleTimeString();
  }
}

export function getTotalStars(progress: GameProgress): number {
  const learnStars = progress.learnCompleted.length * 2;
  const practice = Object.values(progress.practiceStars).reduce((a, b) => a + b, 0);
  const puzzle = Object.values(progress.puzzleStars).reduce((a, b) => a + b, 0);
  const challenge = Object.values(progress.challengeStars).reduce((a, b) => a + b, 0);
  const building = Object.values(progress.buildingStars ?? {}).reduce((a, b) => a + b, 0);
  const chestStars = (progress.openedChests ?? []).reduce((sum, chestId) => {
    const chest = TREASURE_CHESTS.find((c) => c.id === chestId);
    return sum + (chest?.rewardStars ?? 0);
  }, 0);
  return learnStars + practice + puzzle + challenge + building + chestStars;
}

export function getMaxPossibleStars(): number {
  const scoredChallenges = BUILDING_CHALLENGES.filter((c) => c.ruleType !== 'creative').length;
  const chestMax = TREASURE_CHESTS.reduce((s, c) => s + c.rewardStars, 0);
  return (
    LEARN_MODULES.length * 2 +
    PRACTICE_TASKS.length * 3 +
    PUZZLE_LEVELS.length * 3 +
    CHALLENGE_TIERS.length * 3 +
    scoredChallenges * 3 +
    chestMax
  );
}

export function isLocationUnlocked(
  locationId: BuildingLocationId,
  progress: GameProgress
): boolean {
  const loc = BUILDING_LOCATIONS.find((l) => l.id === locationId);
  if (!loc) return true;
  if (loc.unlockMinStars === 0 && loc.unlockMinChallenges === 0) return true;
  const totalStars = getTotalStars(progress);
  const completedBuildingCount = Object.keys(progress.buildingStars ?? {}).filter(
    (id) => id !== 'bld-creative'
  ).length;
  return totalStars >= loc.unlockMinStars || completedBuildingCount >= loc.unlockMinChallenges;
}

export function isChestReady(chestId: string, progress: GameProgress): boolean {
  const bStars = progress.buildingStars ?? {};
  const completedCount = Object.keys(bStars).filter((id) => id !== 'bld-creative').length;
  const totalStars = getTotalStars(progress);

  if (chestId === 'chest-village-starter') {
    return Boolean(bStars['bld-rumah']);
  }
  if (chestId === 'chest-shape-city') {
    return completedCount >= 2;
  }
  if (chestId === 'chest-castle-royal') {
    return Boolean(bStars['bld-kastil']) || totalStars >= 30;
  }
  return false;
}

export function getUnlockedAchievementIds(progress: GameProgress): Set<string> {
  const unlocked = new Set<string>();
  const learnCount = progress.learnCompleted.length;
  const practiceDone = Object.keys(progress.practiceStars).length;
  const puzzleDone = Object.keys(progress.puzzleStars).length;
  const challengeDone = Object.keys(progress.challengeStars).length;
  const buildingDone = Object.keys(progress.buildingStars ?? {}).filter(
    (id) => id !== 'bld-creative'
  ).length;
  const savedCount = (progress.savedBuildings ?? []).length;
  const chestCount = (progress.openedChests ?? []).length;
  const totalStars = getTotalStars(progress);

  if (learnCount >= 1) unlocked.add('ach-first-step');
  if (learnCount >= LEARN_MODULES.length) unlocked.add('ach-scholar');
  if (practiceDone >= 3) unlocked.add('ach-builder');
  if (practiceDone >= PRACTICE_TASKS.length) unlocked.add('ach-practice-master');
  if (puzzleDone >= 3) unlocked.add('ach-puzzle-solver');
  if (puzzleDone >= PUZZLE_LEVELS.length) unlocked.add('ach-puzzle-king');
  if (challengeDone >= 1) unlocked.add('ach-challenger');
  if (totalStars >= 25) unlocked.add('ach-grand-master');
  if (buildingDone >= 1) unlocked.add('ach-village-architect');
  if (buildingDone >= 3) unlocked.add('ach-city-planner');
  if (savedCount >= 1) unlocked.add('ach-creative-artist');
  if (chestCount >= 1) unlocked.add('ach-treasure-hunter');

  const validIds = new Set(ACHIEVEMENTS.map((a) => a.id));
  for (const id of unlocked) {
    if (!validIds.has(id)) unlocked.delete(id);
  }
  return unlocked;
}

export function getWorldProgressSummary(progress: GameProgress) {
  const scoredChallenges = BUILDING_CHALLENGES.filter((c) => c.ruleType !== 'creative').length;
  const completedBuilding = Object.keys(progress.buildingStars ?? {}).filter(
    (id) => id !== 'bld-creative'
  ).length;

  return {
    learn: {
      done: progress.learnCompleted.length,
      total: LEARN_MODULES.length,
    },
    practice: {
      done: Object.keys(progress.practiceStars).length,
      total: PRACTICE_TASKS.length,
    },
    puzzle: {
      done: Object.keys(progress.puzzleStars).length,
      total: PUZZLE_LEVELS.length,
    },
    challenge: {
      done: Object.keys(progress.challengeStars).length,
      total: CHALLENGE_TIERS.length,
    },
    building: {
      done: completedBuilding,
      total: scoredChallenges,
    },
  };
}
