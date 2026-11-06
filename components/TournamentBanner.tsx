import React from 'react';
import { t, useLanguage } from '../services/i18n';
import { useSettings } from '../services/settings';
import { tournamentAvailable, useTournament } from '../services/tournament';
import { gameVersion, useTournamentStatus, versionAtLeast } from '../services/tournamentApi';

/** "13 NOVEMBRE ALLE ORE 18:00" in the player's language and time zone. */
export function tournamentDate(seconds: number, language: 'it' | 'en'): string {
  return new Intl.DateTimeFormat(language === 'it' ? 'it-IT' : 'en-GB', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    .format(new Date(seconds * 1000))
    .toUpperCase();
}

/**
 * The tournament of pixeldebh.it on the title screens, for a player who takes part: open until when (or from when),
 * and what to mind (the difficulty, an old version). Nothing when the switch is off or there is no tournament.
 */
const TournamentBanner: React.FC = () => {
  const language = useLanguage();
  const me = useTournament();
  const settings = useSettings();
  const status = useTournamentStatus();
  const info = status?.info;
  if (!tournamentAvailable() || !me.enabled || !info) return null;
  const now = Math.floor(Date.now() / 1000) + status.offset;
  if (info.state === 'chiuso' || now >= info.ends) return null;
  const open = info.state === 'aperto' && now >= info.starts;

  const headline = open
    ? t('tournament.banner.open', { date: tournamentDate(info.ends, language) })
    : t('tournament.banner.soon', { date: tournamentDate(info.starts, language) });
  const oldVersion = !versionAtLeast(gameVersion(), info.minVersion);
  const wrongDifficulty = settings.difficulty !== info.difficulty;
  const detail = oldVersion
    ? t('tournament.banner.update')
    : wrongDifficulty
    ? t('tournament.banner.difficulty')
    : t('tournament.banner.as', { initials: me.initials });

  return (
    <div
      className="absolute bottom-6 right-6 z-55 flex items-center gap-4 rounded-2xl border-2 border-yellow-300/70 bg-[#140f02]/90 px-6 py-3 shadow-[0_0_26px_rgba(253,224,71,0.3)] pointer-events-none"
      role="status"
    >
      <span className="text-3xl" aria-hidden="true">🏆</span>
      <div className="text-left">
        <p className="text-base font-black tracking-wider text-yellow-300">{headline}</p>
        <p className={`text-sm font-bold tracking-[0.15em] ${oldVersion || wrongDifficulty ? 'text-pink-300' : 'text-cyan-200'}`}>{detail}</p>
      </div>
    </div>
  );
};

export default TournamentBanner;
