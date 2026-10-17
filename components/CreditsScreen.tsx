import React, { useEffect } from 'react';
import { t, useLanguage } from '../services/i18n';
import { REPO_URL } from '../services/updateService';
import type { TextKey } from '../locales/it';

interface CreditsScreenProps {
  onClose: () => void;
}

/** The pieces of music, as the game names them. Proper names: not translated. */
const TRACKS = [
  'Press Start',
  'Gold Coin Pursuit',
  'Assembly Line',
  'Beyond the Lunar Gate',
  'Swamp Stomp',
  'Zero Vector',
  'Gold Coin Anthem',
  'Poultry Panic',
];

const SECTIONS: { role: TextKey; text?: TextKey; plain?: string; extra?: string }[] = [
  { role: 'credits.author.role', plain: 'Simone Pizzi - Runtime Multimedia' },
  { role: 'credits.ai.role', text: 'credits.ai.text' },
  { role: 'credits.music.role', text: 'credits.music.text', extra: TRACKS.join(' · ') },
  { role: 'credits.sfx.role', text: 'credits.sfx.text' },
  { role: 'credits.logo.role', text: 'credits.logo.text' },
  { role: 'credits.fonts.role', text: 'credits.fonts.text' },
  { role: 'credits.software.role', text: 'credits.software.text' },
];

/** Who made the game and with what. Escape (or Enter, or a click) goes back. */
const CreditsScreen: React.FC<CreditsScreenProps> = ({ onClose }) => {
  useLanguage();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (!['escape', 'enter', ' ', 'backspace'].includes(k)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!e.repeat) onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <div
      className="absolute inset-0 z-[70] flex flex-col items-center justify-center bg-[#050114] px-16 text-center text-white"
      onClick={e => {
        e.stopPropagation();
        onClose();
      }}
    >
      <h2
        className="text-6xl font-black tracking-widest text-yellow-300"
        style={{ textShadow: '0 0 24px rgba(250,204,21,0.5), 4px 4px 0px #e8175d' }}
      >
        {t('credits.title')}
      </h2>
      <p className="mt-3 text-3xl font-black tracking-wider text-white" style={{ textShadow: '0 0 20px #00e5ff' }}>
        PixelDebh: Retro-Rescue!
      </p>
      <p className="mt-1 text-sm font-bold tracking-[0.25em] text-orange-300">{t('credits.channel')}</p>

      <div className="mt-8 grid w-[1400px] grid-cols-2 gap-x-14 gap-y-5 text-left">
        {SECTIONS.map(s => (
          <div key={s.role} className="rounded-xl border border-cyan-500/30 bg-[#0b0420]/80 px-6 py-3">
            <p className="text-sm font-black tracking-[0.25em] text-cyan-300">{t(s.role)}</p>
            <p className="mt-1 text-xl text-gray-100">{s.plain ?? (s.text ? t(s.text) : '')}</p>
            {s.extra && <p className="mt-1 text-sm leading-snug text-gray-400">{s.extra}</p>}
          </div>
        ))}
      </div>

      <p className="mt-8 font-mono text-sm tracking-wider text-gray-400">
        {t('credits.version', { version: __APP_VERSION__ })} · {REPO_URL.replace('https://', '')}
      </p>
      <p className="mt-2 text-sm font-bold tracking-[0.25em] text-orange-300/90">By Simone Pizzi - Runtime Multimedia</p>
      <p className="mt-5 text-sm font-bold tracking-widest text-cyan-200">{t('credits.close')}</p>
    </div>
  );
};

export default CreditsScreen;
