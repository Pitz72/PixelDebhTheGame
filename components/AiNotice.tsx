import React, { useCallback, useEffect, useRef, useState } from 'react';
import { t, useLanguage } from '../services/i18n';

interface AiNoticeProps {
  onDone: () => void;
}

/** It goes on by itself after this long (a text of this size is read in well under that). */
const MAX_WAIT_MS = 25000;
/** Keys do nothing in the first moments, so one that was meant for the intro does not skip the note. */
const GRACE_MS = 1200;

/**
 * The note on how the game was made: work of the author, with the help of AI as a tool. Shown at every
 * start, after the intros, in the style of the game. Enter, Space, Esc or a click go on.
 */
const AiNotice: React.FC<AiNoticeProps> = ({ onDone }) => {
  useLanguage(); // redraw if the language changes
  const [visible, setVisible] = useState(false);
  const fatto = useRef(false);
  const fine = useRef(onDone);
  fine.current = onDone;

  const prosegui = useCallback(() => {
    if (fatto.current) return;
    fatto.current = true;
    fine.current();
  }, []);

  useEffect(() => {
    const montato = performance.now();
    const appear = window.setTimeout(() => setVisible(true), 80);
    const limit = window.setTimeout(prosegui, MAX_WAIT_MS);
    const tasto = (e: KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') && performance.now() - montato > GRACE_MS) {
        e.preventDefault();
        prosegui();
      }
    };
    window.addEventListener('keydown', tasto);
    return () => {
      window.clearTimeout(appear);
      window.clearTimeout(limit);
      window.removeEventListener('keydown', tasto);
    };
  }, [prosegui]);

  return (
    <div
      className="relative w-full h-full overflow-hidden flex flex-col justify-center items-center text-center cursor-pointer bg-gradient-to-b from-[#050114] via-[#140732] to-[#260c4d]"
      onClick={prosegui}
      role="alertdialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 40%, rgba(0, 229, 255, 0.35), transparent 65%), linear-gradient(rgba(0,229,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.12) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 64px 64px, 64px 64px',
        }}
      />

      <div className="z-10 flex flex-col items-center transition-opacity duration-700" style={{ opacity: visible ? 1 : 0 }}>
        <span className="inline-block px-4 py-1 rounded-full bg-orange-500/20 border border-orange-400/50 text-orange-300 text-sm font-bold tracking-[0.3em] mb-5">
          {t('notice.chip')}
        </span>
        <h1
          className="text-6xl font-black text-white tracking-wider leading-tight"
          style={{ textShadow: '0 0 28px #00e5ff, 5px 5px 0px #e8175d', fontFamily: "'Orbitron', sans-serif" }}
        >
          {t('notice.title')}
        </h1>

        <div className="mt-10 w-[1180px] bg-[#0b0420]/85 rounded-3xl border-2 border-cyan-500/45 px-14 py-10 shadow-[0_0_45px_rgba(0,229,255,0.2)] text-left space-y-5">
          <p className="text-[26px] leading-relaxed text-gray-100">{t('notice.p1')}</p>
          <p className="text-[26px] leading-relaxed text-gray-300">{t('notice.p2')}</p>
          <p className="text-[28px] font-bold leading-relaxed text-cyan-300">{t('notice.p3')}</p>
        </div>

        <p className="mt-8 text-3xl font-extrabold text-yellow-300 tracking-widest" style={{ textShadow: '3px 3px 0px #e8175d' }}>
          {t('notice.greeting')}
        </p>
        <p className="mt-6 text-xl font-bold text-cyan-200/90 tracking-[0.25em] animate-blink">{t('notice.continue')}</p>
        <p className="mt-6 text-sm font-bold tracking-[0.3em] text-gray-400 uppercase">{t('credit.by')}</p>
      </div>
    </div>
  );
};

export default AiNotice;
