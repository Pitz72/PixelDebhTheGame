import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as soundService from '../services/soundService';
import { t } from '../services/i18n';

/** The 28-second animated intro of the Pixel Debh channel (rendered from the Remotion project, WebM VP9 + Opus). */
export const INTRO_VIDEO = '/intro/pixeldebh-intro.webm';

interface DebhIntroVideoProps {
  onDone: () => void;
}

/**
 * Plays the channel intro full-window on black, with its own sound at the game's master volume.
 * Esc, Enter, Space or a click skip it (not in the first moments, so a key pressed while the Runtime
 * logo ends does not skip this too). If the sound is not allowed to start the picture plays muted.
 * It ends on its own iris-out to black, so there is nothing to fade.
 */
const DebhIntroVideo: React.FC<DebhIntroVideoProps> = ({ onDone }) => {
  const video = useRef<HTMLVideoElement>(null);
  const fatto = useRef(false);
  const fine = useRef(onDone);
  fine.current = onDone;
  const [hint, setHint] = useState(false);

  const chiudi = useCallback(() => {
    if (fatto.current) return;
    fatto.current = true;
    fine.current();
  }, []);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const montato = performance.now();
    const sync = () => {
      v.muted = soundService.isMuted();
      v.volume = Math.max(0, Math.min(1, soundService.getVolume('master')));
    };
    sync();
    // the mute key (M) and the volume are the game's own: follow them while the picture plays
    const follow = window.setInterval(sync, 200);
    v.play().catch(() => {
      // sound not allowed to start without a key press: the picture still plays, muted
      v.muted = true;
      v.play().catch(chiudi);
    });
    const showHint = window.setTimeout(() => setHint(true), 1500);
    const tasto = (e: KeyboardEvent) => {
      if ((e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') && performance.now() - montato > 600) {
        e.preventDefault();
        chiudi();
      }
    };
    window.addEventListener('keydown', tasto);
    return () => {
      window.clearInterval(follow);
      window.clearTimeout(showHint);
      window.removeEventListener('keydown', tasto);
    };
  }, [chiudi]);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: '#000', cursor: 'none', overflow: 'hidden', userSelect: 'none' }}
      onClick={chiudi}
    >
      <video
        ref={video}
        src={INTRO_VIDEO}
        playsInline
        preload="auto"
        onEnded={chiudi}
        onError={chiudi}
        style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
      />
      <div
        style={{
          position: 'absolute',
          right: 28,
          bottom: 22,
          font: '700 13px/1 Orbitron, sans-serif',
          letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.55)',
          opacity: hint ? 1 : 0,
          transition: 'opacity 600ms',
          pointerEvents: 'none',
        }}
      >
        {t('boot.skip')}
      </div>
    </div>
  );
};

export default DebhIntroVideo;
