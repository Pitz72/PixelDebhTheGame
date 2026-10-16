let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let soundsLoaded = false;
let muted = false;

// --- Music variables ---
let musicContext: { timer: number | null; activeOscillator?: OscillatorNode | null } | null = null;
let currentMusicName: string | null = null;
let pausedMusicName: string | null = null;

/** Every voice goes through the master gain so volume / mute apply to all of them. */
const output = (): AudioNode => masterGain ?? (audioContext as AudioContext).destination;

interface SoundEffect {
  type: OscillatorType;
  startFreq: number;
  endFreq: number;
  attack: number;
  decay: number;
  volume: number;
}

interface Note {
  freq: number;
  duration: number; // in seconds
  type: OscillatorType;
  volume: number;
}

const soundEffects: { [key: string]: SoundEffect } = {
  jump: { type: 'square', startFreq: 280, endFreq: 560, attack: 0.01, decay: 0.14, volume: 0.12 },
  doubleJump: { type: 'triangle', startFreq: 420, endFreq: 880, attack: 0.01, decay: 0.16, volume: 0.15 },
  collect: { type: 'sine', startFreq: 880, endFreq: 1320, attack: 0.01, decay: 0.18, volume: 0.2 },
  checkpoint: { type: 'triangle', startFreq: 523.25, endFreq: 1046.5, attack: 0.02, decay: 0.35, volume: 0.22 },
  powerup: { type: 'sawtooth', startFreq: 440, endFreq: 987.77, attack: 0.04, decay: 0.3, volume: 0.22 },
  capture: { type: 'square', startFreq: 260, endFreq: 160, attack: 0.01, decay: 0.1, volume: 0.2 },
  launch: { type: 'square', startFreq: 160, endFreq: 680, attack: 0.01, decay: 0.2, volume: 0.22 },
  start: { type: 'sawtooth', startFreq: 220, endFreq: 660, attack: 0.08, decay: 0.35, volume: 0.2 },
  damage: { type: 'sawtooth', startFreq: 160, endFreq: 55, attack: 0.01, decay: 0.25, volume: 0.28 },
  gameOver: { type: 'sawtooth', startFreq: 440, endFreq: 110, attack: 0.1, decay: 0.8, volume: 0.28 },
  hit: { type: 'square', startFreq: 120, endFreq: 80, attack: 0.01, decay: 0.1, volume: 0.25 },
  levelClear: { type: 'triangle', startFreq: 523.25, endFreq: 1046.5, attack: 0.08, decay: 0.5, volume: 0.25 },
  bossShoot: { type: 'sawtooth', startFreq: 220, endFreq: 95, attack: 0.03, decay: 0.18, volume: 0.2 },
  bomberShoot: { type: 'sine', startFreq: 400, endFreq: 110, attack: 0.02, decay: 0.28, volume: 0.18 },
  bossHit: { type: 'square', startFreq: 480, endFreq: 220, attack: 0.01, decay: 0.22, volume: 0.32 },
  bossDefeat: { type: 'sawtooth', startFreq: 880, endFreq: 55, attack: 0.18, decay: 1.4, volume: 0.42 },
  playerShoot: { type: 'square', startFreq: 780, endFreq: 1240, attack: 0.01, decay: 0.09, volume: 0.14 },
};

const jingles: { [key: string]: Note[] } = {
  levelStart: [
    { freq: 523.25, duration: 0.1, type: 'square', volume: 0.1 },
    { freq: 659.25, duration: 0.1, type: 'square', volume: 0.1 },
    { freq: 783.99, duration: 0.18, type: 'square', volume: 0.12 },
  ],
  respawn: [
    { freq: 392.00, duration: 0.1, type: 'triangle', volume: 0.14 },
    { freq: 523.25, duration: 0.2, type: 'triangle', volume: 0.14 },
  ],
  extraLife: [
    { freq: 523.25, duration: 0.09, type: 'square', volume: 0.15 },
    { freq: 659.25, duration: 0.09, type: 'square', volume: 0.15 },
    { freq: 783.99, duration: 0.09, type: 'square', volume: 0.15 },
    { freq: 1046.50, duration: 0.22, type: 'square', volume: 0.16 },
  ],
  standardTheme: [],
};

const music: { [key: string]: Note[] } = {
  startScreenTheme: [
    { freq: 220.00, duration: 0.15, type: 'square', volume: 0.08 },
    { freq: 220.00, duration: 0.15, type: 'square', volume: 0.08 },
    { freq: 440.00, duration: 0.15, type: 'square', volume: 0.08 },
    { freq: 329.63, duration: 0.15, type: 'square', volume: 0.08 },
    { freq: 261.63, duration: 0.15, type: 'square', volume: 0.08 },
    { freq: 392.00, duration: 0.15, type: 'square', volume: 0.08 },
    { freq: 329.63, duration: 0.30, type: 'triangle', volume: 0.09 },
  ],
  adventureTheme: [
    { freq: 261.63, duration: 0.18, type: 'square', volume: 0.07 },
    { freq: 329.63, duration: 0.18, type: 'square', volume: 0.07 },
    { freq: 392.00, duration: 0.18, type: 'square', volume: 0.07 },
    { freq: 523.25, duration: 0.18, type: 'square', volume: 0.07 },
    { freq: 392.00, duration: 0.18, type: 'square', volume: 0.07 },
    { freq: 329.63, duration: 0.18, type: 'square', volume: 0.07 },
    { freq: 440.00, duration: 0.36, type: 'triangle', volume: 0.08 },
    { freq: 349.23, duration: 0.36, type: 'triangle', volume: 0.08 },
    { freq: 293.66, duration: 0.18, type: 'square', volume: 0.07 },
    { freq: 392.00, duration: 0.18, type: 'square', volume: 0.07 },
  ],
  industrialTheme: [
    { freq: 110.00, duration: 0.15, type: 'sawtooth', volume: 0.08 },
    { freq: 110.00, duration: 0.15, type: 'sawtooth', volume: 0.08 },
    { freq: 0,      duration: 0.10, type: 'sawtooth', volume: 0 },
    { freq: 146.83, duration: 0.20, type: 'square', volume: 0.07 },
    { freq: 110.00, duration: 0.20, type: 'sawtooth', volume: 0.08 },
    { freq: 82.41,  duration: 0.35, type: 'sawtooth', volume: 0.09 },
    { freq: 123.47, duration: 0.20, type: 'square', volume: 0.07 },
    { freq: 130.81, duration: 0.20, type: 'square', volume: 0.07 },
  ],
  etherealTheme: [
    { freq: 659.25, duration: 0.45, type: 'sine', volume: 0.07 },
    { freq: 587.33, duration: 0.45, type: 'sine', volume: 0.07 },
    { freq: 523.25, duration: 0.45, type: 'sine', volume: 0.07 },
    { freq: 783.99, duration: 0.45, type: 'sine', volume: 0.07 },
    { freq: 1046.50, duration: 0.55, type: 'triangle', volume: 0.06 },
    { freq: 0, duration: 0.15, type: 'sine', volume: 0 },
    { freq: 880.00, duration: 0.55, type: 'sine', volume: 0.06 },
  ],
  bossTheme: [
    { freq: 110.00, duration: 0.16, type: 'sawtooth', volume: 0.09 },
    { freq: 103.83, duration: 0.16, type: 'sawtooth', volume: 0.09 },
    { freq: 110.00, duration: 0.16, type: 'sawtooth', volume: 0.09 },
    { freq: 123.47, duration: 0.16, type: 'sawtooth', volume: 0.09 },
    { freq: 87.31,  duration: 0.16, type: 'sawtooth', volume: 0.10 },
    { freq: 82.41,  duration: 0.16, type: 'sawtooth', volume: 0.10 },
  ],
};

// Map short theme names from LevelData ('adventure', 'industrial', 'ethereal', 'boss') to full track keys
const themeAliasMap: Record<string, string> = {
  adventure: 'adventureTheme',
  industrial: 'industrialTheme',
  ethereal: 'etherealTheme',
  boss: 'bossTheme',
  standardTheme: 'adventureTheme',
};

export function initAudio() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      masterGain = audioContext.createGain();
      masterGain.gain.value = muted ? 0 : 1;
      masterGain.connect(audioContext.destination);
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    soundsLoaded = true;
  } catch (e) {
    console.error("Could not initialize audio context", e);
  }
}

export function playSound(name: string) {
  if (!soundsLoaded || !audioContext) {
    initAudio();
  }
  if (!audioContext) return;
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }

  const effect = soundEffects[name];
  if (!effect) return;

  try {
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(output());

    oscillator.type = effect.type;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(effect.volume, now + effect.attack);
    gainNode.gain.linearRampToValueAtTime(0, now + effect.attack + effect.decay);

    oscillator.frequency.setValueAtTime(Math.max(1, effect.startFreq), now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, effect.endFreq), now + effect.attack + effect.decay);

    oscillator.start(now);
    oscillator.stop(now + effect.attack + effect.decay);
  } catch (e) {
    console.error(`Could not play sound: ${name}`, e);
  }
}

export function playJingle(name: 'levelStart' | 'respawn' | 'extraLife') {
  if (!soundsLoaded || !audioContext) return;
  const jingle = jingles[name];
  if (!jingle) return;

  const now = audioContext.currentTime;
  let startTime = now;

  jingle.forEach(note => {
    const oscillator = audioContext!.createOscillator();
    const gainNode = audioContext!.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(output());

    oscillator.type = note.type;
    oscillator.frequency.setValueAtTime(Math.max(1, note.freq), startTime);

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(note.volume, startTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, startTime + note.duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + note.duration);

    startTime += note.duration;
  });
}

export function playMusicLoop(name: string) {
  if (!soundsLoaded || !audioContext) {
    initAudio();
  }
  if (!audioContext) return;
  stopMusic();

  const trackName = themeAliasMap[name] || name;
  const track = music[trackName];
  if (!track || track.length === 0) return;
  currentMusicName = name;
  pausedMusicName = null;

  let noteIndex = 0;
  musicContext = { timer: null, activeOscillator: null };

  const playNote = () => {
    if (!audioContext || !musicContext) return;
    const note = track[noteIndex % track.length];

    if (note.freq > 0 && note.volume > 0) {
      try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(output());

        const now = audioContext.currentTime;
        oscillator.type = note.type;
        oscillator.frequency.setValueAtTime(note.freq, now);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(note.volume, now + 0.015);
        gainNode.gain.linearRampToValueAtTime(0, now + Math.max(0.03, note.duration - 0.015));

        oscillator.start(now);
        oscillator.stop(now + note.duration);
        musicContext.activeOscillator = oscillator;
      } catch {
        // Ignore transient WebAudio errors
      }
    }

    noteIndex++;
    if (musicContext) {
      musicContext.timer = window.setTimeout(playNote, note.duration * 1000);
    }
  };

  playNote();
}

/** Pause = stop the loop but remember it, so resumeMusic() restarts the same track. */
export function pauseMusic() {
  if (!musicContext || !currentMusicName) return;
  const name = currentMusicName;
  stopMusic();
  pausedMusicName = name;
}

export function resumeMusic() {
  if (!pausedMusicName) return;
  const name = pausedMusicName;
  pausedMusicName = null;
  playMusicLoop(name);
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean) {
  muted = value;
  if (masterGain && audioContext) {
    masterGain.gain.setTargetAtTime(muted ? 0 : 1, audioContext.currentTime, 0.015);
  }
}

export function toggleMuted(): boolean {
  setMuted(!muted);
  return muted;
}

export function stopMusic() {
  currentMusicName = null;
  pausedMusicName = null;
  if (!musicContext) return;
  if (musicContext.timer) {
    clearTimeout(musicContext.timer);
  }
  if (musicContext.activeOscillator) {
    try {
      musicContext.activeOscillator.stop();
    } catch {
      // Already stopped
    }
  }
  musicContext = null;
}
