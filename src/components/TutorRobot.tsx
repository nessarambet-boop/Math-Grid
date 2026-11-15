import React, { createContext, useContext, useEffect, useState } from 'react';
import { Volume2, VolumeX, RotateCw } from 'lucide-react';
import type { HigayonAccessoryId, TutorMood } from '../game/types';
import {
  isSpeechSupported,
  replayLastRobotVoice,
  speakRobot,
  stopRobotVoice,
  subscribeVoiceState,
} from '../game/voice';
import { getSoundSettings } from '../game/sound';

const HigayonAccessoryContext = createContext<HigayonAccessoryId>('syal');

export const HigayonAccessoryProvider: React.FC<{
  accessory: HigayonAccessoryId;
  children: React.ReactNode;
}> = ({ accessory, children }) => (
  <HigayonAccessoryContext.Provider value={accessory}>{children}</HigayonAccessoryContext.Provider>
);

interface TutorRobotProps {
  mood?: TutorMood;
  size?: number;
  className?: string;
  animateFloat?: boolean;
  isSpeaking?: boolean;
  accessory?: HigayonAccessoryId;
}

/**
 * MASTER CHARACTER CONSISTENCY: HIGAYON — Robot Tutor Matematika
 * Consistent silhouette, palette (#0D9488 teal chassis, #F8FAFC bezel,
 * #0F172A visor, #38BDF8 glowing eyes, #F59E0B golden antenna orbs & belt,
 * #F97316 explorer scarf, and 2x2 chest grid emblem) across every screen,
 * supporting 6 full animation states:
 * 1. idle, 2. talking, 3. thinking, 4. happy, 5. encourage, 6. celebrate
 */
export const TutorRobot: React.FC<TutorRobotProps> = ({
  mood = 'idle',
  size = 96,
  className = '',
  animateFloat = true,
  isSpeaking = false,
  accessory,
}) => {
  const ctxAccessory = useContext(HigayonAccessoryContext);
  const resolvedAccessory = accessory ?? ctxAccessory;
  const effectiveState: TutorMood = isSpeaking ? 'talking' : mood;
  const isCelebrate = effectiveState === 'celebrate';
  const isThinking = effectiveState === 'thinking';
  const isTalking = effectiveState === 'talking';
  const isHappy = effectiveState === 'happy';
  const isEncourage = effectiveState === 'encourage';
  const isGuide = effectiveState === 'guide';

  const outerMotionClass = !animateFloat
    ? ''
    : isCelebrate
    ? 'animate-higayon-celebrate'
    : isHappy
    ? 'animate-higayon-happy'
    : 'animate-float-slow';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${outerMotionClass} ${className}`}
      data-higayon-state={effectiveState}
      role="img"
      aria-label={`HIGAYON si Robot Tutor Matematika (${effectiveState})`}
    >
      {/* Celebration Stars */}
      {isCelebrate && (
        <g className="animate-higayon-star">
          <path
            d="M14 26 L17 31 L22 32 L18 36 L19 41 L14 38 L9 41 L10 36 L6 32 L11 31 Z"
            fill="#FBBF24"
            stroke="#D97706"
            strokeWidth="1"
          />
          <path
            d="M105 22 L107.5 26.5 L112 27.5 L108.5 31 L109.5 35.5 L105 33 L100.5 35.5 L101.5 31 L98 27.5 L102.5 26.5 Z"
            fill="#FBBF24"
            stroke="#D97706"
            strokeWidth="1"
          />
          <circle cx="20" cy="54" r="3" fill="#38BDF8" />
          <circle cx="102" cy="52" r="3" fill="#10B981" />
        </g>
      )}

      {/* Thinking Dots */}
      {isThinking && (
        <g className="animate-higayon-think">
          <circle cx="96" cy="22" r="2.8" fill="#0284C7" />
          <circle cx="104" cy="16" r="3.8" fill="#0284C7" />
          <circle cx="112" cy="9" r="4.8" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.2" />
        </g>
      )}

      {/* Ground shadow */}
      <ellipse cx="60" cy="112" rx="26" ry="5" fill="#0F172A" fillOpacity="0.14" />

      {/* Left Arm */}
      <g
        className={!isCelebrate && !isThinking ? 'animate-higayon-arm' : ''}
        transform={
          isCelebrate
            ? 'rotate(-42 27 72)'
            : isHappy
            ? 'rotate(-26 27 72)'
            : isEncourage
            ? 'rotate(18 27 72)'
            : isGuide
            ? 'rotate(16 27 72)'
            : 'rotate(0 27 72)'
        }
      >
        <rect
          x="14"
          y="67"
          width="14"
          height="24"
          rx="7"
          fill="#14B8A6"
          stroke="#0F766E"
          strokeWidth="2.5"
        />
        <circle cx="21" cy="91" r="5" fill="#F59E0B" stroke="#0F766E" strokeWidth="2" />
      </g>

      {/* Right Arm */}
      <g
        className={isTalking ? 'animate-higayon-talk-arm' : ''}
        transform={
          isCelebrate
            ? 'rotate(42 93 72)'
            : isHappy
            ? 'rotate(28 93 72)'
            : isThinking
            ? 'rotate(-68 93 72)'
            : isEncourage
            ? 'rotate(-34 93 72)'
            : isGuide
            ? 'rotate(-28 93 72)'
            : 'rotate(0 93 72)'
        }
      >
        <rect
          x="92"
          y="67"
          width="14"
          height="24"
          rx="7"
          fill="#14B8A6"
          stroke="#0F766E"
          strokeWidth="2.5"
        />
        <circle cx="99" cy="91" r="5" fill="#F59E0B" stroke="#0F766E" strokeWidth="2" />
      </g>

      {/* Rounded Explorer Body */}
      <rect
        x="32"
        y="62"
        width="56"
        height="40"
        rx="16"
        fill="#0D9488"
        stroke="#0F766E"
        strokeWidth="3"
      />

      {/* Feet / Thruster Pads */}
      <rect x="40" y="99" width="14" height="8" rx="4" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
      <rect x="66" y="99" width="14" height="8" rx="4" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />

      {/* Chest 2x2 Grid Emblem */}
      <rect x="47" y="74" width="26" height="20" rx="5" fill="#F8FAFC" stroke="#0F766E" strokeWidth="2" />
      <rect x="51" y="77.5" width="7.5" height="5.5" rx="1" fill="#F59E0B" />
      <rect x="61.5" y="77.5" width="7.5" height="5.5" rx="1" fill="#38BDF8" />
      <rect x="51" y="85" width="7.5" height="5.5" rx="1" fill="#38BDF8" />
      <rect x="61.5" y="85" width="7.5" height="5.5" rx="1" fill="#F59E0B" />

      {/* Explorer Scarf Accessory */}
      <path
        d="M34 64 Q60 73 86 64 L82 71 Q60 79 38 71 Z"
        fill="#F97316"
        stroke="#C2410C"
        strokeWidth="1.5"
      />
      <path
        d="M68 68 L77 80 L67 82 Z"
        fill="#FB923C"
        stroke="#C2410C"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Head Assembly (Antennas + Head + Visor + Optional Unlocked Accessory) */}
      <g
        className={!isThinking ? 'animate-higayon-head' : ''}
        transform={isThinking ? 'rotate(-6 60 44)' : undefined}
      >
        {/* Twin Antennas */}
        <line x1="40" y1="26" x2="33" y2="13" stroke="#0F766E" strokeWidth="4" strokeLinecap="round" />
        <circle
          cx="32"
          cy="11"
          r="5"
          fill={isThinking ? '#38BDF8' : '#F59E0B'}
          stroke="#FFFFFF"
          strokeWidth="2"
          className="animate-higayon-antenna"
        />

        <line x1="80" y1="26" x2="87" y2="13" stroke="#0F766E" strokeWidth="4" strokeLinecap="round" />
        <circle
          cx="88"
          cy="11"
          r="5"
          fill={isThinking ? '#38BDF8' : '#F59E0B'}
          stroke="#FFFFFF"
          strokeWidth="2"
          className="animate-higayon-antenna"
        />

        {/* Head Dome */}
        <rect x="26" y="22" width="68" height="44" rx="20" fill="#14B8A6" stroke="#0F766E" strokeWidth="3" />

        {/* Ear Cups */}
        <rect x="21" y="36" width="7" height="16" rx="3.5" fill="#F59E0B" stroke="#0F766E" strokeWidth="2" />
        <rect x="92" y="36" width="7" height="16" rx="3.5" fill="#F59E0B" stroke="#0F766E" strokeWidth="2" />

        {/* Unlocked Reward Accessories */}
        {resolvedAccessory === 'topi_arsitek' && (
          <g>
            <path d="M36 24 Q60 10 84 24 Z" fill="#FBBF24" stroke="#B45309" strokeWidth="2" />
            <rect x="31" y="21" width="58" height="5" rx="2.5" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
          </g>
        )}
        {resolvedAccessory === 'mahkota_emas' && (
          <path
            d="M42 22 L46 11 L54 17 L60 8 L66 17 L74 11 L78 22 Z"
            fill="#FBBF24"
            stroke="#B45309"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        )}

        {/* White Visor Frame */}
        <rect x="33" y="29" width="54" height="30" rx="12" fill="#F8FAFC" stroke="#0F766E" strokeWidth="2" />

        {/* Dark Screen Visor */}
        <rect x="37" y="32.5" width="46" height="23" rx="9" fill="#0F172A" />

        {/* Eyes with Blink Animation */}
        <g className="animate-higayon-blink">
          {isCelebrate || isHappy ? (
            <>
              <path d="M45 43 Q49 38 53 43" stroke="#38BDF8" strokeWidth="3.2" strokeLinecap="round" fill="none" />
              <path d="M67 43 Q71 38 75 43" stroke="#38BDF8" strokeWidth="3.2" strokeLinecap="round" fill="none" />
            </>
          ) : isThinking ? (
            <>
              <circle cx="49" cy="42" r="4" fill="#38BDF8" />
              <circle cx="50.5" cy="40.5" r="1.3" fill="#FFFFFF" />
              <line x1="66" y1="41" x2="75" y2="41" stroke="#38BDF8" strokeWidth="3.2" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="49" cy="42.5" r="4.2" fill="#38BDF8" />
              <circle cx="50.5" cy="41" r="1.4" fill="#FFFFFF" />
              <circle cx="71" cy="42.5" r="4.2" fill="#38BDF8" />
              <circle cx="72.5" cy="41" r="1.4" fill="#FFFFFF" />
            </>
          )}
        </g>

        {resolvedAccessory === 'kacamata_bintang' && (
          <g opacity="0.9">
            <rect x="41" y="36" width="16" height="12" rx="4" stroke="#FBBF24" strokeWidth="2" fill="none" />
            <rect x="63" y="36" width="16" height="12" rx="4" stroke="#FBBF24" strokeWidth="2" fill="none" />
            <line x1="57" y1="42" x2="63" y2="42" stroke="#FBBF24" strokeWidth="2" />
          </g>
        )}

        {/* Expressive Mouth (animated when Talking!) */}
        {isTalking ? (
          <ellipse
            cx="60"
            cy="50"
            rx="6"
            ry="3.6"
            fill="#FBBF24"
            className="animate-higayon-talk-mouth"
          />
        ) : isThinking ? (
          <line x1="54" y1="50" x2="66" y2="49" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
        ) : isEncourage ? (
          <path d="M54 49 Q60 52 66 49" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        ) : (
          <path d="M53 48 Q60 54 67 48" stroke="#FBBF24" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        )}

        {/* Subtle Cheek Glow */}
        <circle cx="43" cy="48.5" r="2.2" fill="#FB7185" fillOpacity="0.65" />
        <circle cx="77" cy="48.5" r="2.2" fill="#FB7185" fillOpacity="0.65" />
      </g>
    </svg>
  );
};

interface TutorGuideBarProps {
  message: string;
  mood?: TutorMood;
  speaker?: string;
  actionButton?: React.ReactNode;
  autoSpeakOnChange?: boolean;
  accessory?: HigayonAccessoryId;
}

export const TutorGuideBar: React.FC<TutorGuideBarProps> = ({
  message,
  mood = 'guide',
  speaker = 'HIGAYON · Tutor Robot',
  actionButton,
  autoSpeakOnChange = false,
  accessory,
}) => {
  const ctxAccessory = useContext(HigayonAccessoryContext);
  const resolvedAccessory = accessory ?? ctxAccessory;
  const speechAvailable = isSpeechSupported();
  const [voiceState, setVoiceState] = useState({
    isSpeaking: false,
    caption: message,
  });
  const [voiceMuted, setVoiceMuted] = useState(
    () => getSoundSettings().voiceEnabled === false || !getSoundSettings().enabled
  );

  useEffect(() => {
    return subscribeVoiceState((snap) => {
      setVoiceState({
        isSpeaking: snap.isSpeaking,
        caption: snap.caption || message,
      });
    });
  }, [message]);

  useEffect(() => {
    if (autoSpeakOnChange && message) {
      speakRobot(message);
    }
  }, [autoSpeakOnChange, message]);

  const handleReplay = () => {
    setVoiceMuted(false);
    replayLastRobotVoice(message);
  };

  const handleToggleVoice = () => {
    if (voiceState.isSpeaking || !voiceMuted) {
      stopRobotVoice();
      setVoiceMuted(true);
    } else {
      setVoiceMuted(false);
      speakRobot(message, { fromUserAction: true });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 rounded-2xl border-2 border-teal-200 bg-white/95 px-4 py-3 shadow-sm">
      <div className="shrink-0">
        <TutorRobot
          mood={mood}
          size={70}
          isSpeaking={voiceState.isSpeaking}
          accessory={resolvedAccessory}
        />
      </div>
      <div className="flex-1 text-center sm:text-left min-w-0">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <span className="text-xs font-bold tracking-wide text-teal-700">{speaker}</span>
          {voiceState.isSpeaking && (
            <span className="text-[11px] font-bold text-amber-700" aria-live="polite">
              · Sedang berbicara...
            </span>
          )}
          {!speechAvailable && (
            <span className="text-[11px] font-medium text-slate-500">
              · Mode teks (suara ucapan tidak didukung di browser ini)
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm sm:text-base font-medium text-slate-800 leading-snug">
          {message}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleReplay}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 cursor-pointer"
          aria-label="Putar ulang suara HIGAYON"
        >
          <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Suara HIGAYON</span>
        </button>

        <button
          type="button"
          onClick={handleToggleVoice}
          className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
          aria-label={voiceMuted ? 'Nyalakan suara ucapan HIGAYON' : 'Bisukan suara ucapan HIGAYON'}
        >
          {voiceMuted ? (
            <VolumeX className="h-4 w-4 text-slate-400" aria-hidden="true" />
          ) : (
            <Volume2 className="h-4 w-4 text-teal-600" aria-hidden="true" />
          )}
        </button>

        {actionButton}
      </div>
    </div>
  );
};
