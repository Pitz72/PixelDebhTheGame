import React from 'react';
import { t, useLanguage } from '../services/i18n';

interface CreditLineProps {
  /** Also show the version of the game under the credit. */
  version?: boolean;
}

/** "By Simone Pizzi - Runtime Multimedia", at the bottom of the title screens. */
const CreditLine: React.FC<CreditLineProps> = ({ version = false }) => {
  useLanguage();
  return (
    <div className="absolute bottom-3 left-0 right-0 text-center z-20 pointer-events-none">
      <div className="text-orange-300/90 text-sm font-extrabold tracking-[0.28em] uppercase">{t('credit.by')}</div>
      {version && (
        <div className="text-cyan-300/60 text-xs tracking-widest font-bold mt-1">V.{__APP_VERSION__}</div>
      )}
    </div>
  );
};

export default CreditLine;
