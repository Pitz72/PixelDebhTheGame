/**
 * Dev page (npm run dev, then /enemy-sheet.html): every enemy sprite in every state side by side, big, to judge the art.
 * `?size=80` shows them at about the size they have in the game (50 px, a bit bigger so it can be read).
 */
import ReactDOM from 'react-dom/client';
import { EnemySprite } from './assetService';

const TYPES: { type: string; name: string; states: string[]; ratio: number }[] = [
  { type: 'base', name: 'Globby (base)', states: ['active', 'captured', 'stunned'], ratio: 1 },
  { type: 'jumper', name: 'Hoppy (jumper)', states: ['active', 'captured', 'stunned'], ratio: 1 },
  { type: 'flyer', name: 'Flappy (flyer)', states: ['active', 'captured'], ratio: 44 / 60 },
  { type: 'bomber', name: 'Bomby (bomber)', states: ['active', 'captured', 'stunned'], ratio: 1 },
  { type: 'phaser', name: 'Ghosty (phaser)', states: ['active', 'captured', 'stunned'], ratio: 1 },
];

const size = Number(new URLSearchParams(location.search).get('size') ?? 220);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <div style={{ padding: 24 }}>
    {TYPES.map(t => (
      <section key={t.type} style={{ marginBottom: 22 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 15, letterSpacing: 2 }}>{t.name.toUpperCase()}</h2>
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
          {t.states.map(s => (
            <figure key={s} style={{ margin: 0, textAlign: 'center' }}>
              <div style={{ width: size, height: size * t.ratio, background: 'radial-gradient(#1a1445, #0b0720)' }}>
                <EnemySprite type={t.type} state={s} />
              </div>
              <figcaption style={{ fontSize: 13 }}>{s}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    ))}
  </div>
);
