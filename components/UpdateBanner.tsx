import React from 'react';
import type { UpdateInfo } from '../services/updateService';
import { t, useLanguage } from '../services/i18n';

export type UpdateStatus = 'available' | 'installing' | 'failed';

interface UpdateBannerProps {
  update: UpdateInfo;
  status: UpdateStatus;
  /** What went wrong, when `status` is "failed". */
  error?: string;
  /** How much of the download is done (0 to 1), or null while the size is not known. Only while "installing". */
  progress?: number | null;
}

/**
 * "A new version is out", at the top of the title screens. Press U to update (installed copies) or to open
 * the download page (portable copies and packages).
 *
 * While the update downloads the whole screen is taken: when it is done the game closes by itself (the installer
 * takes over), so nothing must be started in the meantime. The App mutes the menus and its keys for as long.
 */
const UpdateBanner: React.FC<UpdateBannerProps> = ({ update, status, error, progress = null }) => {
  useLanguage();
  if (status === 'installing') {
    return (
      <div
        className="absolute inset-0 z-60 flex flex-col items-center justify-center gap-8 bg-[#020a08]/95 text-center"
        role="alert"
        aria-live="assertive"
        onClick={e => e.stopPropagation()}
      >
        <span className="text-7xl" aria-hidden="true">⬆</span>
        <p className="text-5xl font-black tracking-wider text-emerald-300">
          {t('update.progress.title', { version: update.version })}
        </p>
        <p className="text-4xl font-black tracking-widest text-white">
          {progress === null ? t('update.installing') : t('update.progress.percent', { percent: Math.round(progress * 100) })}
        </p>
        <p className="max-w-[1400px] text-2xl font-bold tracking-wider text-yellow-300">{t('update.progress.note')}</p>
      </div>
    );
  }
  const action = update.canInstall ? t('update.install') : t('update.download');
  return (
    <div
      className="absolute top-5 left-1/2 -translate-x-1/2 z-55 flex items-center gap-5 rounded-2xl border-2 border-emerald-400/70 bg-[#04140f]/95 px-7 py-3 shadow-[0_0_30px_rgba(16,185,129,0.4)] pointer-events-none"
      role="status"
    >
      <span className="text-3xl" aria-hidden="true">⬆</span>
      <div className="text-left">
        <p className="text-lg font-black tracking-wider text-emerald-300">
          {status === 'failed' ? t('update.failed', { error: error ?? '' }) : t('update.available', { version: update.version })}
        </p>
        <p className="text-sm font-bold tracking-[0.2em] text-yellow-300">{action}</p>
      </div>
    </div>
  );
};

export default UpdateBanner;
