/**
 * Dev page (npm run dev, then /ui-sheet.html?screen=howto): one HTML screen of the game at 1920 x 1080 with fixed data,
 * with every animation off. It exists to compare the screens before and after a change to the styles (a new version of
 * Tailwind, say): take a screenshot of each screen, change, take them again, and subtract.
 * Screens: start, howto, credits, trophies, options (`&tab=0..5`), highscore, gameover, completed, enterscore,
 * levels, update, hud, hudboss, notice, tournament (the screen that turns on the tournaments). Add `&torneo=1` to see
 * the tournament switch in the options (`&tab=3`) without the key, and `&torneo=on` to see it already on as DEB. With
 * `&torneo=on`, `&stato=aperto` or `&stato=in_arrivo` makes up an answer of the site (the banner on the title), and
 * `&avviso=good|info|bad` shows the message after a game.
 */
import type { ReactElement } from 'react';
import ReactDOM from 'react-dom/client';
import StartScreen from '../components/StartScreen';
import HowToPlayScreen from '../components/HowToPlayScreen';
import CreditsScreen from '../components/CreditsScreen';
import TrophyScreen from '../components/TrophyScreen';
import OptionsScreen from '../components/OptionsScreen';
import HighscoreScreen from '../components/HighscoreScreen';
import GameoverScreen from '../components/GameoverScreen';
import CompletedScreen from '../components/CompletedScreen';
import EnterHighscoreScreen from '../components/EnterHighscoreScreen';
import LevelSelectScreen from '../components/LevelSelectScreen';
import UpdateBanner from '../components/UpdateBanner';
import Hud from '../components/Hud';
import AiNotice from '../components/AiNotice';
import TournamentConsent from '../components/TournamentConsent';
import TournamentBanner from '../components/TournamentBanner';
import TournamentToast from '../components/TournamentToast';
import { enableTournament, previewTournament } from './tournament';
import { refreshStatus, setFetcher, showNotice } from './tournamentApi';

const q = new URLSearchParams(location.search);
const screen = q.get('screen') ?? 'start';
const noop = () => undefined;
const torneo = q.get('torneo');
if (torneo) previewTournament();
if (torneo === 'on') enableTournament('DEB', 1762431834);
const stato = q.get('stato');
if (stato === 'aperto' || stato === 'in_arrivo') {
  const now = Math.floor(Date.now() / 1000);
  const torneoFinto = { id: 3, titolo: 'Il torneo di PixelDebh', regole: '', stato, versione_minima: '', difficolta: 'normal', loop: true, continua: false, pagina: '' };
  const tempi = stato === 'aperto' ? { inizia: now - 3600, finisce: now + 6 * 86400 } : { inizia: now + 2 * 86400, finisce: now + 9 * 86400 };
  setFetcher(async () => new Response(JSON.stringify({ ok: true, ora: now, torneo: { ...torneoFinto, ...tempi } }), { status: 200 }));
  void refreshStatus();
}
const avviso = q.get('avviso');
if (avviso === 'good') showNotice('Punteggio registrato: sei al posto 4.', 'good');
if (avviso === 'info') showNotice('Torneo: il sito non risponde, il punteggio partirà al prossimo avvio del gioco.', 'info');
if (avviso === 'bad') showNotice('Questa versione del gioco non può mandare punteggi al torneo: aggiorna il gioco.', 'bad');

const hudBase = {
  score: 12450,
  lives: 3,
  level: 5,
  levelName: 'Level 5: Vertical Ventures',
  collectiblesLeft: 7,
  activePowerUp: 'shield' as const,
  isGodMode: false,
  loopCount: 2,
  playerX: 5200,
  levelWidth: 17290,
  timeRemaining: null,
};

const screens: Record<string, ReactElement> = {
  start: <StartScreen onSelect={noop} />,
  howto: <HowToPlayScreen onClose={noop} />,
  credits: <CreditsScreen onClose={noop} />,
  trophies: <TrophyScreen onClose={noop} />,
  options: <OptionsScreen onClose={noop} />,
  highscore: <HighscoreScreen onStart={noop} />,
  gameover: <GameoverScreen onRestart={noop} onTitle={noop} />,
  completed: <CompletedScreen score={123456} loopCount={2} onNextLoop={noop} onBank={noop} />,
  enterscore: <EnterHighscoreScreen score={98765} onHighscoreEntered={noop} />,
  levels: <LevelSelectScreen onClose={noop} onPlay={noop} />,
  update: (
    <UpdateBanner
      update={{ version: '9.9.9', notes: '', kind: 'installer', canInstall: true, releaseUrl: 'https://example.invalid', install: async () => undefined } as never}
      status="available"
    />
  ),
  hud: <Hud {...hudBase} combo={{ count: 7, mult: 3, pct: 60 }} guide={{ angle: 30, metres: 42 }} timeRemaining={612} />,
  hudboss: (
    <Hud
      {...hudBase}
      bosses={[
        { type: 'frog', hp: 8, maxHp: 8 },
        { type: 'chickenEye', hp: 6, maxHp: 12 },
        { type: 'shadowHead', hp: 14, maxHp: 14 },
      ]}
    />
  ),
  notice: <AiNotice onDone={noop} />,
  tournament: <TournamentConsent onDone={noop} onCancel={noop} />,
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <div className="relative" style={{ width: 1920, height: 1080, overflow: 'hidden', background: '#070312' }}>
    {screens[screen] ?? screens.start}
    {torneo && <TournamentBanner />}
    {torneo && <TournamentToast />}
  </div>
);

// `tab` clicks the n-th tab of the options screen
const tab = q.get('tab');
if (screen === 'options' && tab !== null) {
  setTimeout(() => {
    const buttons = [...document.querySelectorAll('button')];
    buttons[Number(tab)]?.click();
  }, 300);
}
