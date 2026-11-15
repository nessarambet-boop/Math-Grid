import type { SoundSettings } from './types';

let audioCtx: AudioContext | null = null;
let bgMusicTimer: number | null = null;
let bgMusicRunning = false;
let bgNoteIndex = 0;

let currentSettings: SoundSettings = {
  enabled: true,
  volume: 0.65,
  voiceEnabled: true,
  voiceRate: 1.0,
  animationsEnabled: true,
  musicEnabled: true,
};

const BG_MELODY_NOTES = [261.63, 329.63, 392.0, 523.25, 440.0, 392.0, 329.63, 293.66];

export function setSoundSettings(settings: SoundSettings) {
  currentSettings = settings;
  if (!settings.enabled || settings.musicEnabled === false || settings.volume <= 0) {
    stopBgMusic();
  }
}

export function getSoundSettings(): SoundSettings {
  return currentSettings;
}

export function startBgMusic() {
  if (typeof window === 'undefined') return;
  if (!currentSettings.enabled || currentSettings.musicEnabled === false || currentSettings.volume <= 0) {
    stopBgMusic();
    return;
  }
  if (bgMusicRunning) return;
  bgMusicRunning = true;

  const scheduleNextNote = () => {
    if (!bgMusicRunning) return;
    if (!currentSettings.enabled || currentSettings.musicEnabled === false || currentSettings.volume <= 0) {
      stopBgMusic();
      return;
    }
    const ctx = getContext();
    if (ctx) {
      try {
        const freq = BG_MELODY_NOTES[bgNoteIndex % BG_MELODY_NOTES.length];
        bgNoteIndex += 1;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        const softVol = Math.max(0.001, currentSettings.volume * 0.032);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(softVol, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.72);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.75);
      } catch {
        // Ignore restricted audio environments
      }
    }
    bgMusicTimer = window.setTimeout(scheduleNextNote, 820);
  };

  scheduleNextNote();
}

export function stopBgMusic() {
  bgMusicRunning = false;
  if (bgMusicTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(bgMusicTimer);
    bgMusicTimer = null;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', stopBgMusic);
  window.addEventListener('beforeunload', stopBgMusic);
}

function getContext(): AudioContext | null {
  if (!currentSettings.enabled || currentSettings.volume <= 0) return null;
  if (typeof window === 'undefined') return null;
  const AudioContextCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextCtor();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(
  freq: number,
  durationSec: number,
  type: OscillatorType = 'sine',
  gainScale = 0.16,
  delaySec = 0
) {
  const ctx = getContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    const vol = Math.max(0.001, currentSettings.volume * gainScale);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  } catch {
    // Ignore audio errors in restricted headless contexts
  }
}

export const sfx = {
  click() {
    playTone(540, 0.07, 'triangle', 0.12);
  },
  tileTap(pitchOffset = 0) {
    playTone(440 + pitchOffset * 28, 0.08, 'sine', 0.14);
  },
  tileErase() {
    playTone(280, 0.07, 'triangle', 0.1);
  },
  step() {
    playTone(620, 0.06, 'sine', 0.08);
  },
  success() {
    playTone(523.25, 0.12, 'triangle', 0.18, 0);
    playTone(659.25, 0.12, 'triangle', 0.18, 0.09);
    playTone(783.99, 0.22, 'triangle', 0.2, 0.18);
  },
  victory() {
    playTone(523.25, 0.14, 'triangle', 0.2, 0);
    playTone(659.25, 0.14, 'triangle', 0.2, 0.1);
    playTone(783.99, 0.14, 'triangle', 0.2, 0.2);
    playTone(1046.5, 0.34, 'triangle', 0.24, 0.32);
  },
  error() {
    playTone(240, 0.14, 'sawtooth', 0.08, 0);
    playTone(196, 0.18, 'sawtooth', 0.08, 0.11);
  },
  collectStar() {
    playTone(880, 0.09, 'sine', 0.18, 0);
    playTone(1174.66, 0.18, 'triangle', 0.2, 0.07);
  },
  levelUnlock() {
    playTone(440, 0.1, 'triangle', 0.18, 0);
    playTone(554.37, 0.1, 'triangle', 0.18, 0.08);
    playTone(659.25, 0.1, 'triangle', 0.18, 0.16);
    playTone(880, 0.28, 'triangle', 0.22, 0.24);
  },
  buildingComplete() {
    playTone(392, 0.11, 'triangle', 0.18, 0);
    playTone(523.25, 0.11, 'triangle', 0.18, 0.09);
    playTone(659.25, 0.12, 'triangle', 0.2, 0.18);
    playTone(783.99, 0.28, 'triangle', 0.22, 0.28);
  },
  achievementUnlocked() {
    playTone(587.33, 0.1, 'triangle', 0.18, 0);
    playTone(739.99, 0.1, 'triangle', 0.18, 0.08);
    playTone(880, 0.12, 'triangle', 0.2, 0.16);
    playTone(1174.66, 0.35, 'triangle', 0.24, 0.26);
  },
  voiceFallback() {
    playTone(660, 0.08, 'sine', 0.09, 0);
    playTone(784, 0.1, 'sine', 0.09, 0.07);
  },
};
