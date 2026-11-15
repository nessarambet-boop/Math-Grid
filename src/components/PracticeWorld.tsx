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
import { PRACTICE_TASKS } from '../game/curriculumData';
import {
  analyzeGridSelection,
  calculateStars,
  validatePracticeTask,
} from '../game/gridMath';
import { sfx } from '../game/sound';
import type { GridCoord, TutorMood, ValidationResult } from '../game/types';
import { InteractiveGrid, type GridDrawMode } from './InteractiveGrid';
import { TutorGuideBar } from './TutorRobot';

interface PracticeWorldProps {
  practiceStars: Record<string, number>;
  onRecordStars: (taskId: string, stars: number) => void;
  onGoPuzzle: () => void;
}

export const PracticeWorld: React.FC<PracticeWorldProps> = ({
  practiceStars,
  onRecordStars,
  onGoPuzzle,
}) => {
  const [levelIdx, setLevelIdx] = useState(0);
  const task = PRACTICE_TASKS[levelIdx];

  const [selectedCells, setSelectedCells] = useState<GridCoord[]>([]);
  const [drawMode, setDrawMode] = useState<GridDrawMode>('rect');
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<ValidationResult | null>(null);
  const [earnedStars, setEarnedStars] = useState<number | null>(null);

  const analysis = useMemo(() => analyzeGridSelection(selectedCells), [selectedCells]);

  const selectLevel = (idx: number) => {
    sfx.click();
    setLevelIdx(idx);
    setSelectedCells([]);
    setAttempts(0);
    setShowHint(false);
    setFeedback(null);
    setEarnedStars(null);
  };

  const handleCheck = () => {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    const result = validatePracticeTask(task, selectedCells);
    setFeedback(result);

    if (result.passed) {
      const stars = calculateStars(nextAttempts, showHint);
      setEarnedStars(stars);
      onRecordStars(task.id, stars);
      sfx.victory();
    } else {
      sfx.error();
    }
  };

  const handleClear = () => {
    sfx.tileErase();
    setSelectedCells([]);
    setFeedback(null);
  };

  const tutorMood: TutorMood = feedback?.passed
    ? 'celebrate'
    : feedback && !feedback.passed
    ? 'encourage'
    : showHint
    ? 'thinking'
    : 'guide';

  const tutorMessage = feedback?.passed
    ? feedback.feedbackDetail
    : showHint
    ? `Petunjuk HIGAYON: ${task.hint}`
    : feedback && !feedback.passed
    ? feedback.feedbackDetail
    : task.tutorIntro;

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6 space-y-4">
      <TutorGuideBar mood={tutorMood} message={tutorMessage} />

      {/* Level Selector Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {PRACTICE_TASKS.map((t, i) => {
            const stars = practiceStars[t.id] ?? 0;
            const active = i === levelIdx;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => selectLevel(i)}
                className={`min-h-[40px] inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
                  active
                    ? 'bg-sky-600 text-white shadow-sm'
                    : stars > 0
                    ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="font-mono-num">L{i + 1}</span>
                {stars > 0 && (
                  <Star
                    className={`h-3.5 w-3.5 ${
                      active
                        ? 'fill-amber-300 text-amber-300'
                        : 'fill-amber-400 text-amber-500'
                    }`}
                    aria-label={`${stars} bintang`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Draw Mode Switch */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
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
        </div>
      </div>

      {/* Main Split: SVG Grid + Task & Live Telemetry Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 rounded-3xl border-2 border-sky-200 bg-white p-4 sm:p-5 shadow-sm flex flex-col items-center">
          <InteractiveGrid
            cols={task.gridCols}
            rows={task.gridRows}
            selectedCells={selectedCells}
            onChangeCells={(next) => {
              setSelectedCells(next);
              if (feedback) setFeedback(null);
            }}
            drawMode={drawMode}
            accentColor="sky"
            testId="practice-grid"
          />

          <p className="mt-2.5 text-xs font-medium text-slate-500 text-center">
            {drawMode === 'rect'
              ? 'Sentuh dan tarik dari satu petak ke petak lainnya untuk langsung membentuk kotak.'
              : 'Ketuk atau seret petak satu per satu untuk mewarnai atau menghapus.'}
          </p>
        </div>

        <aside className="lg:col-span-5 rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <div className="text-xs font-bold text-sky-700">{task.title}</div>
            <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {task.instruction}
            </h2>
          </div>

          {/* Live Shape & Measurement Inspector */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-600">Bentuk Terdeteksi</span>
              <span className="font-display font-bold text-slate-900">
                {analysis.shapeLabel}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="rounded-xl bg-white border border-slate-200 p-2.5">
                <div className="text-[11px] font-bold text-slate-500">Ukuran</div>
                <div className="font-mono-num text-base font-bold text-slate-900">
                  {analysis.count > 0 ? `${analysis.width}×${analysis.height}` : '0×0'}
                </div>
              </div>
              <div className="rounded-xl bg-white border border-slate-200 p-2.5">
                <div className="text-[11px] font-bold text-slate-500">Luas</div>
                <div className="font-mono-num text-base font-bold text-teal-700">
                  {analysis.area}
                </div>
              </div>
              <div className="rounded-xl bg-white border border-slate-200 p-2.5">
                <div className="text-[11px] font-bold text-slate-500">Keliling</div>
                <div className="font-mono-num text-base font-bold text-orange-700">
                  {analysis.perimeter}
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Banner */}
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

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            {!feedback?.passed ? (
              <>
                <button
                  type="button"
                  onClick={handleCheck}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-3 text-base font-bold text-white shadow-sm hover:bg-teal-700 cursor-pointer"
                >
                  <Check className="h-5 w-5" aria-hidden="true" />
                  <span>Periksa Jawaban</span>
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      sfx.click();
                      setShowHint(true);
                    }}
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border-2 border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900 hover:bg-amber-100 cursor-pointer"
                  >
                    <Lightbulb className="h-4 w-4" aria-hidden="true" />
                    <span>Petunjuk</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClear}
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <Eraser className="h-4 w-4" aria-hidden="true" />
                    <span>Bersihkan</span>
                  </button>
                </div>
              </>
            ) : levelIdx < PRACTICE_TASKS.length - 1 ? (
              <button
                type="button"
                onClick={() => selectLevel(levelIdx + 1)}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-base font-bold text-white shadow-sm hover:bg-sky-700 cursor-pointer"
              >
                <span>Lanjut Level {levelIdx + 2}</span>
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onGoPuzzle}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-base font-bold text-slate-950 shadow-sm hover:bg-amber-400 cursor-pointer"
              >
                <span>Masuk ke Puzzle World</span>
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
