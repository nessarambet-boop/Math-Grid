import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Lightbulb,
  Pause,
  Play,
  Redo2,
  RotateCcw,
  Undo2,
} from 'lucide-react';
import {
  analyzeGeometryPolygon,
  formatLengthCm,
  polygonEdgesFromVertices,
  type VertexCoord,
} from '../../game/geometryMath';
import { sfx } from '../../game/sound';
import { GeometryGrid } from '../GeometryGrid';
import { TutorGuideBar } from '../TutorRobot';

interface Module1Props {
  isCompleted: boolean;
  onComplete: () => void;
}

const INITIAL_GEOBOARD: VertexCoord[] = [
  { x: 1, y: 1 },
  { x: 4, y: 1 },
  { x: 4, y: 4 },
  { x: 1, y: 4 },
];

export const Module1UnderstandingShapes: React.FC<Module1Props> = ({
  isCompleted,
  onComplete,
}) => {
  const [history, setHistory] = useState<VertexCoord[][]>([INITIAL_GEOBOARD]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const vertices = history[historyIdx];

  // Animated comparison state (Square <-> Rectangle morph)
  const [animPlaying, setAnimPlaying] = useState(true);
  const [animPhase, setAnimPhase] = useState(0); // 0..3

  const [challengeTarget, setChallengeTarget] = useState<'persegi' | 'persegi_panjang'>(
    'persegi_panjang'
  );
  const [feedback, setFeedback] = useState<{ passed: boolean; title: string; detail: string } | null>(
    null
  );
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (!animPlaying) return;
    const id = window.setInterval(() => {
      setAnimPhase((p) => (p + 1) % 4);
    }, 1500);
    return () => window.clearInterval(id);
  }, [animPlaying]);

  const edges = useMemo(() => polygonEdgesFromVertices(vertices), [vertices]);
  const analysis = useMemo(() => analyzeGeometryPolygon(edges), [edges]);

  const rightAngles = useMemo(() => {
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

  const pushVertices = (next: VertexCoord[]) => {
    const nextHist = history.slice(0, historyIdx + 1);
    nextHist.push(next);
    setHistory(nextHist);
    setHistoryIdx(nextHist.length - 1);
    setFeedback(null);
  };

  const handleMoveVertex = (index: number, next: VertexCoord) => {
    const copy = vertices.map((v, i) => (i === index ? next : v));
    pushVertices(copy);
  };

  const handleUndo = () => {
    if (historyIdx > 0) {
      sfx.click();
      setHistoryIdx(historyIdx - 1);
      setFeedback(null);
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      sfx.click();
      setHistoryIdx(historyIdx + 1);
      setFeedback(null);
    }
  };

  const handleReset = () => {
    sfx.click();
    pushVertices(INITIAL_GEOBOARD);
    setShowHint(false);
  };

  const handleCheckGeoboard = () => {
    if (challengeTarget === 'persegi') {
      if (analysis.shapeKind === 'persegi') {
        sfx.victory();
        onComplete();
        setFeedback({
          passed: true,
          title: 'Tepat Sekali! Ini adalah Persegi!',
          detail: `Keempat sisinya sama panjang (${formatLengthCm(analysis.sideLengths[0])}), keempat sudutnya siku-siku 90°, dan sisi yang berhadapan sejajar.`,
        });
      } else {
        sfx.error();
        setFeedback({
          passed: false,
          title: 'Belum Berbentuk Persegi',
          detail:
            analysis.shapeKind === 'persegi_panjang'
              ? 'Sudutnya sudah 90°, tetapi panjang dan lebarnya belum sama. Geser pin agar keempat sisi sama panjang!'
              : 'Pastikan keempat sisi sama panjang dan semua sudut membentuk siku-siku 90° di garis grid.',
        });
      }
    } else {
      if (analysis.shapeKind === 'persegi_panjang') {
        sfx.victory();
        onComplete();
        setFeedback({
          passed: true,
          title: 'Mantap! Ini adalah Persegi Panjang!',
          detail: `Sisi berhadapan sama panjang (${formatLengthCm(analysis.sideLengths[0])} dan ${formatLengthCm(analysis.sideLengths[1])}), keempat sudutnya 90°, dan panjang berbeda dengan lebar.`,
        });
      } else {
        sfx.error();
        setFeedback({
          passed: false,
          title: 'Belum Berbentuk Persegi Panjang',
          detail:
            analysis.shapeKind === 'persegi'
              ? 'Semua sisinya masih sama panjang (Persegi). Tarik dua pin sisi kanan agar panjangnya lebih besar dari lebarnya!'
              : 'Pastikan setiap sudut berbentuk 90° dan pasangan sisi yang berhadapan sama panjang.',
        });
      }
    }
  };

  const labeledPoints = useMemo(() => {
    const labels = ['A', 'B', 'C', 'D'];
    return vertices.map((coord, i) => ({ coord, label: labels[i] }));
  }, [vertices]);

  // Moving comparison showcase coordinates
  const morphWidth = animPhase === 0 ? 110 : animPhase === 1 ? 165 : animPhase === 2 ? 190 : 110;
  const morphHeight = animPhase === 3 ? 130 : 110;
  const isMorphSquare = morphWidth === morphHeight;

  return (
    <div className="space-y-4">
      <TutorGuideBar
        mood={feedback?.passed || isCompleted ? 'celebrate' : 'guide'}
        message={
          feedback?.detail ??
          (showHint
            ? 'Petunjuk: Seret titik sudut kuning (A, B, C, D) pada Virtual Geoboard seperti memindahkan karet gelang pada paku!'
            : 'Modul 1 · Tarik titik-titik pin pada Virtual Geoboard di bawah untuk merasakan perbedaan Persegi dan Persegi Panjang!')
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

      {/* Animated Concept Comparison Banner */}
      <div className="rounded-3xl border-2 border-teal-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">
              1. Memahami Bentuk Persegi &amp; Persegi Panjang
            </h2>
            <p className="text-sm text-slate-600">
              Amati animasi perubahan panjang dan lebar berikut ini.
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
                <span>Jeda Animasi</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Putar Animasi</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-5 flex flex-col items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 p-3 min-h-[148px]">
            <svg width="240" height="140" viewBox="0 0 240 140" role="img" aria-label="Animasi perbandingan persegi dan persegi panjang">
              <rect
                x={(240 - morphWidth) / 2}
                y={(106 - morphHeight * 0.78) / 2 + 4}
                width={morphWidth}
                height={morphHeight * 0.78}
                rx="6"
                fill={isMorphSquare ? '#CCFBF1' : '#FEF3C7'}
                stroke={isMorphSquare ? '#0D9488' : '#D97706'}
                strokeWidth="3.5"
                style={{ transition: 'all 500ms cubic-bezier(0.16, 1, 0.3, 1)' }}
              />
              <text
                x="120"
                y="130"
                textAnchor="middle"
                className="font-display text-xs font-bold fill-slate-900"
              >
                {isMorphSquare ? 'PERSEGI (4 Sisi Sama Panjang)' : 'PERSEGI PANJANG (Panjang ≠ Lebar)'}
              </text>
            </svg>
          </div>

          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5">
              <div className="font-display font-bold text-emerald-900">Persamaan</div>
              <ul className="mt-1.5 space-y-1 text-slate-700 text-xs sm:text-sm">
                <li>• Sama-sama memiliki <strong>4 sisi</strong> lurus.</li>
                <li>• Sama-sama memiliki <strong>4 sudut siku-siku (90°)</strong>.</li>
                <li>• Sisi yang berhadapan <strong>sejajar</strong>.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5">
              <div className="font-display font-bold text-amber-900">Perbedaan</div>
              <ul className="mt-1.5 space-y-1 text-slate-700 text-xs sm:text-sm">
                <li>
                  • <strong>Persegi</strong>: Keempat sisinya <strong>sama panjang</strong>.
                </li>
                <li>
                  • <strong>Persegi Panjang</strong>: Punya <strong>panjang</strong> dan{' '}
                  <strong>lebar</strong> berbeda (sisi berhadapan sama panjang).
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Virtual Geoboard Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 rounded-3xl border-2 border-teal-200 bg-white p-4 sm:p-5 shadow-sm flex flex-col items-center">
          <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="font-display text-base font-bold text-slate-900">
              Virtual Geoboard Interaktif (Seret Titik Kuning)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyIdx === 0}
                className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                aria-label="Undo gerakan geoboard"
              >
                <Undo2 className="h-4 w-4" aria-hidden="true" />
                <span>Undo</span>
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={historyIdx >= history.length - 1}
                className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                aria-label="Redo gerakan geoboard"
              >
                <Redo2 className="h-4 w-4" aria-hidden="true" />
                <span>Redo</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          <GeometryGrid
            cols={6}
            rows={5}
            mode="geoboard"
            geoboardVertices={vertices}
            onMoveGeoboardVertex={handleMoveVertex}
            labeledPoints={labeledPoints}
            rightAngleCorners={rightAngles}
            showEdgeLengths
            testId="virtual-geoboard"
          />
        </div>

        <aside className="lg:col-span-5 rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <div className="text-xs font-bold text-teal-700">Analisis Real-Time Geoboard</div>
            <div className="mt-1 font-display text-2xl font-bold text-slate-900">
              {analysis.shapeLabel}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Panjang Sisi AB / BC / CD / DA</span>
              <span className="font-mono-num font-bold text-slate-900">
                {analysis.sideLengths.map((l) => formatLengthCm(l)).join(' · ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Sudut Siku-Siku (90°)</span>
              <span className="font-mono-num font-bold text-orange-700">
                {analysis.rightAngleCorners.filter(Boolean).length} dari 4 sudut
              </span>
            </div>
          </div>

          {/* Interactive Geoboard Mini Challenge */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-3">
            <div className="text-sm font-bold text-slate-900">
              Coba Tantangan Geoboard:
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  setChallengeTarget('persegi_panjang');
                  setFeedback(null);
                }}
                className={`flex-1 min-h-[40px] rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  challengeTarget === 'persegi_panjang'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                Bentuk Persegi Panjang
              </button>
              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  setChallengeTarget('persegi');
                  setFeedback(null);
                }}
                className={`flex-1 min-h-[40px] rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  challengeTarget === 'persegi'
                    ? 'bg-teal-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                Bentuk Persegi
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCheckGeoboard}
                className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-sm font-bold text-white hover:bg-teal-700 cursor-pointer"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                <span>Periksa Bentuk</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  setShowHint(true);
                }}
                className="min-h-[44px] inline-flex items-center justify-center gap-1 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 cursor-pointer"
              >
                <Lightbulb className="h-4 w-4" aria-hidden="true" />
                <span>Hint</span>
              </button>
            </div>
          </div>

          {feedback && (
            <div
              role="status"
              className={`rounded-2xl border-2 p-3.5 ${
                feedback.passed
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                  : 'border-rose-300 bg-rose-50 text-rose-950'
              }`}
            >
              <div className="font-display font-bold text-base">{feedback.title}</div>
              <p className="mt-1 text-xs sm:text-sm leading-snug">{feedback.detail}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
