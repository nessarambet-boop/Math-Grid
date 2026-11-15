import React, { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Lightbulb,
  MapPin,
  Play,
  Redo2,
  RotateCcw,
  Tag,
  Trash2,
  Undo2,
} from 'lucide-react';
import {
  computeExpectedPointH,
  sameVertex,
  segmentKey,
  validateCompleteSquareEFGH,
  type GridSegment,
  type VertexCoord,
} from '../../game/geometryMath';
import { sfx } from '../../game/sound';
import type { ValidationResult } from '../../game/types';
import {
  GeometryGrid,
  type DisplacementGuide,
  type LabeledPoint,
  type StyledSegment,
} from '../GeometryGrid';
import { TutorGuideBar } from '../TutorRobot';

interface Module4Props {
  isCompleted: boolean;
  onComplete: () => void;
}

// Coordinate problem matching FG = (1 unit right, 3 units down)
const POINT_E: VertexCoord = { x: 1, y: 3 };
const POINT_F: VertexCoord = { x: 4, y: 2 };
const POINT_G: VertexCoord = { x: 5, y: 5 };

const LOCKED_SEGMENTS: StyledSegment[] = [
  { id: 'locked-ef', a: POINT_E, b: POINT_F, color: '#0369A1', locked: true },
  { id: 'locked-fg', a: POINT_F, b: POINT_G, color: '#0369A1', locked: true },
];

interface EfghState {
  placedH: VertexCoord | null;
  labeledH: boolean;
  userSegments: GridSegment[];
}

export const Module4CompleteSquareEFGH: React.FC<Module4Props> = ({
  isCompleted,
  onComplete,
}) => {
  const [history, setHistory] = useState<EfghState[]>([
    { placedH: null, labeledH: false, userSegments: [] },
  ]);
  const [histIdx, setHistIdx] = useState(0);
  const current = history[histIdx];

  const [toolStep, setToolStep] = useState<'place-h' | 'draw-lines'>('place-h');
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [showDisplacementAnim, setShowDisplacementAnim] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<ValidationResult | null>(null);

  const expectedH = useMemo(
    () => computeExpectedPointH(POINT_E, POINT_F, POINT_G),
    []
  );

  const pushState = (next: EfghState) => {
    const sliced = history.slice(0, histIdx + 1);
    sliced.push(next);
    setHistory(sliced);
    setHistIdx(sliced.length - 1);
    setFeedback(null);
  };

  const handlePlaceH = (coord: VertexCoord) => {
    if (
      sameVertex(coord, POINT_E) ||
      sameVertex(coord, POINT_F) ||
      sameVertex(coord, POINT_G)
    ) {
      sfx.error();
      return;
    }
    pushState({
      ...current,
      placedH: coord,
    });
  };

  const handleLabelH = () => {
    if (!current.placedH) {
      sfx.error();
      setFeedback({
        passed: false,
        feedbackTitle: 'Letakkan Titik H Terlebih Dahulu',
        feedbackDetail:
          'Ketuk titik koordinat pada grid untuk menentukan posisi H sebelum memberi label H.',
      });
      return;
    }
    sfx.success();
    pushState({
      ...current,
      labeledH: true,
    });
    setToolStep('draw-lines');
  };

  const handleAddSegment = (a: VertexCoord, b: VertexCoord) => {
    const allSegs = [...LOCKED_SEGMENTS, ...current.userSegments];
    const key = segmentKey(a, b);
    if (allSegs.some((s) => segmentKey(s.a, s.b) === key)) {
      sfx.error();
      return;
    }
    sfx.tileTap(current.userSegments.length + 1);
    const id = `efgh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    pushState({
      ...current,
      userSegments: [...current.userSegments, { id, a, b }],
    });
  };

  const handleDeleteSelected = () => {
    if (!selectedSegmentId) return;
    if (LOCKED_SEGMENTS.some((s) => s.id === selectedSegmentId)) return;
    sfx.tileErase();
    pushState({
      ...current,
      userSegments: current.userSegments.filter((s) => s.id !== selectedSegmentId),
    });
    setSelectedSegmentId(null);
  };

  const allSegments: StyledSegment[] = useMemo(
    () => [
      ...LOCKED_SEGMENTS,
      ...current.userSegments.map((s) => ({ ...s, color: '#0D9488' })),
    ],
    [current.userSegments]
  );

  const labeledPoints: LabeledPoint[] = useMemo(() => {
    const list: LabeledPoint[] = [
      { coord: POINT_E, label: 'E', color: '#0369A1' },
      { coord: POINT_F, label: 'F', color: '#0369A1' },
      { coord: POINT_G, label: 'G', color: '#0369A1' },
    ];
    if (current.placedH) {
      list.push({
        coord: current.placedH,
        label: current.labeledH ? 'H' : '?',
        color: current.labeledH ? '#EA580C' : '#64748B',
      });
    }
    return list;
  }, [current.placedH, current.labeledH]);

  const displacementGuides: DisplacementGuide[] = useMemo(() => {
    if (!showDisplacementAnim) return [];
    const guides: DisplacementGuide[] = [
      {
        from: POINT_F,
        to: POINT_G,
        dxLabel: '1 kanan',
        dyLabel: '3 bawah',
        color: '#0284C7',
      },
    ];
    if (showHint || feedback?.passed) {
      guides.push({
        from: POINT_E,
        to: expectedH,
        dxLabel: '1 kanan',
        dyLabel: '3 bawah',
        color: '#EA580C',
      });
    }
    return guides;
  }, [showDisplacementAnim, showHint, feedback?.passed, expectedH]);

  const rightAngleCorners = useMemo(() => {
    if (!feedback?.passed) return [];
    return [
      { vertex: POINT_E, prev: expectedH, next: POINT_F },
      { vertex: POINT_F, prev: POINT_E, next: POINT_G },
      { vertex: POINT_G, prev: POINT_F, next: expectedH },
      { vertex: expectedH, prev: POINT_G, next: POINT_E },
    ];
  }, [feedback?.passed]);

  const handleCheck = () => {
    const res = validateCompleteSquareEFGH({
      pointE: POINT_E,
      pointF: POINT_F,
      pointG: POINT_G,
      placedH: current.placedH,
      labeledH: current.labeledH,
      segments: [...LOCKED_SEGMENTS, ...current.userSegments],
    });
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
            ? 'Petunjuk: Dari F(4,2) ke G(5,5) berpindah 1 satuan ke kanan dan 3 satuan ke bawah. Terapkan perpindahan yang sama dari E(1,3): 1 ke kanan dan 3 ke bawah!'
            : 'Modul 4 · Titik G berada 1 unit ke kanan dan 3 unit ke bawah dari F. Hitung perpindahan yang sama dari E untuk meletakkan & melabeli titik H, lalu hubungkan E–H dan H–G!')
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
        <div className="lg:col-span-7 rounded-3xl border-2 border-indigo-200 bg-white p-4 sm:p-5 shadow-sm flex flex-col items-center">
          {/* Toolbar */}
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
              {selectedSegmentId &&
                !LOCKED_SEGMENTS.some((s) => s.id === selectedSegmentId) && (
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
                  setSelectedSegmentId(null);
                  setToolStep('place-h');
                  pushState({ placedH: null, labeledH: false, userSegments: [] });
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
                setShowDisplacementAnim((v) => !v);
              }}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-sky-600 px-3 text-xs font-bold text-white hover:bg-sky-700 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-white" aria-hidden="true" />
              <span>
                {showDisplacementAnim ? 'Sembunyikan Vektor' : 'Animasi Perpindahan'}
              </span>
            </button>
          </div>

          <GeometryGrid
            cols={6}
            rows={7}
            mode="place-h-then-draw"
            placeHActive={toolStep === 'place-h'}
            placedH={current.placedH}
            onPlaceH={handlePlaceH}
            segments={allSegments}
            onAddSegment={handleAddSegment}
            selectedSegmentId={selectedSegmentId}
            onSelectSegment={setSelectedSegmentId}
            labeledPoints={labeledPoints}
            displacementGuides={displacementGuides}
            rightAngleCorners={rightAngleCorners}
            showEdgeLengths={false}
            unitLabel="Koordinat Grid (x, y)"
            testId="complete-efgh-grid"
          />
        </div>

        <aside className="lg:col-span-5 rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <div className="text-xs font-bold text-sky-700">
              Modul 4 · Complete Square EFGH
            </div>
            <h2 className="mt-1 font-display text-xl font-bold text-slate-900">
              Lengkapi Persegi EFGH dengan Vektor Perpindahan
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
              Diketahui <strong>G</strong> berada <strong>1 unit ke kanan</strong> dan{' '}
              <strong>3 unit ke bawah</strong> dari <strong>F</strong>. Gunakan perpindahan yang sama dari <strong>E</strong>!
            </p>
          </div>

          {/* Interactive Tool Mode Switcher */}
          <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-xs font-bold text-slate-700">Langkah Kerja Interaktif:</div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  setToolStep('place-h');
                }}
                className={`min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
                  toolStep === 'place-h'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                <MapPin className="h-4 w-4" aria-hidden="true" />
                <span>1. Letakkan Titik</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  setToolStep('draw-lines');
                }}
                className={`min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
                  toolStep === 'draw-lines'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                <span>3. Hubungkan Garis</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleLabelH}
              className={`min-h-[44px] w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-bold transition cursor-pointer ${
                current.labeledH
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100'
              }`}
            >
              <Tag className="h-4 w-4" aria-hidden="true" />
              <span>
                {current.labeledH
                  ? `2. Label H Terpasang (${current.placedH?.x}, ${current.placedH?.y})`
                  : '2. Beri Label H'}
              </span>
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
              <span>Periksa Persegi EFGH</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sfx.click();
                setShowHint(true);
                setShowDisplacementAnim(true);
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
