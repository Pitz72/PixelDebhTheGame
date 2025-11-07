let audioContext: AudioContext | null = null;
let soundsLoaded = false;

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
};


export function initAudio() {
  if (audioContext || soundsLoaded) return;
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!audioContext) return;

    // A user gesture is required to start audio on some browsers.
    const unlockAudio = () => {
      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
      }
      if (audioContext && audioContext.state === 'running') {
        soundsLoaded = true;
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      }
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

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

export function playJingle(name: 'levelStart' | 'respawn') {
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