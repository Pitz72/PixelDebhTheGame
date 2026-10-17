import React, { useEffect, useMemo } from 'react';
import { TIERS, TROPHIES } from '../trophies';
import { trophyDescription, trophyName, tierLabel } from '../services/trophyText';
import { t, useLanguage } from '../services/i18n';
import { loadTrophies } from '../services/trophyService';
import TrophyIcon, { TIER_COLORS } from './TrophyIcon';

interface TrophyScreenProps {
  onClose: () => void;
}

/**
 * The list of trophies, a column for each kind. It listens on the capture phase and swallows the keys it
 * uses (like the audio panel), so the screen underneath does not also react to them.
 */
const TrophyScreen: React.FC<TrophyScreenProps> = ({ onClose }) => {
  useLanguage();
  const save = useMemo(() => loadTrophies(), []);
  const earned = TROPHIES.filter(tr => save.unlocked[tr.id] !== undefined).length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (!['escape', 't', 'enter', ' '].includes(k)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!e.repeat) onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <div
      className="absolute inset-0 z-70 flex flex-col items-center bg-[#050114] px-12 py-8 text-white"
      onClick={e => {
        e.stopPropagation();
        onClose();
      }}
    >
      <h2
        className="text-6xl font-black tracking-widest text-yellow-300"
        style={{ textShadow: '0 0 24px rgba(250,204,21,0.5), 4px 4px 0px #e8175d' }}
      >
        {t('trophy.title')}
      </h2>
      <p className="mt-2 text-2xl font-extrabold tracking-widest text-cyan-300">
        {t('trophy.count', { earned, total: TROPHIES.length })}
      </p>

      <div className="mt-6 grid w-full flex-1 grid-cols-4 gap-5">
        {TIERS.map(tier => {
          const list = TROPHIES.filter(tr => tr.tier === tier);
          const done = list.filter(tr => save.unlocked[tr.id] !== undefined).length;
          const c = TIER_COLORS[tier];
          return (
            <div key={tier} className="flex flex-col gap-2">
              <div
                className="flex items-baseline justify-between border-b-2 pb-1"
                style={{ borderColor: c.main }}
              >
                <h3 className="text-xl font-black tracking-[0.25em]" style={{ color: c.text }}>
                  {tierLabel(tier)}
                </h3>
                <span className="font-mono text-lg font-bold text-gray-300">
                  {done}/{list.length}
                </span>
              </div>
              {list.map(tr => {
                const got = save.unlocked[tr.id] !== undefined;
                return (
                  <div
                    key={tr.id}
                    className="flex items-center gap-3 rounded-xl border px-3 py-1.5"
                    style={{
                      borderColor: got ? c.main : 'rgba(255,255,255,0.12)',
                      background: got ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
                      boxShadow: got ? `0 0 16px ${c.main}44` : undefined,
                    }}
                  >
                    <TrophyIcon tier={tier} locked={!got} size={48} />
                    <div className="min-w-0 text-left">
                      <p className={`text-lg font-black leading-tight ${got ? 'text-white' : 'text-gray-500'}`}>
                        {trophyName(tr)}
                      </p>
                      <p className={`text-sm leading-snug ${got ? 'text-gray-300' : 'text-gray-500'}`}>
                        {trophyDescription(tr)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-gray-300">
        {t('trophy.close')}
      </p>
    </div>
  );
};

export default TrophyScreen;
