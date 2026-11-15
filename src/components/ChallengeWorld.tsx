import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  Eraser,
  Heart,
  Map as MapIcon,
  RotateCcw,
  Star,
  Trophy,
} from 'lucide-react';
import { CHALLENGE_TIERS } from '../game/curriculumData';
import { validateChallengeQuestion } from '../game/gridMath';
import { sfx } from '../game/sound';
import type { GridCoord, TutorMood, ValidationResult } from '../game/types';
import { InteractiveGrid } from './InteractiveGrid';
import { TutorGuideBar, TutorRobot } from './TutorRobot';

interface ChallengeWorldProps {
  challengeStars: Record<string, number>;
  onRecordStars: (tierId: string, stars: number) => void;
  onOutcomeChange: (isOutcomeVisible: boolean) => void;
  onGoMap: () => void;
}

export const ChallengeWorld: React.FC<ChallengeWorldProps> = ({
  challengeStars,
  onRecordStars,
  onOutcomeChange,
  onGoMap,
}) => {
  const [tierIdx, setTierIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedCells, setSelectedCells] = useState<GridCoord[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | undefined>(undefined);
  const [feedback, setFeedback] = useState<ValidationResult | null>(null);
  const [roundOutcome, setRoundOutcome] = useState<'playing' | 'victory' | 'defeat'>('playing');
  const [earnedStars, setEarnedStars] = useState(0);

  const tier = CHALLENGE_TIERS[tierIdx];
  const question = tier.questions[qIdx];

  useEffect(() => {
    onOutcomeChange(roundOutcome !== 'playing');
    return () => onOutcomeChange(false);
  }, [roundOutcome, onOutcomeChange]);

  const startTier = (idx: number) => {
    sfx.click();
    setTierIdx(idx);
    setQIdx(0);
    setHearts(3);
    setCorrectCount(0);
    setSelectedCells([]);
    setSelectedOption(undefined);
    setFeedback(null);
    setRoundOutcome('playing');
    setEarnedStars(0);
  };

  const handleSubmit = (overrideOption?: number) => {
    const chosenOption = overrideOption ?? selectedOption;
    const result = validateChallengeQuestion(question, selectedCells, chosenOption);
    setFeedback(result);

    if (result.passed) {
      const nextCorrect = correctCount + 1;
      setCorrectCount(nextCorrect);
      sfx.success();

      // Advance or finish after brief readability pause
      if (qIdx >= tier.questions.length - 1) {
        const finalStars = hearts >= 3 ? 3 : hearts === 2 ? 2 : 1;
        setEarnedStars(finalStars);
        onRecordStars(tier.id, finalStars);
        setRoundOutcome('victory');
        sfx.victory();
      }
    } else {
      const nextHearts = Math.max(0, hearts - 1);
      setHearts(nextHearts);
      sfx.error();
      if (nextHearts <= 0) {
        setRoundOutcome('defeat');
      }
    }
  };

  const handleNextQuestion = () => {
    sfx.click();
    setQIdx((prev) => prev + 1);
    setSelectedCells([]);
    setSelectedOption(undefined);
    setFeedback(null);
  };

  const tutorMood: TutorMood =
    roundOutcome === 'victory'
      ? 'celebrate'
      : feedback?.passed
      ? 'celebrate'
      : feedback && !feedback.passed
      ? 'encourage'
      : 'guide';

  const tutorMessage = feedback
    ? feedback.feedbackDetail
    : `Tantangan ${tier.title} (${qIdx + 1}/${tier.questions.length}): Kerjakan dengan teliti!`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6 space-y-4">
      <TutorGuideBar mood={tutorMood} message={tutorMessage} />

      {/* Tier Selector & Live Hearts / Score HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {CHALLENGE_TIERS.map((t, i) => {
            const stars = challengeStars[t.id] ?? 0;
            const active = i === tierIdx;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => startTier(i)}
                className={`min-h-[40px] inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-orange-600 text-white shadow-sm'
                    : stars > 0
                    ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{t.badgeLabel}</span>
                {stars > 0 && (
                  <Star
                    className={`h-3.5 w-3.5 ${
                      active
                        ? 'fill-amber-300 text-amber-300'
                        : 'fill-amber-400 text-amber-500'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Hearts & Question Progress */}
        <div className="flex items-center gap-4">
          <div className="text-xs sm:text-sm font-bold text-slate-700 font-mono-num">
            Soal {qIdx + 1}/{tier.questions.length}
          </div>
          <div
            className="flex items-center gap-1"
            aria-label={`Sisa nyawa ${hearts} dari 3`}
          >
            {[1, 2, 3].map((h) => (
              <Heart
                key={h}
                className={`h-5 w-5 ${
                  h <= hearts
                    ? 'fill-rose-500 text-rose-600'
                    : 'fill-slate-200 text-slate-300'
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Active Challenge Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 rounded-3xl border-2 border-orange-200 bg-white p-4 sm:p-5 shadow-sm flex flex-col items-center">
          {question.mode === 'answer' ? (
            <InteractiveGrid
              cols={question.gridCols}
              rows={question.gridRows}
              selectedCells={question.presetCells ?? []}
              readOnly
              showDimensions={false}
              accentColor="amber"
              testId="challenge-preview-grid"
            />
          ) : (
            <InteractiveGrid
              cols={question.gridCols}
              rows={question.gridRows}
              selectedCells={selectedCells}
              onChangeCells={(next) => {
                setSelectedCells(next);
                if (feedback) setFeedback(null);
              }}
              drawMode="rect"
              accentColor="teal"
              testId="challenge-draw-grid"
            />
          )}
        </div>

        <aside className="lg:col-span-5 rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <div className="text-xs font-bold text-orange-700">
              {tier.title} · {tier.subtitle}
            </div>
            <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {question.prompt}
            </h2>
          </div>

          {question.mode === 'answer' && question.options && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              {question.options.map((opt) => {
                const isSelected = selectedOption === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={Boolean(feedback?.passed)}
                    onClick={() => {
                      sfx.click();
                      setSelectedOption(opt);
                      setFeedback(null);
                    }}
                    className={`min-h-[54px] rounded-2xl border-2 px-4 py-2 text-center transition cursor-pointer ${
                      isSelected
                        ? 'border-orange-600 bg-orange-50 text-orange-950 shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-mono-num text-xl font-bold">{opt}</div>
                    {question.unitLabel && (
                      <div className="text-[11px] font-semibold text-slate-500">
                        {question.unitLabel}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {feedback && (
            <div
              role="status"
              className={`rounded-2xl border-2 p-4 ${
                feedback.passed
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                  : 'border-rose-300 bg-rose-50 text-rose-950'
              }`}
            >
              <div className="font-display text-lg font-bold">
                {feedback.feedbackTitle}
              </div>
              <p className="mt-1 text-sm leading-snug">{feedback.feedbackDetail}</p>
            </div>
          )}

          <div className="space-y-2.5 pt-1">
            {!feedback?.passed ? (
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 py-3 text-base font-bold text-white shadow-sm hover:bg-orange-700 cursor-pointer"
                >
                  <Check className="h-5 w-5" aria-hidden="true" />
                  <span>Kirim Jawaban</span>
                </button>

                {question.mode === 'draw' && (
                  <button
                    type="button"
                    onClick={() => {
                      sfx.tileErase();
                      setSelectedCells([]);
                      setFeedback(null);
                    }}
                    className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <Eraser className="h-4 w-4" aria-hidden="true" />
                    <span>Bersihkan Grid</span>
                  </button>
                )}
              </div>
            ) : (
              qIdx < tier.questions.length - 1 && (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-3 text-base font-bold text-white shadow-sm hover:bg-teal-700 cursor-pointer"
                >
                  <span>Soal Berikutnya</span>
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </button>
              )
            )}
          </div>
        </aside>
      </div>

      {/* Victory / Defeat Outcome Modal */}
      {roundOutcome !== 'playing' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="challenge-outcome-title"
        >
          <div className="animate-pop-in w-full max-w-md rounded-3xl border-2 border-amber-200 bg-white p-6 shadow-xl text-center">
            <div className="flex justify-center">
              <TutorRobot
                mood={roundOutcome === 'victory' ? 'celebrate' : 'encourage'}
                size={96}
                animateFloat={false}
              />
            </div>

            <h2
              id="challenge-outcome-title"
              className="mt-2 font-display text-2xl font-bold text-slate-900"
            >
              {roundOutcome === 'victory'
                ? `Tantangan ${tier.badgeLabel} Tuntas!`
                : 'Nyawa Habis — Ayo Coba Lagi!'}
            </h2>

            {roundOutcome === 'victory' && (
              <div className="mt-3 flex justify-center gap-1.5">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`h-8 w-8 ${
                      s <= earnedStars
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 border border-slate-200 p-3.5 text-center">
              <div>
                <div className="text-xs font-bold text-slate-500">Jawaban Benar</div>
                <div className="font-mono-num text-xl font-bold text-teal-700">
                  {correctCount}/{tier.questions.length}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500">Sisa Nyawa</div>
                <div className="font-mono-num text-xl font-bold text-rose-600">
                  {hearts}/3
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              {roundOutcome === 'victory' && tierIdx < CHALLENGE_TIERS.length - 1 && (
                <button
                  type="button"
                  data-start="true"
                  onClick={() => startTier(tierIdx + 1)}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-base font-bold text-white shadow-sm hover:bg-orange-700 cursor-pointer"
                >
                  <Trophy className="h-4 w-4" aria-hidden="true" />
                  <span>Tingkat Berikutnya</span>
                </button>
              )}

              <button
                type="button"
                data-start={roundOutcome === 'defeat' ? 'true' : undefined}
                onClick={() => startTier(tierIdx)}
                className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border-2 border-teal-600 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-800 hover:bg-teal-100 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Main Lagi</span>
              </button>

              <button
                type="button"
                onClick={onGoMap}
                className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <MapIcon className="h-4 w-4" aria-hidden="true" />
                <span>Kembali ke Peta Dunia</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
