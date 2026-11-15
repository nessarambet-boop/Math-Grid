import React, { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  validateLineRelationTask,
  type GridSegment,
  type VertexCoord,
} from '../../game/geometryMath';
import { sfx } from '../../game/sound';
import type { ValidationResult } from '../../game/types';
import { GeometryGrid, type StyledSegment } from '../GeometryGrid';
import { TutorGuideBar } from '../TutorRobot';

interface Module5Props {
  isCompleted: boolean;
  onComplete: () => void;
}

const REF_PARALLEL: GridSegment = {
  id: 'ref-p',
  a: { x: 1, y: 2 },
  b: { x: 5, y: 2 },
};

const REF_PERP: GridSegment = {
  id: 'ref-t',
  a: { x: 1, y: 3 },
  b: { x: 5, y: 3 },
};

export const Module5ParallelPerpendicular: React.FC<Module5Props> = ({
  isCompleted,
  onComplete,
}) => {
  const [animPlaying, setAnimPlaying] = useState(true);
  const [animStep, setAnimStep] = useState(0); // 0 = parallel pair 1, 1 = parallel pair 2, 2 = perp corners

  const [taskMode, setTaskMode] = useState<'parallel' | 'perpendicular'>('parallel');
  const [userSegment, setUserSegment] = useState<GridSegment | null>(null);
  const [feedback, setFeedback] = useState<ValidationResult | null>(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (!animPlaying) return;
    const id = window.setInterval(() => {
      setAnimStep((s) => (s + 1) % 3);
    }, 1800);
    return () => window.clearInterval(id);
  }, [animPlaying]);

  const refSeg = taskMode === 'parallel' ? REF_PARALLEL : REF_PERP;

  const segments: StyledSegment[] = [
    { ...refSeg, color: '#0284C7', locked: true, parallelGroup: taskMode === 'parallel' ? 1 : undefined },
    ...(userSegment
      ? [
          {
            ...userSegment,
            color: taskMode === 'parallel' ? '#0D9488' : '#EA580C',
            parallelGroup: taskMode === 'parallel' ? (1 as const) : undefined,
          },
        ]
      : []),
  ];

  const handleAddSegment = (a: VertexCoord, b: VertexCoord) => {
    sfx.tileTap(2);
    setUserSegment({ id: 'user-line', a, b });
    setFeedback(null);
  };

  const handleCheck = () => {
    const res = validateLineRelationTask(taskMode, userSegment, refSeg);
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
          (showHint
            ? taskMode === 'parallel'
              ? 'Petunjuk: Garis acuan biru berjalan mendatar. Buatlah garis mendatar lainnya di baris berbeda agar sejajar!'
              : 'Petunjuk: Garis acuan biru mendatar. Buatlah garis vertikal (tegak dari atas ke bawah) untuk membentuk sudut 90°!'
            : 'Modul 5 · Pelajari perbedaan garis sejajar dan garis tegak lurus pada persegi & persegi panjang, lalu gambar garisnya di grid!')
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

      {/* Visual Animated Explainer */}
      <div className="rounded-3xl border-2 border-teal-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">
              5. Garis Sejajar &amp; Garis Tegak Lurus pada Persegi Panjang ABCD
            </h2>
            <p className="text-sm text-slate-600">
              Amati warna yang menyoroti pasangan sisi sejajar dan sudut 90° tegak lurus.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAnimPlaying((p) => !p)}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border-2 border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            {animPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Jeda</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Putar</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-5 flex flex-col items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <svg width="260" height="165" viewBox="0 0 260 165" role="img" aria-label="Animasi garis sejajar dan tegak lurus">
              {/* Rectangle ABCD */}
              {/* Top AB */}
              <line
                x1="55"
                y1="40"
                x2="205"
                y2="40"
                stroke={animStep === 0 ? '#0284C7' : animStep === 2 ? '#EA580C' : '#94A3B8'}
                strokeWidth={animStep === 0 || animStep === 2 ? 6 : 3}
                strokeLinecap="round"
              />
              {/* Bottom DC */}
              <line
                x1="55"
                y1="125"
                x2="205"
                y2="125"
                stroke={animStep === 0 ? '#0284C7' : '#94A3B8'}
                strokeWidth={animStep === 0 ? 6 : 3}
                strokeLinecap="round"
              />
              {/* Left AD */}
              <line
                x1="55"
                y1="40"
                x2="55"
                y2="125"
                stroke={animStep === 1 ? '#0D9488' : '#94A3B8'}
                strokeWidth={animStep === 1 ? 6 : 3}
                strokeLinecap="round"
              />
              {/* Right BC */}
              <line
                x1="205"
                y1="40"
                x2="205"
                y2="125"
                stroke={animStep === 1 ? '#0D9488' : animStep === 2 ? '#EA580C' : '#94A3B8'}
                strokeWidth={animStep === 1 || animStep === 2 ? 6 : 3}
                strokeLinecap="round"
              />

              {/* 90 deg corner marker at B when animStep === 2 */}
              {animStep === 2 && (
                <polyline
                  points="190,40 190,55 205,55"
                  fill="none"
                  stroke="#EA580C"
                  strokeWidth="3"
                />
              )}

              {/* Labels */}
              <text x="40" y="36" className="font-display text-sm font-bold fill-slate-800">A</text>
              <text x="213" y="36" className="font-display text-sm font-bold fill-slate-800">B</text>
              <text x="213" y="135" className="font-display text-sm font-bold fill-slate-800">C</text>
              <text x="40" y="135" className="font-display text-sm font-bold fill-slate-800">D</text>

              <text x="130" y="155" textAnchor="middle" className="font-display text-xs font-bold fill-slate-700">
                {animStep === 0
                  ? 'AB sejajar DC (AB // DC)'
                  : animStep === 1
                  ? 'AD sejajar BC (AD // BC)'
                  : 'AB tegak lurus BC (AB ⊥ BC · 90°)'}
              </text>
            </svg>
          </div>

          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-3.5">
              <div className="font-display font-bold text-sky-900">Garis Sejajar ( // )</div>
              <p className="mt-1 text-xs sm:text-sm text-slate-700 leading-snug">
                Dua garis yang berjarak sama dan <strong>tidak pernah berpotongan</strong> meskipun diperpanjang terus. Contoh: <strong>AB // DC</strong> dan <strong>AD // BC</strong>.
              </p>
            </div>
            <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-3.5">
              <div className="font-display font-bold text-orange-900">Garis Tegak Lurus ( ⊥ )</div>
              <p className="mt-1 text-xs sm:text-sm text-slate-700 leading-snug">
                Dua garis yang bertemu membentuk <strong>sudut siku-siku 90°</strong>. Contoh: <strong>AB ⊥ BC</strong>, <strong>BC ⊥ CD</strong>, <strong>CD ⊥ DA</strong>, dan <strong>DA ⊥ AB</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Practice Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 rounded-3xl border-2 border-sky-200 bg-white p-4 sm:p-5 shadow-sm flex flex-col items-center">
          <div className="w-full flex items-center justify-between gap-2 mb-3">
            <span className="font-display text-sm sm:text-base font-bold text-slate-900">
              Garis Biru = Acuan · Gambar 1 Garis di Grid
            </span>
            <button
              type="button"
              onClick={() => {
                sfx.tileErase();
                setUserSegment(null);
                setFeedback(null);
              }}
              className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>

          <GeometryGrid
            cols={6}
            rows={5}
            mode="draw-lines"
            segments={segments}
            onAddSegment={handleAddSegment}
            showEdgeLengths={false}
            unitLabel="Ketuk 2 titik untuk menggambar garis"
            testId="parallel-perp-grid"
          />
        </div>

        <aside className="lg:col-span-5 rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <div className="text-xs font-bold text-teal-700">Latihan Interaktif Modul 5</div>
            <h3 className="mt-1 font-display text-xl font-bold text-slate-900">
              {taskMode === 'parallel'
                ? 'Gambarlah Garis yang SEJAJAR dengan Garis Biru!'
                : 'Gambarlah Garis yang TEGAK LURUS (90°) terhadap Garis Biru!'}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                sfx.click();
                setTaskMode('parallel');
                setUserSegment(null);
                setFeedback(null);
                setShowHint(false);
              }}
              className={`min-h-[42px] rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
                taskMode === 'parallel'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              1. Garis Sejajar
            </button>
            <button
              type="button"
              onClick={() => {
                sfx.click();
                setTaskMode('perpendicular');
                setUserSegment(null);
                setFeedback(null);
                setShowHint(false);
              }}
              className={`min-h-[42px] rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
                taskMode === 'perpendicular'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              2. Garis Tegak Lurus
            </button>
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
              <span>Periksa Garis</span>
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
