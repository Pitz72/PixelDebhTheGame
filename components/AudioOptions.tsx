import React, { useCallback, useEffect, useState } from 'react';
import * as soundService from '../services/soundService';
import type { VolumeKind } from '../services/soundService';

interface AudioOptionsProps {
  onClose: () => void;
}

type RowId = VolumeKind | 'mute';

const ROWS: { id: RowId; label: string }[] = [
  { id: 'master', label: 'VOLUME GENERALE' },
  { id: 'music', label: 'MUSICA' },
  { id: 'sfx', label: 'EFFETTI' },
  { id: 'mute', label: 'MUTO' },
];

const STEP = 0.05;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * Audio settings panel. It listens on the capture phase and swallows the keys it uses, so
 * the screen underneath (start screen, pause menu) does not also react to them.
 */
const AudioOptions: React.FC<AudioOptionsProps> = ({ onClose }) => {
  const [row, setRow] = useState(0);
  const [volumes, setVolumes] = useState<Record<VolumeKind, number>>({
    master: soundService.getVolume('master'),
    music: soundService.getVolume('music'),
    sfx: soundService.getVolume('sfx'),
  });
  const [muted, setMuted] = useState(soundService.isMuted());

  const setLevel = useCallback((kind: VolumeKind, value: number) => {
    const next = Math.round(clamp01(value) * 100) / 100;
    soundService.setVolume(kind, next);
    setVolumes(v => ({ ...v, [kind]: next }));
    if (kind === 'sfx') soundService.playSound('menuMove'); // lets you hear the new level
  }, []);

  const toggleMute = useCallback(() => setMuted(soundService.toggleMuted()), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (!['escape', 'o', 'm', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'enter', ' '].includes(k)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.repeat && (k === 'escape' || k === 'o' || k === 'm' || k === 'enter' || k === ' ')) return;

      if (k === 'escape' || k === 'o') return onClose();
      if (k === 'm') return toggleMute();
      if (k === 'arrowup') return setRow(r => (r + ROWS.length - 1) % ROWS.length);
      if (k === 'arrowdown') return setRow(r => (r + 1) % ROWS.length);

      const id = ROWS[row].id;
      if (id === 'mute') {
        if (k === 'enter' || k === ' ' || k === 'arrowleft' || k === 'arrowright') toggleMute();
      } else if (k === 'arrowleft') {
        setLevel(id, soundService.getVolume(id) - STEP);
      } else if (k === 'arrowright') {
        setLevel(id, soundService.getVolume(id) + STEP);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [row, onClose, setLevel, toggleMute]);

  return (
    <div
      className="absolute inset-0 z-[70] flex items-center justify-center bg-[#050114]/90 backdrop-blur-sm text-white"
      onClick={e => e.stopPropagation()}
    >
      <div className="w-[760px] rounded-3xl border-2 border-cyan-400/60 bg-[#0b0420] px-10 py-8 shadow-[0_0_45px_rgba(0,229,255,0.25)]">
        <h2
          className="mb-6 text-center text-5xl font-black tracking-widest text-cyan-300"
          style={{ textShadow: '0 0 20px #00e5ff' }}
        >
          AUDIO
        </h2>

        <div className="space-y-3">
          {ROWS.map((r, i) => {
            const active = i === row;
            return (
              <div
                key={r.id}
                onMouseEnter={() => setRow(i)}
                className={`flex items-center justify-between gap-6 rounded-xl border px-5 py-3 ${
                  active ? 'border-yellow-300 bg-white/10' : 'border-transparent bg-white/5'
                }`}
              >
                <span className={`w-60 whitespace-nowrap text-lg font-bold tracking-wider ${active ? 'text-yellow-300' : 'text-cyan-200'}`}>
                  {r.label}
                </span>
                {r.id === 'mute' ? (
                  <button
                    onClick={toggleMute}
                    className={`rounded-lg border-2 px-6 py-1 text-lg font-black tracking-widest ${
                      muted ? 'border-pink-400 text-pink-300' : 'border-cyan-400 text-cyan-300'
                    }`}
                  >
                    {muted ? 'SÌ' : 'NO'}
                  </button>
                ) : (
                  <>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={Math.round(volumes[r.id] * 100)}
                      onChange={e => setLevel(r.id as VolumeKind, Number(e.target.value) / 100)}
                      className="h-2 flex-1 cursor-pointer accent-cyan-400"
                      aria-label={r.label}
                    />
                    <span className="w-14 text-right font-mono text-lg text-white">{Math.round(volumes[r.id] * 100)}%</span>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-sm text-gray-300">
          <strong className="text-cyan-400">[↑ ↓]</strong> Scegli •{' '}
          <strong className="text-cyan-400">[← →]</strong> Regola •{' '}
          <strong className="text-cyan-400">[M]</strong> Muto •{' '}
          <strong className="text-cyan-400">[ESC]</strong> o <strong className="text-cyan-400">[O]</strong> Chiudi
        </p>
      </div>
    </div>
  );
};

export default AudioOptions;
