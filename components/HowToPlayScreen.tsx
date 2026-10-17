import React, { useEffect } from 'react';
import { ItemSprite } from '../services/assetService';
import { COLLECTIBLE_TYPES } from '../constants';
import { keyLabel, useSettings } from '../services/settings';
import { usePadConnected } from '../services/gamepadService';
import { t, useLanguage } from '../services/i18n';
import type { Control } from '../engine/input';

interface HowToPlayScreenProps {
  onClose: () => void;
}

/** The keys of a control, as the player has them set now ("A / ←"). */
const keysOf = (bindings: Record<Control, string[]>, controls: Control[]): string =>
  [...new Set(controls.flatMap(c => bindings[c]))].map(keyLabel).join('  ');

/**
 * What the game is about, the controls as they are set right now (keyboard and pad), the things to collect and
 * a few tips. Escape (or Enter, or a click) goes back.
 */
const HowToPlayScreen: React.FC<HowToPlayScreenProps> = ({ onClose }) => {
  useLanguage();
  const { bindings } = useSettings();
  const padConnected = usePadConnected();

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

  const rows: { action: string; keys: string; pad: string }[] = [
    { action: t('howto.move'), keys: keysOf(bindings, ['left', 'right', 'up', 'down']), pad: t('howto.movePad') },
    { action: t('howto.jump'), keys: keysOf(bindings, ['jump']), pad: 'A' },
    { action: t('howto.capture'), keys: keysOf(bindings, ['capture']), pad: 'X / Y' },
    { action: t('howto.shoot'), keys: keysOf(bindings, ['shoot']), pad: 'B / RB / RT / LT' },
    { action: t('howto.pause'), keys: 'ESC', pad: 'START' },
  ];

  return (
    <div
      className="absolute inset-0 z-70 flex flex-col items-center justify-center bg-[#050114] px-16 text-white"
      onClick={e => {
        e.stopPropagation();
        onClose();
      }}
    >
      <h2
        className="text-6xl font-black tracking-widest text-yellow-300"
        style={{ textShadow: '0 0 24px rgba(250,204,21,0.5), 4px 4px 0px #e8175d' }}
      >
        {t('howto.title')}
      </h2>

      <div className="mt-6 w-[1500px] space-y-4">
        <section className="rounded-2xl border border-cyan-500/30 bg-[#0b0420]/80 px-8 py-4">
          <h3 className="text-lg font-black tracking-[0.25em] text-cyan-300">{t('howto.goal.title')}</h3>
          <p className="mt-1 text-xl leading-relaxed text-gray-100">{t('howto.goal.text')}</p>
        </section>

        <section className="rounded-2xl border border-cyan-500/30 bg-[#0b0420]/80 px-8 py-4">
          <h3 className="text-lg font-black tracking-[0.25em] text-cyan-300">
            {t('howto.controls.title')}
            {padConnected && <span className="ml-4 text-sm text-emerald-300">● GAMEPAD</span>}
          </h3>
          <table className="mt-2 w-full border-collapse text-left text-xl">
            <thead>
              <tr className="text-sm tracking-[0.2em] text-gray-400">
                <th className="w-[44%] p-px font-bold" />
                <th className="w-[28%] p-px font-bold">{t('howto.controls.keyboard')}</th>
                <th className="p-px font-bold">{t('howto.controls.pad')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.action} className="border-t border-white/10">
                  <td className="px-px py-1 text-gray-100">{r.action}</td>
                  <td className="px-px py-1 font-black tracking-widest text-yellow-300">{r.keys}</td>
                  <td className="px-px py-1 font-black tracking-widest text-emerald-300">{r.pad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="grid grid-cols-2 gap-4">
          <section className="rounded-2xl border border-cyan-500/30 bg-[#0b0420]/80 px-8 py-4">
            <h3 className="text-lg font-black tracking-[0.25em] text-cyan-300">{t('howto.items.title')}</h3>
            <p className="mt-1 text-base text-gray-200">{t('howto.items.collect')}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {COLLECTIBLE_TYPES.map(type => (
                <div key={type} className="h-12 w-12">
                  <ItemSprite type={type} />
                </div>
              ))}
            </div>
            <p className="mt-2 text-base text-gray-200">{t('howto.items.power')}</p>
            <div className="mt-2 flex gap-2">
              {['speed-boost', 'shield', 'super-throw'].map(type => (
                <div key={type} className="h-12 w-12">
                  <ItemSprite type={type} />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-cyan-500/30 bg-[#0b0420]/80 px-8 py-4">
            <h3 className="text-lg font-black tracking-[0.25em] text-cyan-300">{t('howto.tips.title')}</h3>
            <ul className="mt-1 list-disc space-y-1 pl-6 text-lg leading-snug text-gray-100">
              <li>{t('howto.tip1')}</li>
              <li>{t('howto.tip2')}</li>
              <li>{t('howto.tip3')}</li>
              <li>{t('howto.tip4')}</li>
              <li>{t('howto.tip5')}</li>
              <li>{t('howto.tip6')}</li>
            </ul>
          </section>
        </div>
      </div>

      <p className="mt-6 text-sm font-bold tracking-widest text-cyan-200">{t('howto.close')}</p>
    </div>
  );
};

export default HowToPlayScreen;
