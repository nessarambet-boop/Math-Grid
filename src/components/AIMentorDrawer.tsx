import React, { useState } from 'react';
import { Send, Sparkles, Volume2, X } from 'lucide-react';
import { askAIMentor } from '../game/aiMentor';
import { sfx } from '../game/sound';
import type { GameProgress, PlacedShape, TutorMood, WorldId } from '../game/types';
import { speakRobot } from '../game/voice';
import { TutorRobot } from './TutorRobot';

interface AIMentorDrawerProps {
  open: boolean;
  onClose: () => void;
  world: WorldId;
  levelId?: string;
  levelTitle?: string;
  lastError?: string;
  placedShapes?: PlacedShape[];
  progress: GameProgress;
}

const QUICK_QUESTIONS = [
  'Beri aku petunjuk langkah berikutnya!',
  'Apa perbedaan persegi dan persegi panjang?',
  'Bagaimana cara kerja jari-jari lingkaran?',
  'Apa bedanya bangun datar 2D dan bangun ruang 3D?',
];

export const AIMentorDrawer: React.FC<AIMentorDrawerProps> = ({
  open,
  onClose,
  world,
  levelId,
  levelTitle,
  lastError,
  placedShapes,
  progress,
}) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<{ text: string; source: 'local' | 'gemini' } | null>(null);

  if (!open) return null;

  const submitQuestion = async (promptText: string) => {
    const clean = promptText.trim();
    setLoading(true);
    sfx.click();
    const res = await askAIMentor({
      world,
      levelId,
      levelTitle,
      lastError,
      placedShapes,
      studentQuestion: clean,
      progress,
    });
    setReply({ text: res.explanation, source: res.source });
    setLoading(false);
    speakRobot(res.explanation, { fromUserAction: true });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() && loading) return;
    submitQuestion(question || 'Beri aku petunjuk untuk tantangan ini');
    setQuestion('');
  };

  const robotMood: TutorMood = loading ? 'thinking' : reply ? 'happy' : 'guide';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/55 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-mentor-title"
    >
      <div className="animate-pop-in flex max-h-[88vh] w-full max-w-lg flex-col rounded-3xl border-2 border-teal-300 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-teal-100 bg-gradient-to-r from-teal-600 to-sky-600 px-5 py-3.5 text-white">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-amber-300" aria-hidden="true" />
            <div>
              <h2 id="ai-mentor-title" className="font-display text-lg font-bold leading-tight">
                Tanya HIGAYON · Mentor Matematika
              </h2>
              <p className="text-xs text-teal-100">
                {levelTitle ? `Membantu: ${levelTitle}` : `Dunia aktif: ${world}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white/90 hover:bg-white/15 cursor-pointer"
            aria-label="Tutup Mentor HIGAYON"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-teal-100 bg-teal-50/60 p-3.5">
            <TutorRobot
              mood={robotMood}
              size={76}
              animateFloat={false}
              accessory={progress.profile.activeAccessory ?? 'syal'}
            />
            <div className="flex-1 text-sm text-slate-800 leading-snug">
              {loading ? (
                <span className="font-semibold text-teal-700">
                  HIGAYON sedang berpikir dan memeriksa langkahmu...
                </span>
              ) : reply ? (
                <div>
                  <p className="font-medium">{reply.text}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => speakRobot(reply.text, { fromUserAction: true })}
                      className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-white px-2.5 py-1 text-xs font-bold text-teal-800 hover:bg-teal-50 cursor-pointer"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      <span>Bacakan Jawaban</span>
                    </button>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {reply.source === 'gemini' ? 'Mentor Cerdas' : 'Panduan Offline HIGAYON'}
                    </span>
                  </div>
                </div>
              ) : (
                <span>
                  Halo {progress.profile.name}! Pilih pertanyaan cepat di bawah atau tulis pertanyaan
                  matematikamu sendiri.
                </span>
              )}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-600 mb-2">Pertanyaan Cepat:</div>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={loading}
                  onClick={() => submitQuestion(q)}
                  className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-left text-xs font-bold text-sky-900 hover:bg-sky-100 disabled:opacity-50 cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        <form
          onSubmit={handleFormSubmit}
          className="flex items-center gap-2 border-t border-slate-200 bg-slate-50 p-3.5"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={140}
            placeholder="Tulis pertanyaan matematika untuk HIGAYON..."
            className="flex-1 min-h-[44px] rounded-xl border-2 border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50 cursor-pointer"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            <span>Tanya</span>
          </button>
        </form>
      </div>
    </div>
  );
};
