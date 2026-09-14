// Web Audio API Synthesizer for Meteorological Severe Weather Alert Buzzer & Beep Sounds
// Zero external audio files or dependencies required; 100% client-side compatible

type AlertSoundType = "cyclone" | "monsoon" | "loo" | "winter" | "emergency" | "beep";

let audioCtx: AudioContext | null = null;
let isMuted: boolean = localStorage.getItem("weather_sound_muted") === "true";
const soundListeners = new Set<(isPlaying: boolean, type: AlertSoundType) => void>();

function notifyListeners(isPlaying: boolean, type: AlertSoundType) {
  soundListeners.forEach((listener) => listener(isPlaying, type));
}

export function subscribeAlertSound(callback: (isPlaying: boolean, type: AlertSoundType) => void): () => void {
  soundListeners.add(callback);
  return () => {
    soundListeners.delete(callback);
  };
}

export function getAudioMuted(): boolean {
  return isMuted;
}

export function setAudioMuted(muted: boolean): boolean {
  isMuted = muted;
  localStorage.setItem("weather_sound_muted", muted ? "true" : "false");
  return isMuted;
}

export function toggleAudioMuted(): boolean {
  return setAudioMuted(!isMuted);
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play a single authentic emergency buzzer/beep sound alert
 * Designed for immediate severe weather notifications (Cyclone, Heavy Monsoon, Loo, Sheet Lahar)
 */
export function playOneAlertBuzzer(type: AlertSoundType = "cyclone"): Promise<boolean> {
  if (isMuted) {
    return Promise.resolve(false);
  }

  // Summer ("loo") and winter ("winter") alert sounds are removed and disabled
  if (type === "loo" || type === "winter") {
    return Promise.resolve(false);
  }

  const ctx = getAudioContext();
  if (!ctx) return Promise.resolve(false);

  try {
    const now = ctx.currentTime;
    notifyListeners(true, type);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.28, now);
    masterGain.connect(ctx.destination);

    if (type === "cyclone" || type === "emergency") {
      // Official Emergency Alert System (EAS) Dual-Tone Buzzer: 853 Hz + 960 Hz
      // Two distinct urgent pulses: [280ms BZZZ] -> [70ms gap] -> [350ms BZZZ]
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const pulseGain = ctx.createGain();

      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(853, now);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(960, now);

      // Pulse 1: 0 to 0.28s
      pulseGain.gain.setValueAtTime(0.001, now);
      pulseGain.gain.exponentialRampToValueAtTime(0.9, now + 0.03);
      pulseGain.gain.setValueAtTime(0.9, now + 0.25);
      pulseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      // Pulse 2: 0.35s to 0.72s
      pulseGain.gain.setValueAtTime(0.001, now + 0.35);
      pulseGain.gain.exponentialRampToValueAtTime(1.0, now + 0.38);
      pulseGain.gain.setValueAtTime(1.0, now + 0.68);
      pulseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);

      osc1.connect(pulseGain);
      osc2.connect(pulseGain);
      pulseGain.connect(masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.75);
      osc2.stop(now + 0.75);

      setTimeout(() => {
        notifyListeners(false, type);
      }, 760);

    } else if (type === "monsoon") {
      // High-priority monsoon cloudburst double beep: 780 Hz & 880 Hz
      const osc = ctx.createOscillator();
      const pulseGain = ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(784, now); // G5 note
      osc.frequency.setValueAtTime(880, now + 0.2); // A5 note

      pulseGain.gain.setValueAtTime(0.001, now);
      pulseGain.gain.exponentialRampToValueAtTime(0.6, now + 0.02);
      pulseGain.gain.setValueAtTime(0.6, now + 0.16);
      pulseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

      pulseGain.gain.setValueAtTime(0.001, now + 0.26);
      pulseGain.gain.exponentialRampToValueAtTime(0.7, now + 0.28);
      pulseGain.gain.setValueAtTime(0.7, now + 0.46);
      pulseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.50);

      osc.connect(pulseGain);
      pulseGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.52);

      setTimeout(() => {
        notifyListeners(false, type);
      }, 540);

    } else {
      // Standard single crisp meteorological beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(987.77, now); // B5 note

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.7, now + 0.02);
      gain.gain.setValueAtTime(0.7, now + 0.28);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.35);

      setTimeout(() => {
        notifyListeners(false, type);
      }, 360);
    }

    return Promise.resolve(true);
  } catch (err) {
    console.warn("Could not play audio alert:", err);
    notifyListeners(false, type);
    return Promise.resolve(false);
  }
}
