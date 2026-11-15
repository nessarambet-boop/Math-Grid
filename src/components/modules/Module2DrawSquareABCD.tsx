import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Lightbulb,
  Play,
  Redo2,
  RotateCcw,
  Trash2,
  Undo2,
} from 'lucide-react';
import {
  analyzeGeometryPolygon,
  sameVertex,
  segmentKey,
  validateSquareABCD,
  type GridSegment,
  type VertexCoord,
} from '../../game/geometryMath';
import { sfx } from '../../game/sound';
import type { ValidationResult } from '../../game/types';
import { GeometryGrid, type LabeledPoint } from '../GeometryGrid';
import { TutorGuideBar } from '../TutorRobot';

interface Module2Props {
  isCompleted: boolean;
  onComplete: () => void;
}

const DEMO_SEGMENTS: GridSegment[] = [
  { id: 'demo-ab', a: { x: 2, y: 2 }, b: { x: 4, y: 2 } },
  { id: 'demo-bc', a: { x: 4, y: 2 }, b: { x: 4, y: 4 } },
  { id: 'demo-ad', a: { x: 2, y: 2 }, b: { x: 2, y: 4 } },
  { id: 'demo-dc', a: { x: 2, y: 4 }, b: { x: 4, y: 4 } },
];

const DEMO_LABELS: LabeledPoint[] = [
  { coord: { x: 2, y: 2 }, label: 'A', color: '#0D9488' },
  { coord: { x: 4, y: 2 }, label: 'B', color: '#0D9488' },
  { coord: { x: 4, y: 4 }, label: 'C', color: '#0D9488' },
  { coord: { x: 2, y: 4 }, label: 'D', color: '#0D9488' },
];

const STEPS = [
  '1. Gambarkan garis AB sepanjang 2 cm (2 petak mendatar).',
  '2. Gambarkan garis BC tegak lurus terhadap AB dan sepanjang 2 cm.',
  '3. Gambarkan garis AD tegak lurus terhadap AB dan sepanjang 2 cm.',
  '4. Hubungkan titik D dengan C hingga membentuk Persegi ABCD!',
];

export const Module2DrawSquareABCD: React.FC<Module2Props> = ({
  isCompleted,
  onComplete,
}) => {
  const [history, setHistory] = useState<GridSegment[][]>([[]]);
  const [histIdx, setHistIdx] = useState(0);
  const segments = history[histIdx];

  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ValidationResult | null>(null);
  const [showHint, setShowHint] = useState(false);

  // Step-by-step animation mode
  const [demoStep, setDemoStep] = useState<number>(0); // 0 = off, 1..4 = step visible
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!isAnimating) return;
    const timer = window.setInterval(() => {
      setDemoStep((prev) => {
        if (prev < 4) {
          sfx.step();
          return prev + 1;
        }
        setIsAnimating(false);
        sfx.success();
        return prev;
      });
    }, 1100);
    return () => window.clearInterval(timer);
  }, [isAnimating]);

  const pushSegments = (next: GridSegment[]) => {
    const sliced = history.slice(0, histIdx + 1);
    sliced.push(next);
    setHistory(sliced);
    setHistIdx(sliced.length - 1);
    setFeedback(null);
  };

  const handleAddSegment = (a: VertexCoord, b: VertexCoord) => {
    if (isAnimating || demoStep > 0) {
      setIsAnimating(false);
      setDemoStep(0);
    }
    const key = segmentKey(a, b);
    if (segments.some((s) => segmentKey(s.a, s.b) === key)) {
      sfx.error();
      return;
    }
    sfx.tileTap(segments.length);
    const id = `seg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    pushSegments([...segments, { id, a, b }]);
  };

  const handleDeleteSelected = () => {
    if (!selectedSegmentId) return;
    sfx.tileErase();
    pushSegments(segments.filter((s) => s.id !== selectedSegmentId));
    setSelectedSegmentId(null);
  };

  const activeSegments = demoStep > 0 ? DEMO_SEGMENTS.slice(0, demoStep) : segments;
  const analysis = useMemo(() => analyzeGeometryPolygon(activeSegments), [activeSegments]);

  const labeledPoints: LabeledPoint[] = useMemo(() => {
    if (demoStep > 0) {
      const count = demoStep === 1 ? 2 : demoStep === 2 ? 3 : 4;
      return DEMO_LABELS.slice(0, count);
    }
    // Label discovered unique vertices A, B, C, D in order drawn
    const unique: VertexCoord[] = [];
    for (const seg of segments) {
      if (!unique.some((u) => sameVertex(u, seg.a))) unique.push(seg.a);
      if (!unique.some((u) => sameVertex(u, seg.b))) unique.push(seg.b);
    }
    const letters = ['A', 'B', 'C', 'D'];
    return unique.slice(0, 4).map((coord, idx) => ({
      coord,
      label: letters[idx],
      color: '#0D9488',
    }));
  }, [demoStep, segments]);

  const rightAngleCorners = useMemo(() => {
    if (demoStep >= 2 && demoStep <= 4) {
      const list = [{ vertex: { x: 4, y: 2 }, prev: { x: 2, y: 2 }, next: { x: 4, y: 4 } }];
      if (demoStep >= 3) {
        list.push({ vertex: { x: 2, y: 2 }, prev: { x: 4, y: 2 }, next: { x: 2, y: 4 } });
      }
      if (demoStep >= 4) {
        list.push(
          { vertex: { x: 4, y: 4 }, prev: { x: 4, y: 2 }, next: { x: 2, y: 4 } },
          { vertex: { x: 2, y: 4 }, prev: { x: 2, y: 2 }, next: { x: 4, y: 4 } }
        );
      }
      return list;
    }
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
  }, [demoStep, analysis]);

  const handleCheck = () => {
    setDemoStep(0);
    setIsAnimating(false);
    const res = validateSquareABCD(segments);
    setFeedback(res);
    if (res.passed) {
      sfx.victory();
      onComplete();
    } else {
      sfx.error();
    }
  };

  return (
    <div className="space-y-4">
      <TutorGuideBar
        mood={feedback?.passed || isCompleted ? 'celebrate' : 'guide'}
        message={
          feedback?.feedbackDetail ??
          (demoStep > 0
            ? `Animasi Langkah ${demoStep}: ${STEPS[demoStep - 1]}`
            : showHint
            ? 'Petunjuk: Mulai dari titik (2,2) ke (4,2) untuk garis AB = 2 cm, lalu ke bawah 2 petak untuk BC dan AD, terakhir hubungkan D ke C!'
            : 'Modul 2 · Gambarlah Persegi ABCD dengan panjang setiap sisi 2 cm (2 petak grid). Kamu bisa menonton animasinya dulu atau langsung menggambar!')
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 rounded-3xl border-2 border-sky-200 bg-white p-4 sm:p-5 shadow-sm flex flex-col items-center">
          {/* Toolbar: Undo, Redo, Delete Selected, Reset */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex flex-wrap items-center gap-1.5">
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
                  onClick={handleDeleteSelected}
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
                  setDemoStep(0);
                  setIsAnimating(false);
                  setSelectedSegmentId(null);
                  pushSegments([]);
                }}
                className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Reset</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                sfx.click();
                setDemoStep(1);
                setIsAnimating(true);
              }}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-amber-500 px-3 text-xs font-bold text-slate-950 hover:bg-amber-400 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-slate-950" aria-hidden="true" />
              <span>Animasi Langkah</span>
            </button>
          </div>

          <GeometryGrid
            cols={6}
            rows={6}
            mode="draw-lines"
            segments={activeSegments}
            onAddSegment={handleAddSegment}
            selectedSegmentId={selectedSegmentId}
            onSelectSegment={setSelectedSegmentId}
            labeledPoints={labeledPoints}
            rightAngleCorners={rightAngleCorners}
            showEdgeLengths
            unitLabel="1 satuan grid = 1 cm"
            testId="square-abcd-grid"
          />

          {demoStep > 0 && (
            <button
              type="button"
              onClick={() => {
                setIsAnimating(false);
                setDemoStep(0);
              }}
              className="mt-2.5 text-xs font-bold text-teal-700 underline cursor-pointer"
            >
              Tutup Animasi &amp; Kembali ke Gambarku
            </button>
          )}
        </div>

        <aside className="lg:col-span-5 rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <div className="text-xs font-bold text-sky-700">
              Modul 2 · Menggambar Persegi ABCD
            </div>
            <h2 className="mt-1 font-display text-xl font-bold text-slate-900">
              Langkah Menggambar Persegi 2 cm
            </h2>
          </div>

          <ol className="space-y-2 text-sm">
            {STEPS.map((stepText, idx) => {
              const active = demoStep === idx + 1;
              return (
                <li
                  key={stepText}
                  className={`rounded-xl border px-3 py-2 font-medium transition ${
                    active
                      ? 'border-amber-400 bg-amber-50 text-amber-950 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  {stepText}
                </li>
              );
            })}
          </ol>

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
              <span>Periksa Persegi ABCD</span>
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
