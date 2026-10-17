import React from 'react';
import type { TrophyDef } from '../trophies';
import { trophyDescription, trophyName, tierLabel } from '../services/trophyText';
import { t, useLanguage } from '../services/i18n';
import TrophyIcon, { TIER_COLORS } from './TrophyIcon';

export const TOAST_MS = 4600;

/** "Trophy earned" banner at the bottom of the screen; the host shows one at a time. */
const TrophyToast: React.FC<{ trophy: TrophyDef }> = ({ trophy }) => {
  useLanguage();
  const c = TIER_COLORS[trophy.tier];
  return (
    <div
      className="absolute bottom-10 left-1/2 z-60 pointer-events-none flex items-center gap-5 rounded-2xl border-2 bg-[#0b0420]/95 px-7 py-4"
      style={{
        borderColor: c.main,
        boxShadow: `0 0 34px ${c.main}77`,
        animation: `trophy-toast ${TOAST_MS}ms ease-out forwards`,
        minWidth: 520,
      }}
      role="status"
    >
      <TrophyIcon tier={trophy.tier} size={72} />
      <div className="text-left">
        <p className="text-xs font-black tracking-[0.3em]" style={{ color: c.text }}>
          {t('trophy.unlocked')} • {tierLabel(trophy.tier)}
        </p>
        <p className="text-3xl font-black tracking-wider text-white">{trophyName(trophy)}</p>
        <p className="text-base text-gray-300">{trophyDescription(trophy)}</p>
      </div>
    </div>
  );
};

export default TrophyToast;
