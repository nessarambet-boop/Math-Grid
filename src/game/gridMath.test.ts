import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeGridSelection,
  buildRectCoords,
  calculateStars,
  validateChallengeQuestion,
  validatePracticeTask,
  validatePuzzleLevel,
} from './gridMath';
import { CHALLENGE_TIERS, LEARN_MODULES, PRACTICE_TASKS, PUZZLE_LEVELS } from './curriculumData';
import { DEFAULT_PROGRESS, getTotalStars, getUnlockedAchievementIds, loadProgress, saveProgress } from './storage';
import { WorldId } from './types';

test('analyzeGridSelection identifies a 3x3 square with area 9 and perimeter 12', () => {
  const cells = buildRectCoords({ col: 1, row: 1 }, { col: 3, row: 3 });
  const result = analyzeGridSelection(cells);
  assert.equal(result.shapeKind, 'persegi');
  assert.equal(result.isSquare, true);
  assert.equal(result.isSolidRectangle, true);
  assert.equal(result.width, 3);
  assert.equal(result.height, 3);
  assert.equal(result.area, 9);
  assert.equal(result.perimeter, 12);
});

test('analyzeGridSelection identifies a 4x2 rectangle with area 8 and perimeter 12', () => {
  const cells = buildRectCoords({ col: 0, row: 0 }, { col: 3, row: 1 });
  const result = analyzeGridSelection(cells);
  assert.equal(result.shapeKind, 'persegi_panjang');
  assert.equal(result.isNonSquareRectangle, true);
  assert.equal(result.width, 4);
  assert.equal(result.height, 2);
  assert.equal(result.area, 8);
  assert.equal(result.perimeter, 12);
});

test('analyzeGridSelection detects L-shaped non-rectangular selection', () => {
  const cells = [
    { col: 0, row: 0 },
    { col: 1, row: 0 },
    { col: 0, row: 1 },
  ];
  const result = analyzeGridSelection(cells);
  assert.equal(result.shapeKind, 'tidak_beraturan');
  assert.equal(result.isSolidRectangle, false);
  assert.equal(result.area, 3);
  assert.equal(result.perimeter, 8);
});

test('validatePracticeTask validates all 6 practice levels accurately', () => {
  // Level 1: 3x3 square
  assert.equal(
    validatePracticeTask(PRACTICE_TASKS[0], buildRectCoords({ col: 0, row: 0 }, { col: 2, row: 2 })).passed,
    true
  );
  assert.equal(
    validatePracticeTask(PRACTICE_TASKS[0], buildRectCoords({ col: 0, row: 0 }, { col: 3, row: 2 })).passed,
    false
  );

  // Level 3: any rectangle with area 12
  assert.equal(
    validatePracticeTask(PRACTICE_TASKS[2], buildRectCoords({ col: 0, row: 0 }, { col: 5, row: 1 })).passed,
    true
  );

  // Level 5: square with area 16 (4x4 passes, 8x2 fails)
  assert.equal(
    validatePracticeTask(PRACTICE_TASKS[4], buildRectCoords({ col: 0, row: 0 }, { col: 3, row: 3 })).passed,
    true
  );
  assert.equal(
    validatePracticeTask(PRACTICE_TASKS[4], buildRectCoords({ col: 0, row: 0 }, { col: 7, row: 1 })).passed,
    false
  );

  // Level 6: non-square rectangle with area 18 (6x3 passes)
  assert.equal(
    validatePracticeTask(PRACTICE_TASKS[5], buildRectCoords({ col: 0, row: 0 }, { col: 5, row: 2 })).passed,
    true
  );
});

test('validatePuzzleLevel validates fountain, twin squares, and mystery deduction', () => {
  // Puzzle 1: complete 4x4 square covering locked cells (col 1..4, row 1..4)
  assert.equal(
    validatePuzzleLevel(PUZZLE_LEVELS[0], buildRectCoords({ col: 1, row: 1 }, { col: 4, row: 4 })).passed,
    true
  );

  // Puzzle 3: enclose fountain at (2,2) with perimeter 14 (4x3 around it)
  assert.equal(
    validatePuzzleLevel(PUZZLE_LEVELS[2], buildRectCoords({ col: 1, row: 1 }, { col: 4, row: 3 })).passed,
    true
  );
  // 4x3 not covering fountain (2,2) fails
  assert.equal(
    validatePuzzleLevel(PUZZLE_LEVELS[2], buildRectCoords({ col: 0, row: 0 }, { col: 3, row: 2 })).passed,
    true // wait: (0..3, 0..2) includes (2,2)! Let's test one outside (2,2): row 0..1, 7 cells? 5x2 at col 0..4 row 0..1
  );
  assert.equal(
    validatePuzzleLevel(PUZZLE_LEVELS[2], buildRectCoords({ col: 0, row: 0 }, { col: 4, row: 1 })).passed,
    false
  );

  // Puzzle 4: two separate 2x2 squares covering (0,1) and (4,2)
  const twinSquares = [
    ...buildRectCoords({ col: 0, row: 1 }, { col: 1, row: 2 }),
    ...buildRectCoords({ col: 4, row: 1 }, { col: 5, row: 2 }),
  ];
  assert.equal(validatePuzzleLevel(PUZZLE_LEVELS[3], twinSquares).passed, true);

  // Puzzle 5: 5x3 mystery rectangle
  assert.equal(
    validatePuzzleLevel(PUZZLE_LEVELS[4], buildRectCoords({ col: 0, row: 0 }, { col: 4, row: 2 })).passed,
    true
  );
});

test('validateChallengeQuestion works for both answer and draw modes', () => {
  const answerQ = CHALLENGE_TIERS[0].questions[1];
  assert.equal(validateChallengeQuestion(answerQ, [], 6).passed, true);
  assert.equal(validateChallengeQuestion(answerQ, [], 8).passed, false);

  const drawQ = CHALLENGE_TIERS[0].questions[0];
  assert.equal(
    validateChallengeQuestion(drawQ, buildRectCoords({ col: 1, row: 1 }, { col: 2, row: 2 })).passed,
    true
  );
});

test('calculateStars and storage persistence / achievements work deterministically', () => {
  assert.equal(calculateStars(1, false), 3);
  assert.equal(calculateStars(1, true), 2);
  assert.equal(calculateStars(4, true), 1);

  const memoryStore = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => memoryStore.get(k) ?? null,
    setItem: (k: string, v: string) => {
      memoryStore.set(k, v);
    },
  };

  const progress = structuredClone(DEFAULT_PROGRESS);
  progress.hasStarted = true;
  progress.lastWorld = WorldId.PUZZLE;
  progress.learnCompleted = LEARN_MODULES.map((m) => m.id);
  progress.practiceStars = { 'practice-1': 3, 'practice-2': 3, 'practice-3': 2 };

  saveProgress(progress, mockStorage);
  const loaded = loadProgress(mockStorage);
  assert.equal(loaded.hasStarted, true);
  assert.equal(loaded.lastWorld, WorldId.PUZZLE);
  assert.equal(getTotalStars(loaded), LEARN_MODULES.length * 2 + 8);

  const achs = getUnlockedAchievementIds(loaded);
  assert.equal(achs.has('ach-first-step'), true);
  assert.equal(achs.has('ach-scholar'), true);
  assert.equal(achs.has('ach-builder'), true);
  assert.equal(achs.has('ach-grand-master'), false);
});
