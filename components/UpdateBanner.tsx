import React from 'react';
import type { UpdateInfo } from '../services/updateService';
import { t, useLanguage } from '../services/i18n';

export type UpdateStatus = 'available' | 'installing' | 'failed';

interface UpdateBannerProps {
  update: UpdateInfo;
  status: UpdateStatus;
  /** What went wrong, when `status` is "failed". */
  error?: string;
}

/**
 * "A new version is out", at the top of the title screens. Press U to update (installed copies) or to open
 * the download page (portable copies and packages).
 */
const UpdateBanner: React.FC<UpdateBannerProps> = ({ update, status, error }) => {
  useLanguage();
  const action = update.canInstall ? t('update.install') : t('update.download');
  return (
    <div
      className="absolute top-5 left-1/2 -translate-x-1/2 z-[55] flex items-center gap-5 rounded-2xl border-2 border-emerald-400/70 bg-[#04140f]/95 px-7 py-3 shadow-[0_0_30px_rgba(16,185,129,0.4)] pointer-events-none"
      role="status"
    >
      <span className="text-3xl" aria-hidden="true">⬆</span>
      <div className="text-left">
        <p className="text-lg font-black tracking-wider text-emerald-300">
          {status === 'installing'
            ? t('update.installing')
            : status === 'failed'
            ? t('update.failed', { error: error ?? '' })
            : t('update.available', { version: update.version })}
        </p>
        {status !== 'installing' && (
          <p className="text-sm font-bold tracking-[0.2em] text-yellow-300">{action}</p>
        )}
      </div>
    </div>
  );
};

export default UpdateBanner;
