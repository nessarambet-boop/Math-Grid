import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Eraser,
  Lightbulb,
  MousePointerClick,
  SquareDashedMousePointer,
  Star,
} from 'lucide-react';
import { PUZZLE_LEVELS } from '../game/curriculumData';
import {
  analyzeGridSelection,
  calculateStars,
  validatePuzzleLevel,
} from '../game/gridMath';
import { sfx } from '../game/sound';
import type { GridCoord, TutorMood, ValidationResult } from '../game/types';
import { InteractiveGrid, type GridDrawMode } from './InteractiveGrid';
import { TutorGuideBar } from './TutorRobot';

interface PuzzleWorldProps {
  puzzleStars: Record<string, number>;
  onRecordStars: (puzzleId: string, stars: number) => void;
  onGoChallenge: () => void;
}

export const PuzzleWorld: React.FC<PuzzleWorldProps> = ({
  puzzleStars,
  onRecordStars,
  onGoChallenge,
}) => {
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const puzzle = PUZZLE_LEVELS[puzzleIdx];

  const [selectedCells, setSelectedCells] = useState<GridCoord[]>(puzzle.lockedCells);
  const [drawMode, setDrawMode] = useState<GridDrawMode>('toggle');
  const [attempts, setAttempts] = useState(0);
  const [hintTier, setHintTier] = useState(0);
  const [feedback, setFeedback] = useState<ValidationResult | null>(null);
  const [earnedStars, setEarnedStars] = useState<number | null>(null);

  const analysis = useMemo(() => analyzeGridSelection(selectedCells), [selectedCells]);

  const selectPuzzle = (idx: number) => {
    sfx.click();
    const target = PUZZLE_LEVELS[idx];
    setPuzzleIdx(idx);
    setSelectedCells(target.lockedCells);
    // Puzzle 4 needs two separate squares, so toggle mode is most natural; others work great with either
    setDrawMode(target.puzzleRule === 'twin_squares_cover_markers' ? 'toggle' : 'toggle');
    setAttempts(0);
    setHintTier(0);
    setFeedback(null);
    setEarnedStars(null);
  };

  const handleCheck = () => {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    const result = validatePuzzleLevel(puzzle, selectedCells);
    setFeedback(result);

    if (result.passed) {
      const stars = calculateStars(nextAttempts, hintTier > 0);
      setEarnedStars(stars);
      onRecordStars(puzzle.id, stars);
      sfx.victory();
    } else {
      sfx.error();
    }
  };

  const handleReset = () => {
    sfx.tileErase();
    setSelectedCells(puzzle.lockedCells);
    setFeedback(null);
  };

  const handleNextHint = () => {
    sfx.click();
    setHintTier((t) => Math.min(puzzle.hints.length, t + 1));
  };

  const tutorMood: TutorMood = feedback?.passed
    ? 'celebrate'
    : feedback && !feedback.passed
    ? 'encourage'
    : hintTier > 0
    ? 'thinking'
    : 'guide';

  const tutorMessage = feedback?.passed
    ? feedback.feedbackDetail
    : hintTier > 0
    ? `Petunjuk ${hintTier}: ${puzzle.hints[hintTier - 1]}`
    : feedback && !feedback.passed
    ? feedback.feedbackDetail
    : puzzle.tutorIntro;

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6 space-y-4">
      <TutorGuideBar mood={tutorMood} message={tutorMessage} />

      {/* Puzzle Stepper + Mode */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {PUZZLE_LEVELS.map((p, i) => {
            const stars = puzzleStars[p.id] ?? 0;
            const active = i === puzzleIdx;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => selectPuzzle(i)}
                className={`min-h-[40px] inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
                  active
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : stars > 0
                    ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="font-mono-num">P{i + 1}</span>
                {stars > 0 && (
                  <Star
                    className={`h-3.5 w-3.5 ${
                      active
                        ? 'fill-slate-900 text-slate-900'
                        : 'fill-amber-400 text-amber-500'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              sfx.click();
              setDrawMode('toggle');
            }}
            className={`min-h-[38px] inline-flex items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              drawMode === 'toggle'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MousePointerClick className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Ketuk Petak</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sfx.click();
              setDrawMode('rect');
            }}
            className={`min-h-[38px] inline-flex items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              drawMode === 'rect'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SquareDashedMousePointer className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Tarik Kotak</span>
          </button>
        </div>
      </div>

      {/* Main Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 rounded-3xl border-2 border-amber-200 bg-white p-4 sm:p-5 shadow-sm flex flex-col items-center">
          <InteractiveGrid
            cols={puzzle.gridCols}
            rows={puzzle.gridRows}
            selectedCells={selectedCells}
            onChangeCells={(next) => {
              setSelectedCells(next);
              if (feedback) setFeedback(null);
            }}
            lockedCells={puzzle.lockedCells}
            obstacleCells={puzzle.obstacleCells}
            targetMarkers={puzzle.targetMarkers}
            fountainCell={puzzle.fountainCell}
            drawMode={drawMode}
            accentColor="amber"
            testId="puzzle-grid"
          />

          {/* Compact Visual Legend when relevant */}
          {(puzzle.lockedCells.length > 0 ||
            puzzle.obstacleCells.length > 0 ||
            puzzle.targetMarkers.length > 0 ||
            puzzle.fountainCell) && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600">
              {puzzle.lockedCells.length > 0 && <span>Petak Emas = Terkunci</span>}
              {puzzle.obstacleCells.length > 0 && <span>Batu Abu = Rintangan</span>}
              {puzzle.fountainCell && <span>Lingkaran Biru = Air Mancur</span>}
              {puzzle.targetMarkers.length > 0 && <span>Belah Ketupat = Kristal</span>}
            </div>
          )}
        </div>

        <aside className="lg:col-span-5 rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <div className="text-xs font-bold text-amber-700">{puzzle.title}</div>
            <p className="mt-1 text-sm text-slate-600">{puzzle.story}</p>
            <h2 className="mt-2 font-display text-xl font-bold text-slate-900 leading-snug">
              {puzzle.instruction}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-center">
            <div>
              <div className="text-xs font-bold text-slate-500">Petak Terpilih</div>
              <div className="font-mono-num text-lg font-bold text-slate-900">
                {analysis.count}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500">Keliling Total</div>
              <div className="font-mono-num text-lg font-bold text-orange-700">
                {analysis.perimeter}
              </div>
            </div>
          </div>

          {feedback && (
            <div
              role="status"
              className={`rounded-2xl border-2 p-4 ${
                feedback.passed
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                  : 'border-rose-300 bg-rose-50 text-rose-950'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-display text-lg font-bold">
                  {feedback.feedbackTitle}
                </div>
                {earnedStars !== null && (
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`h-5 w-5 ${
                          s <= earnedStars
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm leading-snug">{feedback.feedbackDetail}</p>
            </div>
          )}

          <div className="space-y-2.5 pt-1">
            {!feedback?.passed ? (
              <>
                <button
                  type="button"
                  onClick={handleCheck}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-3 text-base font-bold text-white shadow-sm hover:bg-teal-700 cursor-pointer"
                >
                  <Check className="h-5 w-5" aria-hidden="true" />
                  <span>Periksa Puzzle</span>
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleNextHint}
                    disabled={hintTier >= puzzle.hints.length}
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border-2 border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900 hover:bg-amber-100 disabled:opacity-50 cursor-pointer"
                  >
                    <Lightbulb className="h-4 w-4" aria-hidden="true" />
                    <span>
                      Petunjuk ({hintTier}/{puzzle.hints.length})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <Eraser className="h-4 w-4" aria-hidden="true" />
                    <span>Ulangi Papan</span>
                  </button>
                </div>
              </>
            ) : puzzleIdx < PUZZLE_LEVELS.length - 1 ? (
              <button
                type="button"
                onClick={() => selectPuzzle(puzzleIdx + 1)}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-base font-bold text-slate-950 shadow-sm hover:bg-amber-400 cursor-pointer"
              >
                <span>Lanjut Puzzle {puzzleIdx + 2}</span>
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onGoChallenge}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 py-3 text-base font-bold text-white shadow-sm hover:bg-orange-700 cursor-pointer"
              >
                <span>Masuk ke Challenge World</span>
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
