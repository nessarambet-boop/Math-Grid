import { getSoundSettings, sfx } from './sound';

export interface VoiceStateSnapshot {
  isSpeaking: boolean;
  caption: string;
  supported: boolean;
  hasIndonesianVoice: boolean;
}

type VoiceListener = (state: VoiceStateSnapshot) => void;

let userHasInteracted = false;
let lastSpokenText = '';
let isSpeaking = false;
let currentCaption = '';
let fallbackTimer: number | null = null;
const listeners = new Set<VoiceListener>();

export function markUserInteraction() {
  userHasInteracted = true;
}

export function isSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined'
  );
}

export function findIndonesianVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;
  try {
    const voices = window.speechSynthesis.getVoices();
    const idVoice =
      voices.find((v) => v.lang.toLowerCase() === 'id-id') ||
      voices.find((v) => v.lang.toLowerCase().startsWith('id')) ||
      voices.find((v) => v.name.toLowerCase().includes('indonesia'));
    return idVoice ?? null;
  } catch {
    return null;
  }
}

function emit() {
  const snap: VoiceStateSnapshot = {
    isSpeaking,
    caption: currentCaption,
    supported: isSpeechSupported(),
    hasIndonesianVoice: Boolean(findIndonesianVoice()),
  };
  listeners.forEach((fn) => fn(snap));
}

export function subscribeVoiceState(listener: VoiceListener): () => void {
  listeners.add(listener);
  listener({
    isSpeaking,
    caption: currentCaption,
    supported: isSpeechSupported(),
    hasIndonesianVoice: Boolean(findIndonesianVoice()),
  });
  return () => {
    listeners.delete(listener);
  };
}

export function stopRobotVoice() {
  if (fallbackTimer !== null) {
    window.clearTimeout(fallbackTimer);
    fallbackTimer = null;
  }
  if (isSpeechSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore synthesis cancel errors
    }
  }
  isSpeaking = false;
  emit();
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', stopRobotVoice);
  window.addEventListener('beforeunload', stopRobotVoice);
}

export interface SpeakOptions {
  /** Force play even if called directly from an explicit user button like Replay/Test */
  fromUserAction?: boolean;
  onEnd?: () => void;
}

export function speakRobot(text: string, options: SpeakOptions = {}) {
  const cleanText = text.trim();
  if (!cleanText) return;

  lastSpokenText = cleanText;
  currentCaption = cleanText;

  if (options.fromUserAction) {
    userHasInteracted = true;
  }

  // Browser autoplay protection: never play voice automatically before user interaction
  if (!userHasInteracted) {
    isSpeaking = false;
    emit();
    return;
  }

  const settings = getSoundSettings();
  if (!settings.enabled || settings.voiceEnabled === false || settings.volume <= 0) {
    stopRobotVoice();
    return;
  }

  // Stop any active utterance so robot voices never overlap
  stopRobotVoice();

  if (isSpeechSupported()) {
    try {
      const utter = new SpeechSynthesisUtterance(cleanText);
      const idVoice = findIndonesianVoice();
      if (idVoice) {
        utter.voice = idVoice;
      }
      utter.lang = idVoice?.lang || 'id-ID';
      utter.volume = Math.min(1, Math.max(0, settings.volume));
      utter.rate = Math.min(1.4, Math.max(0.7, settings.voiceRate ?? 1.0));
      utter.pitch = 1.08;

      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        if (fallbackTimer !== null) {
          window.clearTimeout(fallbackTimer);
          fallbackTimer = null;
        }
        isSpeaking = false;
        emit();
        options.onEnd?.();
      };

      utter.onstart = () => {
        isSpeaking = true;
        emit();
      };
      utter.onend = finish;
      utter.onerror = finish;

      isSpeaking = true;
      emit();
      window.speechSynthesis.speak(utter);

      // Safety fallback timeout in headless/silent browsers where onend never fires
      const estimatedMs = Math.min(9000, Math.max(1600, cleanText.length * 65));
      fallbackTimer = window.setTimeout(finish, estimatedMs);
      return;
    } catch {
      // Fall through to chime fallback
    }
  }

  // Fallback when SpeechSynthesis is unavailable: gentle tone + synced talking beat
  sfx.voiceFallback();
  isSpeaking = true;
  emit();
  fallbackTimer = window.setTimeout(() => {
    isSpeaking = false;
    emit();
    options.onEnd?.();
  }, 1500);
}

export function replayLastRobotVoice(fallbackText?: string) {
  const target = (fallbackText || lastSpokenText || '').trim();
  if (!target) return;
  speakRobot(target, { fromUserAction: true });
}
