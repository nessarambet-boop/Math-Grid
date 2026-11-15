import React, { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Lightbulb,
  Redo2,
  RotateCcw,
  Trash2,
  Undo2,
} from 'lucide-react';
import {
  analyzeGeometryPolygon,
  formatLengthCm,
  segmentKey,
  validateDrawRectangle,
  type GridSegment,
  type VertexCoord,
} from '../../game/geometryMath';
import { sfx } from '../../game/sound';
import type { ValidationResult } from '../../game/types';
import { GeometryGrid } from '../GeometryGrid';
import { TutorGuideBar } from '../TutorRobot';

interface Module3Props {
  isCompleted: boolean;
  onComplete: () => void;
}

const RECT_CHALLENGES = [
  { id: 'r1', label: 'Latihan A · 4 cm × 2 cm', long: 4, short: 2 },
  { id: 'r2', label: 'Latihan B · 5 cm × 3 cm', long: 5, short: 3 },
  { id: 'r3', label: 'Latihan C · 3 cm × 1 cm', long: 3, short: 1 },
];

export const Module3DrawRectangle: React.FC<Module3Props> = ({
  isCompleted,
  onComplete,
}) => {
  const [challengeIdx, setChallengeIdx] = useState(0);
  const currentTask = RECT_CHALLENGES[challengeIdx];

  const [history, setHistory] = useState<GridSegment[][]>([[]]);
  const [histIdx, setHistIdx] = useState(0);
  const segments = history[histIdx];
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ValidationResult | null>(null);
  const [showHint, setShowHint] = useState(false);

  const pushSegments = (next: GridSegment[]) => {
    const sliced = history.slice(0, histIdx + 1);
    sliced.push(next);
    setHistory(sliced);
    setHistIdx(sliced.length - 1);
    setFeedback(null);
  };

  const handleAddSegment = (a: VertexCoord, b: VertexCoord) => {
    const key = segmentKey(a, b);
    if (segments.some((s) => segmentKey(s.a, s.b) === key)) {
      sfx.error();
      return;
    }
    sfx.tileTap(segments.length);
    const id = `rseg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    pushSegments([...segments, { id, a, b }]);
  };

  const analysis = useMemo(() => analyzeGeometryPolygon(segments), [segments]);

  const rightAngleCorners = useMemo(() => {
    if (!analysis.isClosed || analysis.orderedVertices.length !== 4) return [];
    const v = analysis.orderedVertices;
    return v
      .map((pt, i) => ({
        isRight: analysis.rightAngleCorners[i],
        vertex: pt,
        prev: v[(i + 3) % 4],
        next: v[(i + 1) % 4],
      }))
      .filter((item) => item.isRight)
      .map(({ vertex, prev, next }) => ({ vertex, prev, next }));
  }, [analysis]);

  const handleCheck = () => {
    const res = validateDrawRectangle(segments, currentTask.long, currentTask.short);
    setFeedback(res);
    if (res.passed) {
      sfx.victory();
      onComplete();
    } else {
      sfx.error();
    }
  };

  const switchTask = (idx: number) => {
    sfx.click();
    setChallengeIdx(idx);
    setHistory([[]]);
    setHistIdx(0);
    setSelectedSegmentId(null);
    setFeedback(null);
    setShowHint(false);
  };

  return (
    <div className="space-y-4">
      <TutorGuideBar
        mood={feedback?.passed || isCompleted ? 'celebrate' : 'guide'}
        message={
          feedback?.feedbackDetail ??
          (showHint
            ? `Petunjuk: Tentukan titik awal di mana saja, buat garis panjang ${currentTask.long} cm, belok 90° sepanjang ${currentTask.short} cm, lalu tutup keempat sisinya!`
            : `Modul 3 · Gambarlah persegi panjang berukuran ${currentTask.long} cm × ${currentTask.short} cm di posisi mana saja pada grid (boleh mendatar atau tegak).`)
        }
        actionButton={
          isCompleted && (
            <div className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              <span>Modul Selesai</span>
            </div>
          )
        }
      />

      {/* Varied Sizes Selector */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {RECT_CHALLENGES.map((rc, i) => (
          <button
            key={rc.id}
            type="button"
            onClick={() => switchTask(i)}
            className={`min-h-[40px] flex-1 min-w-[150px] rounded-xl px-3 py-1.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
              i === challengeIdx
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {rc.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 rounded-3xl border-2 border-amber-200 bg-white p-4 sm:p-5 shadow-sm flex flex-col items-center">
          <div className="w-full flex flex-wrap items-center gap-1.5 mb-3">
            <button
              type="button"
              onClick={() => {
                if (histIdx > 0) {
                  sfx.click();
                  setHistIdx(histIdx - 1);
                  setFeedback(null);
                }
              }}
              disabled={histIdx === 0}
              className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <Undo2 className="h-4 w-4" aria-hidden="true" />
              <span>Undo</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (histIdx < history.length - 1) {
                  sfx.click();
                  setHistIdx(histIdx + 1);
                  setFeedback(null);
                }
              }}
              disabled={histIdx >= history.length - 1}
              className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <Redo2 className="h-4 w-4" aria-hidden="true" />
              <span>Redo</span>
            </button>
            {selectedSegmentId && (
              <button
                type="button"
                onClick={() => {
                  sfx.tileErase();
                  pushSegments(segments.filter((s) => s.id !== selectedSegmentId));
                  setSelectedSegmentId(null);
                }}
                className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-rose-300 bg-rose-50 px-2.5 text-xs font-bold text-rose-800 hover:bg-rose-100 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span>Hapus Garis</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                sfx.tileErase();
                setSelectedSegmentId(null);
                pushSegments([]);
              }}
              className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>

          <GeometryGrid
            cols={7}
            rows={6}
            mode="draw-lines"
            segments={segments}
            onAddSegment={handleAddSegment}
            selectedSegmentId={selectedSegmentId}
            onSelectSegment={setSelectedSegmentId}
            rightAngleCorners={rightAngleCorners}
            showEdgeLengths
            unitLabel="1 satuan grid = 1 cm"
            testId="draw-rectangle-grid"
          />
        </div>

        <aside className="lg:col-span-5 rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <div className="text-xs font-bold text-amber-700">
              Modul 3 · Menggambar Persegi Panjang
            </div>
            <h2 className="mt-1 font-display text-xl font-bold text-slate-900">
              Buat Persegi Panjang {currentTask.long} cm × {currentTask.short} cm
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
              Pastikan sisi yang berhadapan sama panjang, keempat titik sudut terhubung rapi, dan setiap sudut membentuk 90°.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Status Bangun</span>
              <span className="font-display font-bold text-slate-900">
                {analysis.shapeLabel}
              </span>
            </div>
            {analysis.isClosed && analysis.sideLengths.length === 4 && (
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Panjang Sisi</span>
                <span className="font-mono-num font-bold text-teal-700">
                  {analysis.sideLengths.map((l) => formatLengthCm(l)).join(' · ')}
                </span>
              </div>
            )}
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
              <div className="font-display text-lg font-bold">{feedback.feedbackTitle}</div>
              <p className="mt-1 text-xs sm:text-sm leading-snug">{feedback.feedbackDetail}</p>
            </div>
          )}

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleCheck}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-3 text-base font-bold text-white shadow-sm hover:bg-teal-700 cursor-pointer"
            >
              <Check className="h-5 w-5" aria-hidden="true" />
              <span>Periksa Persegi Panjang</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sfx.click();
                setShowHint(true);
              }}
              className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-900 hover:bg-amber-100 cursor-pointer"
            >
              <Lightbulb className="h-4 w-4" aria-hidden="true" />
              <span>Petunjuk HIGAYON</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
