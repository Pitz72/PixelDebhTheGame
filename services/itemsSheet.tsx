/**
 * Dev page (npm run dev, then /items-sheet.html): every item sprite side by side, big, to judge the art.
 * `?size=80` shows them at the size they have in the game.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ItemSprite } from './assetService';

const GROUPS: { title: string; types: string[] }[] = [
  { title: 'Retro gear', types: ['joystick', 'floppy', 'cartridge', 'cassette', 'token', 'crt'] },
  { title: 'Consoles, computers and discs', types: ['atari2600', 'amiga500', 'nes', 'sega', 'cdrom'] },
  { title: 'Power-ups', types: ['speed-boost', 'shield', 'super-throw'] },
];

const size = Number(new URLSearchParams(location.search).get('size') ?? 200);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <div style={{ padding: 24 }}>
    {GROUPS.map(g => (
      <section key={g.title} style={{ marginBottom: 28 }}>
        <h2 style={{ margin: '0 0 10px', fontSize: 16, letterSpacing: 2 }}>{g.title.toUpperCase()}</h2>
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
          {g.types.map(t => (
            <figure key={t} style={{ margin: 0, textAlign: 'center' }}>
              <div style={{ width: size, height: size }}>
                <ItemSprite type={t} />
              </div>
              <figcaption style={{ fontSize: 13 }}>{t}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    ))}
  </div>
);
