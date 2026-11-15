import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
  StepForward,
} from 'lucide-react';
import { LEARN_MODULES } from '../game/curriculumData';
import { buildRectCoords } from '../game/gridMath';
import { sfx } from '../game/sound';
import type { GridCoord } from '../game/types';
import { InteractiveGrid } from './InteractiveGrid';
import { Module1UnderstandingShapes } from './modules/Module1UnderstandingShapes';
import { Module2DrawSquareABCD } from './modules/Module2DrawSquareABCD';
import { Module3DrawRectangle } from './modules/Module3DrawRectangle';
import { Module4CompleteSquareEFGH } from './modules/Module4CompleteSquareEFGH';
import { Module5ParallelPerpendicular } from './modules/Module5ParallelPerpendicular';
import { TutorGuideBar } from './TutorRobot';

interface LearnWorldProps {
  completedModuleIds: string[];
  onCompleteModule: (moduleId: string) => void;
  onGoPractice: () => void;
}

export const LearnWorld: React.FC<LearnWorldProps> = ({
  completedModuleIds,
  onCompleteModule,
  onGoPractice,
}) => {
  const [moduleIndex, setModuleIndex] = useState(0);
  const currentModule = LEARN_MODULES[moduleIndex];

  // State for Module 6 (Area & Perimeter Explorer preserved from Prompt 1)
  const [rectWidth, setRectWidth] = useState(4);
  const [rectHeight, setRectHeight] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [revealedCount, setRevealedCount] = useState<number>(999);
  const [perimeterProgress, setPerimeterProgress] = useState<number>(1);
  const [demoPhase, setDemoPhase] = useState<'idle' | 'area' | 'perimeter' | 'done'>('done');

  const fullCells: GridCoord[] = useMemo(() => {
    return buildRectCoords(
      { col: 1, row: 1 },
      { col: 1 + rectWidth - 1, row: 1 + rectHeight - 1 }
    );
  }, [rectWidth, rectHeight]);

  useEffect(() => {
    setIsPlaying(false);
    setDemoPhase('done');
    setRevealedCount(fullCells.length);
    setPerimeterProgress(1);
  }, [moduleIndex, rectWidth, rectHeight, fullCells.length]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      if (demoPhase === 'area') {
        setRevealedCount((prev) => {
          if (prev < fullCells.length) {
            sfx.step();
            return prev + 1;
          }
          setDemoPhase('perimeter');
          return prev;
        });
      } else if (demoPhase === 'perimeter') {
        setPerimeterProgress((prev) => {
          if (prev < 1) {
            return Math.min(1, Number((prev + 0.12).toFixed(2)));
          }
          setDemoPhase('done');
          setIsPlaying(false);
          sfx.success();
          return 1;
        });
      }
    }, 220);

    return () => window.clearInterval(timer);
  }, [isPlaying, demoPhase, fullCells.length]);

  const visibleCells = useMemo(
    () => fullCells.slice(0, revealedCount),
    [fullCells, revealedCount]
  );

  const areaValue = rectWidth * rectHeight;
  const perimeterValue = 2 * (rectWidth + rectHeight);

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6 space-y-4">
      {/* Module Selector Tabs (6 Modules: 1-5 Geometry Drawing + 6 Area/Perimeter Lab) */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm"
        role="tablist"
        aria-label="Pilih Modul Pembelajaran"
      >
        {LEARN_MODULES.map((mod, idx) => {
          const active = idx === moduleIndex;
          const done = completedModuleIds.includes(mod.id);
          return (
            <button
              key={mod.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                sfx.click();
                setModuleIndex(idx);
              }}
              className={`min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold transition cursor-pointer ${
                active
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="truncate">{mod.title}</span>
              {done && (
                <CheckCircle2
                  className={`h-3.5 w-3.5 shrink-0 ${
                    active ? 'text-amber-300' : 'text-emerald-600'
                  }`}
                  aria-label="Selesai"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Render Selected Module */}
      {currentModule.id === 'mod-1-shapes' && (
        <Module1UnderstandingShapes
          isCompleted={completedModuleIds.includes('mod-1-shapes')}
          onComplete={() => onCompleteModule('mod-1-shapes')}
        />
      )}

      {currentModule.id === 'mod-2-abcd' && (
        <Module2DrawSquareABCD
          isCompleted={completedModuleIds.includes('mod-2-abcd')}
          onComplete={() => onCompleteModule('mod-2-abcd')}
        />
      )}

      {currentModule.id === 'mod-3-rect' && (
        <Module3DrawRectangle
          isCompleted={completedModuleIds.includes('mod-3-rect')}
          onComplete={() => onCompleteModule('mod-3-rect')}
        />
      )}

      {currentModule.id === 'mod-4-efgh' && (
        <Module4CompleteSquareEFGH
          isCompleted={completedModuleIds.includes('mod-4-efgh')}
          onComplete={() => onCompleteModule('mod-4-efgh')}
        />
      )}

      {currentModule.id === 'mod-5-lines' && (
        <Module5ParallelPerpendicular
          isCompleted={completedModuleIds.includes('mod-5-lines')}
          onComplete={() => onCompleteModule('mod-5-lines')}
        />
      )}

      {currentModule.id === 'learn-luas-keliling' && (
        <div className="space-y-4">
          <TutorGuideBar
            mood={completedModuleIds.includes('learn-luas-keliling') ? 'celebrate' : 'guide'}
            message={currentModule.tutorTip}
            actionButton={
              <button
                type="button"
                onClick={() => {
                  sfx.success();
                  onCompleteModule('learn-luas-keliling');
                }}
                className={`min-h-[44px] inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition cursor-pointer whitespace-nowrap ${
                  completedModuleIds.includes('learn-luas-keliling')
                    ? 'border-2 border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>
                  {completedModuleIds.includes('learn-luas-keliling')
                    ? 'Modul Selesai'
                    : 'Tandai Paham (+2 Bintang)'}
                </span>
              </button>
            }
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-7 rounded-3xl border-2 border-emerald-200 bg-white p-4 sm:p-5 shadow-sm flex flex-col items-center">
              <div className="mb-3 font-display text-lg font-bold text-slate-900">
                {demoPhase === 'area'
                  ? `Menghitung Luas: ${visibleCells.length} dari ${areaValue} petak`
                  : demoPhase === 'perimeter'
                  ? `Mengelilingi Tepi: Keliling = ${perimeterValue} satuan`
                  : `Luas = ${areaValue} petak · Keliling = ${perimeterValue} satuan`}
              </div>

              <InteractiveGrid
                cols={7}
                rows={6}
                selectedCells={visibleCells}
                readOnly
                showCellNumbers
                showDimensions={demoPhase === 'done' || demoPhase === 'perimeter'}
                highlightPerimeterProgress={perimeterProgress}
                accentColor={rectWidth === rectHeight ? 'teal' : 'amber'}
                testId="learn-demo-grid"
              />

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                {!isPlaying ? (
                  <button
                    type="button"
                    onClick={() => {
                      sfx.click();
                      setRevealedCount(0);
                      setPerimeterProgress(0);
                      setDemoPhase('area');
                      setIsPlaying(true);
                    }}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-teal-700 cursor-pointer"
                  >
                    <Play className="h-4 w-4 fill-white" aria-hidden="true" />
                    <span>Putar Animasi</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsPlaying(false)}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 shadow-sm hover:bg-amber-400 cursor-pointer"
                  >
                    <Pause className="h-4 w-4" aria-hidden="true" />
                    <span>Jeda</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    sfx.step();
                    setIsPlaying(false);
                    if (demoPhase === 'done' || demoPhase === 'idle') {
                      setRevealedCount(1);
                      setPerimeterProgress(0);
                      setDemoPhase('area');
                    } else if (demoPhase === 'area') {
                      if (revealedCount < fullCells.length) {
                        setRevealedCount((c) => c + 1);
                      } else {
                        setDemoPhase('perimeter');
                        setPerimeterProgress(0.25);
                      }
                    } else if (demoPhase === 'perimeter') {
                      if (perimeterProgress < 1) {
                        setPerimeterProgress((p) => Math.min(1, p + 0.25));
                      } else {
                        setDemoPhase('done');
                      }
                    }
                  }}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <StepForward className="h-4 w-4" aria-hidden="true" />
                  <span>Langkah</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sfx.click();
                    setIsPlaying(false);
                    setDemoPhase('done');
                    setRevealedCount(fullCells.length);
                    setPerimeterProgress(1);
                  }}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            <aside className="lg:col-span-5 rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  {rectWidth === rectHeight ? 'Persegi' : 'Persegi Panjang'} ({rectWidth} × {rectHeight})
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {currentModule.conceptSummary}
                </p>
              </div>

              <div className="space-y-3.5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <div className="flex items-center justify-between text-sm font-bold text-slate-800 mb-1.5">
                    <label htmlFor="explore-width">Panjang (p)</label>
                    <span className="font-mono-num text-teal-700">{rectWidth} satuan</span>
                  </div>
                  <input
                    id="explore-width"
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={rectWidth}
                    onChange={(e) => setRectWidth(Number(e.target.value))}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm font-bold text-slate-800 mb-1.5">
                    <label htmlFor="explore-height">Lebar (l)</label>
                    <span className="font-mono-num text-amber-700">{rectHeight} satuan</span>
                  </div>
                  <input
                    id="explore-height"
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={rectHeight}
                    onChange={(e) => setRectHeight(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-teal-200 bg-teal-50 p-3.5 text-center">
                  <div className="text-xs font-bold text-teal-800">Luas (Petak Isi)</div>
                  <div className="mt-1 font-mono-num text-2xl font-bold text-slate-900">
                    {areaValue}
                  </div>
                </div>
                <div className="rounded-2xl border border-orange-200 bg-orange-50 p-3.5 text-center">
                  <div className="text-xs font-bold text-orange-800">Keliling (Tepi)</div>
                  <div className="mt-1 font-mono-num text-2xl font-bold text-slate-900">
                    {perimeterValue}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onGoPractice}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-base font-bold text-white shadow-sm hover:bg-sky-700 cursor-pointer"
              >
                <span>Masuk ke Practice World</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </aside>
          </div>
        </div>
      )}

      {/* Bottom Module Quick Navigation */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          disabled={moduleIndex === 0}
          onClick={() => {
            sfx.click();
            setModuleIndex((i) => Math.max(0, i - 1));
          }}
          className="min-h-[44px] rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
        >
          ← Modul Sebelumnya
        </button>

        {moduleIndex < LEARN_MODULES.length - 1 ? (
          <button
            type="button"
            onClick={() => {
              sfx.click();
              setModuleIndex((i) => Math.min(LEARN_MODULES.length - 1, i + 1));
            }}
            className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700 cursor-pointer"
          >
            <span>Modul Berikutnya</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onGoPractice}
            className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-700 cursor-pointer"
          >
            <span>Lanjut Practice World</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};
