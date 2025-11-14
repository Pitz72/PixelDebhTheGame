let audioContext: AudioContext | null = null;
let soundsLoaded = false;

// --- Music variables ---
let musicContext: { oscillator: OscillatorNode, gainNode: GainNode, timer: number | null } | null = null;


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

// Programmatic sound definitions for a retro chiptune feel
const soundEffects: { [key: string]: SoundEffect } = {
  jump: { type: 'square', startFreq: 300, endFreq: 500, attack: 0.01, decay: 0.15, volume: 0.1 },
  collect: { type: 'sine', startFreq: 880, endFreq: 1000, attack: 0.01, decay: 0.2, volume: 0.2 },
  powerup: { type: 'sawtooth', startFreq: 440, endFreq: 880, attack: 0.05, decay: 0.3, volume: 0.25 },
  capture: { type: 'square', startFreq: 200, endFreq: 150, attack: 0.01, decay: 0.1, volume: 0.2 },
  launch: { type: 'square', startFreq: 150, endFreq: 600, attack: 0.01, decay: 0.2, volume: 0.2 },
  start: { type: 'sawtooth', startFreq: 220, endFreq: 660, attack: 0.1, decay: 0.4, volume: 0.2 },
  damage: { type: 'sawtooth', startFreq: 150, endFreq: 50, attack: 0.01, decay: 0.25, volume: 0.3 },
  gameOver: { type: 'sawtooth', startFreq: 440, endFreq: 110, attack: 0.1, decay: 0.8, volume: 0.3 },
  hit: { type: 'square', startFreq: 100, endFreq: 100, attack: 0.01, decay: 0.1, volume: 0.3 },
  levelClear: { type: 'triangle', startFreq: 523, endFreq: 1046, attack: 0.1, decay: 0.5, volume: 0.25 },
  bossShoot: { type: 'sawtooth', startFreq: 200, endFreq: 100, attack: 0.05, decay: 0.2, volume: 0.25 },
  bomberShoot: { type: 'sine', startFreq: 400, endFreq: 100, attack: 0.02, decay: 0.3, volume: 0.2 },
  bossHit: { type: 'square', startFreq: 440, endFreq: 220, attack: 0.01, decay: 0.3, volume: 0.4 },
  bossDefeat: { type: 'sawtooth', startFreq: 880, endFreq: 55, attack: 0.2, decay: 1.5, volume: 0.5 },
  playerShoot: { type: 'square', startFreq: 800, endFreq: 1200, attack: 0.01, decay: 0.1, volume: 0.15 },
};

const jingles: { [key: string]: Note[] } = {
  levelStart: [
    { freq: 523.25, duration: 0.1, type: 'square', volume: 0.1 }, // C5
    { freq: 659.25, duration: 0.1, type: 'square', volume: 0.1 }, // E5
    { freq: 783.99, duration: 0.2, type: 'square', volume: 0.1 }, // G5
  ],
  respawn: [
    { freq: 392.00, duration: 0.1, type: 'triangle', volume: 0.15 }, // G4
    { freq: 523.25, duration: 0.2, type: 'triangle', volume: 0.15 }, // C5
  ],
  extraLife: [
    { freq: 523.25, duration: 0.1, type: 'square', volume: 0.15 }, // C5
    { freq: 659.25, duration: 0.1, type: 'square', volume: 0.15 }, // E5
    { freq: 783.99, duration: 0.1, type: 'square', volume: 0.15 }, // G5
    { freq: 1046.50, duration: 0.2, type: 'square', volume: 0.15 }, // C6
  ],
};

const music: { [key: string]: Note[] } = {
  startScreenTheme: [
    // Bar 1
    { freq: 392.00, duration: 0.15, type: 'square', volume: 0.1 }, // G4
    { freq: 523.25, duration: 0.15, type: 'square', volume: 0.1 }, // C5
    { freq: 659.25, duration: 0.15, type: 'square', volume: 0.1 }, // E5
    { freq: 783.99, duration: 0.15, type: 'square', volume: 0.1 }, // G5
    // Bar 2
    { freq: 698.46, duration: 0.3, type: 'square', volume: 0.1 },  // F5
    { freq: 659.25, duration: 0.3, type: 'square', volume: 0.1 },  // E5
    // Bar 3
    { freq: 349.23, duration: 0.15, type: 'square', volume: 0.1 }, // F4
    { freq: 440.00, duration: 0.15, type: 'square', volume: 0.1 }, // A4
    { freq: 587.33, duration: 0.15, type: 'square', volume: 0.1 }, // D5
    { freq: 698.46, duration: 0.15, type: 'square', volume: 0.1 }, // F5
    // Bar 4
    { freq: 659.25, duration: 0.2, type: 'square', volume: 0.1 },  // E5
    { freq: 587.33, duration: 0.2, type: 'square', volume: 0.1 },  // D5
    { freq: 523.25, duration: 0.2, type: 'square', volume: 0.1 },  // C5
],
  standardTheme: [
    { freq: 220.00, duration: 0.15, type: 'square', volume: 0.07 }, // A3
    { freq: 220.00, duration: 0.15, type: 'square', volume: 0.07 }, // A3
    { freq: 329.63, duration: 0.15, type: 'square', volume: 0.07 }, // E4
    { freq: 220.00, duration: 0.15, type: 'square', volume: 0.07 }, // A3
    { freq: 261.63, duration: 0.15, type: 'square', volume: 0.07 }, // C4
    { freq: 261.63, duration: 0.15, type: 'square', volume: 0.07 }, // C4
    { freq: 392.00, duration: 0.15, type: 'square', volume: 0.07 }, // G4
    { freq: 261.63, duration: 0.15, type: 'square', volume: 0.07 }, // C4
  ],
  bossTheme: [
      { freq: 110.00, duration: 0.4, type: 'sawtooth', volume: 0.08 }, // A2
      { freq: 103.83, duration: 0.4, type: 'sawtooth', volume: 0.08 }, // G#2
      { freq: 110.00, duration: 0.4, type: 'sawtooth', volume: 0.08 }, // A2
      { freq: 123.47, duration: 0.4, type: 'sawtooth', volume: 0.08 }, // B2
  ]
};


export function initAudio() {
  if (soundsLoaded) return;
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume returns a promise, but we can assume it will work after a user gesture.
    // Set the flag immediately to allow subsequent sound calls to go through.
    audioContext.resume();
    soundsLoaded = true;
  } catch (e) {
    console.error("Could not initialize audio context", e);
  }
}

export function playSound(name: string) {
  if (!soundsLoaded || !audioContext) {
    return;
  }

  const effect = soundEffects[name];
  if (!effect) {
    // console.warn(`Sound effect not found: ${name}`);
    return;
  }
  
  try {
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Set parameters
    oscillator.type = effect.type;
    gainNode.gain.setValueAtTime(0, now);

    // Volume envelope
    gainNode.gain.linearRampToValueAtTime(effect.volume, now + effect.attack);
    gainNode.gain.linearRampToValueAtTime(0, now + effect.attack + effect.decay);

    // Frequency envelope
    oscillator.frequency.setValueAtTime(effect.startFreq, now);
    oscillator.frequency.exponentialRampToValueAtTime(effect.endFreq, now + effect.attack + effect.decay);

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
    gainNode.connect(audioContext!.destination);

    oscillator.type = note.type;
    oscillator.frequency.setValueAtTime(note.freq, startTime);
    
    // Envelope for each note
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(note.volume, startTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, startTime + note.duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + note.duration);

    startTime += note.duration; // Schedule next note right after
  });
}


export function playMusicLoop(name: 'startScreenTheme' | 'standardTheme' | 'bossTheme') {
    if (!soundsLoaded || !audioContext) return;
    stopMusic(); // Stop any existing music before starting new one

    const track = music[name];
    if (!track) return;

    let noteIndex = 0;
    const playNote = () => {
        if (!audioContext || !musicContext) return; // Stop if music has been stopped
        const note = track[noteIndex % track.length];
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const now = audioContext.currentTime;
        oscillator.type = note.type;
        oscillator.frequency.setValueAtTime(note.freq, now);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(note.volume, now + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, now + note.duration - 0.01);

        oscillator.start(now);
        oscillator.stop(now + note.duration);

        noteIndex++;
        if (musicContext) {
            musicContext.timer = window.setTimeout(playNote, note.duration * 1000);
        }
    };

    musicContext = {
        oscillator: audioContext.createOscillator(), // Dummy, not used directly
        gainNode: audioContext.createGain(), // Dummy, not used directly
        timer: null,
    };
    playNote();
}

export function stopMusic() {
    if (!soundsLoaded || !audioContext || !musicContext) return;

    if (musicContext.timer) {
        clearTimeout(musicContext.timer);
    }
    musicContext = null;
}