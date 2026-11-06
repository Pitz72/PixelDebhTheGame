import React, { useEffect } from 'react';
import { useLanguage } from '../services/i18n';
import { clearNotice, useTournamentNotice } from '../services/tournamentApi';

export const TOURNAMENT_TOAST_MS = 6500;

const TONE = {
  good: { border: 'border-emerald-400/80', text: 'text-emerald-200', glow: 'rgba(16,185,129,0.35)' },
  info: { border: 'border-cyan-400/80', text: 'text-cyan-100', glow: 'rgba(0,229,255,0.3)' },
  bad: { border: 'border-pink-400/80', text: 'text-pink-200', glow: 'rgba(244,114,182,0.35)' },
} as const;

/** What the site answered about the last game (or why it was not sent), for a few seconds, over any screen. */
const TournamentToast: React.FC = () => {
  useLanguage();
  const notice = useTournamentNotice();
  const id = notice?.id;
  useEffect(() => {
    if (id === undefined) return;
    const timer = window.setTimeout(() => clearNotice(id), TOURNAMENT_TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [id]);
  if (!notice) return null;
  const c = TONE[notice.tone];
  return (
    <div
      className={`absolute top-6 right-6 z-90 flex max-w-[760px] items-center gap-4 rounded-2xl border-2 ${c.border} bg-[#0b0420]/95 px-6 py-3 pointer-events-none`}
      style={{ boxShadow: `0 0 28px ${c.glow}` }}
      role="status"
    >
      <span className="text-2xl" aria-hidden="true">🏆</span>
      <p className={`text-lg font-bold tracking-wide ${c.text}`}>{notice.text}</p>
    </div>
  );
};

export default TournamentToast;
