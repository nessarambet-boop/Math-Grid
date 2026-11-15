import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILDING_CHALLENGES } from './buildingData';
import {
  getBuildingContextualHint,
  getShapeAreaEstimate,
  getShapeBounds,
  validateBuildingChallenge,
} from './buildingValidation';
import {
  DEFAULT_PROGRESS,
  duplicateSavedBuilding,
  getTotalStars,
  getUnlockedAchievementIds,
  hasExistingProgress,
  isChestReady,
  isLocationUnlocked,
  loadProgress,
  renameSavedBuilding,
  resetProgress,
  saveProgress,
  STORAGE_KEY_V3,
  upsertSavedBuilding,
} from './storage';
import type { PlacedShape, SavedBuilding } from './types';

test('Circle uses explicit center + radius model rather than polygon vertices', () => {
  const circle: PlacedShape = {
    id: 'c1',
    type: 'lingkaran',
    cx: 6,
    cy: 4,
    width: 3,
    height: 3,
    radius: 1.5,
    rotation: 0,
    color: '#FBBF24',
  };
  const bounds = getShapeBounds(circle);
  assert.equal(bounds.left, 4.5);
  assert.equal(bounds.right, 7.5);
  assert.equal(bounds.top, 2.5);
  assert.equal(bounds.bottom, 5.5);
  assert.equal(getShapeAreaEstimate(circle), Number((Math.PI * 1.5 * 1.5).toFixed(2)));
});

test('validateBuildingChallenge validates Challenge 1 (Rumah) structure & positions', () => {
  const rumahChallenge = BUILDING_CHALLENGES.find((c) => c.id === 'bld-rumah')!;
  const validRumah: PlacedShape[] = [
    { id: '1', type: 'persegi_panjang', cx: 6, cy: 6.2, width: 5, height: 3, rotation: 0, color: '#FDE68A' },
    { id: '2', type: 'segitiga', cx: 6, cy: 3.7, width: 5.5, height: 2, rotation: 0, color: '#EA580C' },
    { id: '3', type: 'persegi', cx: 4.5, cy: 5.8, width: 1, height: 1, rotation: 0, color: '#38BDF8' },
    { id: '4', type: 'persegi', cx: 7.5, cy: 5.8, width: 1, height: 1, rotation: 0, color: '#38BDF8' },
    { id: '5', type: 'persegi_panjang', cx: 6, cy: 6.95, width: 1, height: 1.5, rotation: 0, color: '#92400E' },
  ];
  assert.equal(validateBuildingChallenge(rumahChallenge, validRumah).passed, true);

  // Move roof below wall -> must fail positional check
  const wrongRoofRumah = validRumah.map((s) =>
    s.type === 'segitiga' ? { ...s, cy: 8 } : s
  );
  const resBadRoof = validateBuildingChallenge(rumahChallenge, wrongRoofRumah);
  assert.equal(resBadRoof.passed, false);
  assert.ok(resBadRoof.feedbackTitle.includes('Atap'));

  // Hint check when roof is missing
  const noRoof = validRumah.filter((s) => s.type !== 'segitiga');
  assert.ok(getBuildingContextualHint('bld-rumah', noRoof).toLowerCase().includes('segitiga'));
});

test('validateBuildingChallenge validates Challenge 2 (Sekolah) & Challenge 3 (Kastil)', () => {
  const sekolah = BUILDING_CHALLENGES.find((c) => c.id === 'bld-sekolah')!;
  const validSekolah: PlacedShape[] = sekolah.starterBlueprint!.map((s, i) => ({
    ...s,
    id: `s-${i}`,
  }));
  assert.equal(validateBuildingChallenge(sekolah, validSekolah).passed, true);
  assert.equal(validateBuildingChallenge(sekolah, validSekolah.slice(0, 2)).passed, false);

  const kastil = BUILDING_CHALLENGES.find((c) => c.id === 'bld-kastil')!;
  const validKastil: PlacedShape[] = kastil.starterBlueprint!.map((s, i) => ({
    ...s,
    id: `k-${i}`,
  }));
  assert.equal(validateBuildingChallenge(kastil, validKastil).passed, true);

  // Only 2 distinct shape types should fail Kastil
  const fewTypes = validKastil.map((s) => ({ ...s, type: 'persegi' as const }));
  assert.equal(validateBuildingChallenge(kastil, fewTypes).passed, false);
});

test('loadProgress migrates v1 and v2 localStorage seamlessly without losing prior stars, XP, or buildings', () => {
  const legacyV1Data = {
    profile: { name: 'Sinta', avatar: 'roket' },
    sound: { enabled: true, volume: 0.8 },
    lastWorld: 'practice',
    hasStarted: true,
    learnCompleted: ['mod-1-shapes', 'mod-2-abcd'],
    practiceStars: { 'practice-1': 3 },
    puzzleStars: { 'puzzle-1': 2 },
    challengeStars: {},
    xp: 280,
  };
  const mockStoreV1 = {
    getItem(key: string) {
      return key === 'math_grid_adventure_progress_v1' ? JSON.stringify(legacyV1Data) : null;
    },
  };
  const migratedV1 = loadProgress(mockStoreV1);
  assert.equal(migratedV1.profile.name, 'Sinta');
  assert.equal(migratedV1.learnCompleted.length, 2);
  assert.equal(migratedV1.practiceStars['practice-1'], 3);
  assert.equal(migratedV1.xp, 280);
  assert.deepEqual(migratedV1.buildingStars, {});
  assert.deepEqual(migratedV1.savedBuildings, []);
  assert.deepEqual(migratedV1.draftBuildings, {});

  const legacyV2Data = {
    ...legacyV1Data,
    schemaVersion: 2,
    savedBuildings: [
      { id: 'old-b1', name: 'Rumah Lama', locationId: 'geometry-village', createdAt: 1000, shapes: [] },
    ],
  };
  const mockStoreV2 = {
    getItem(key: string) {
      return key === 'math_grid_adventure_progress_v2' ? JSON.stringify(legacyV2Data) : null;
    },
  };
  const migratedV2 = loadProgress(mockStoreV2);
  assert.equal(migratedV2.schemaVersion, 3);
  assert.equal(migratedV2.savedBuildings.length, 1);
  assert.equal(migratedV2.savedBuildings[0].updatedAt, 1000);
});

test('Location unlock, Treasure Chest readiness, and Building achievements work deterministically', () => {
  const base = structuredClone(DEFAULT_PROGRESS);
  assert.equal(isLocationUnlocked('geometry-village', base), true);
  assert.equal(isLocationUnlocked('creative-zone', base), true);
  assert.equal(isLocationUnlocked('shape-city', base), false);
  assert.equal(isChestReady('chest-village-starter', base), false);

  const afterRumah = {
    ...base,
    buildingStars: { 'bld-rumah': 3 },
    savedBuildings: [
      {
        id: 'sb-1',
        name: 'Rumahku',
        locationId: 'geometry-village' as const,
        createdAt: 1,
        updatedAt: 1,
        shapes: [],
      },
    ],
    openedChests: ['chest-village-starter'],
  };
  assert.equal(isLocationUnlocked('shape-city', afterRumah), true);
  assert.equal(isChestReady('chest-village-starter', afterRumah), true);
  assert.equal(getTotalStars(afterRumah), 3 + 3); // 3 from bld-rumah + 3 from chest
  const ach = getUnlockedAchievementIds(afterRumah);
  assert.ok(ach.has('ach-village-architect'));
  assert.ok(ach.has('ach-creative-artist'));
  assert.ok(ach.has('ach-treasure-hunter'));
});

test('validateBuildingChallenge validates Rumah Sakit, Menara, Jembatan, and Creative mode', () => {
  for (const id of ['bld-rumah-sakit', 'bld-menara', 'bld-jembatan'] as const) {
    const ch = BUILDING_CHALLENGES.find((c) => c.id === id)!;
    const valid: PlacedShape[] = ch.starterBlueprint!.map((s, i) => ({
      ...s,
      id: `${id}-${i}`,
    }));
    assert.equal(validateBuildingChallenge(ch, valid).passed, true, `${id} blueprint should pass`);
    assert.equal(validateBuildingChallenge(ch, []).passed, false, `${id} empty should fail`);
  }

  const creative = BUILDING_CHALLENGES.find((c) => c.id === 'bld-creative')!;
  assert.equal(validateBuildingChallenge(creative, []).passed, false);
  assert.equal(
    validateBuildingChallenge(creative, [
      { id: '1', type: 'persegi', cx: 3, cy: 4, width: 2, height: 2, rotation: 0, color: '#0D9488' },
      { id: '2', type: 'segitiga', cx: 6, cy: 4, width: 2, height: 2, rotation: 0, color: '#EA580C' },
      { id: '3', type: 'lingkaran', cx: 9, cy: 4, width: 2, height: 2, radius: 1, rotation: 0, color: '#FBBF24' },
    ]).passed,
    true
  );
});

test('resetProgress clears v3, v2, and v1 storage keys and restores default state cleanly', () => {
  const storeData = new Map<string, string>([
    ['math_grid_adventure_progress_v1', '{"xp":500}'],
    ['math_grid_adventure_progress_v2', '{"xp":999,"hasStarted":true}'],
    [STORAGE_KEY_V3, '{"xp":1200,"hasStarted":true}'],
  ]);
  const mockStore = {
    getItem(k: string) {
      return storeData.get(k) ?? null;
    },
    setItem(k: string, v: string) {
      storeData.set(k, v);
    },
    removeItem(k: string) {
      storeData.delete(k);
    },
  };

  const reset = resetProgress(mockStore);
  assert.equal(storeData.has('math_grid_adventure_progress_v1'), false);
  assert.equal(storeData.has('math_grid_adventure_progress_v2'), false);
  assert.equal(reset.xp, 0);
  assert.equal(reset.hasStarted, false);
  assert.equal(getTotalStars(reset), 0);
  const reloaded = loadProgress(mockStore);
  assert.equal(reloaded.xp, 0);
  assert.equal(reloaded.sound.musicEnabled, true);
});

test('saveProgress returns accurate SaveWriteResult on success and storage quota failure', () => {
  const store = new Map<string, string>();
  const okRes = saveProgress(DEFAULT_PROGRESS, {
    setItem(k, v) {
      store.set(k, v);
    },
  });
  assert.equal(okRes.ok, true);
  assert.equal(typeof okRes.savedAt, 'number');
  assert.ok(store.has(STORAGE_KEY_V3));

  const failRes = saveProgress(DEFAULT_PROGRESS, {
    setItem() {
      throw new Error('QuotaExceededError');
    },
  });
  assert.equal(failRes.ok, false);
  assert.ok(failRes.error?.includes('QuotaExceededError'));
});

test('hasExistingProgress & My Buildings helpers (upsert, rename, duplicate) work reliably', () => {
  const fresh = structuredClone(DEFAULT_PROGRESS);
  assert.equal(hasExistingProgress(fresh), false);

  const withDraft = {
    ...fresh,
    draftBuildings: {
      'bld-rumah': [
        { id: '1', type: 'persegi' as const, cx: 4, cy: 4, width: 2, height: 2, rotation: 0, color: '#0D9488' },
      ],
    },
  };
  assert.equal(hasExistingProgress(withDraft), true);

  const b1: SavedBuilding = {
    id: 'b-1',
    name: 'Istana Persegi',
    locationId: 'geometry-village',
    createdAt: 100,
    updatedAt: 100,
    shapes: withDraft.draftBuildings['bld-rumah'],
  };
  let list = upsertSavedBuilding([], b1);
  assert.equal(list.length, 1);

  // Update existing id preserves createdAt and updates shapes/updatedAt
  list = upsertSavedBuilding(list, { ...b1, name: 'Istana Baru', updatedAt: 200 });
  assert.equal(list.length, 1);
  assert.equal(list[0].createdAt, 100);
  assert.equal(list[0].updatedAt, 200);
  assert.equal(list[0].name, 'Istana Baru');

  // Rename
  list = renameSavedBuilding(list, 'b-1', 'Rumah Impian', 300);
  assert.equal(list[0].name, 'Rumah Impian');
  assert.equal(list[0].updatedAt, 300);

  // Duplicate
  list = duplicateSavedBuilding(list, 'b-1', 400);
  assert.equal(list.length, 2);
  assert.equal(list[0].name, 'Rumah Impian (Salinan)');
  assert.notEqual(list[0].id, 'b-1');
});


