/**
 * Dev page (npm run dev, then /boss-sheet.html): the two redrawn bosses in several poses, to judge the art.
 * `?size=240` changes how big they are drawn.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { FrogBossArt, FROG_REST, type FrogPose, type FrogVariant } from './FrogArt';
import { ChickenEyeBossArt, EYE_REST, type EyePose } from './ChickenEyeArt';

const size = Number(new URLSearchParams(location.search).get('size') ?? 240);

const FROG_POSES: { label: string; pose: FrogPose; hit?: boolean }[] = [
  { label: 'a riposo', pose: FROG_REST },
  { label: 'braccia su, gambe calciano', pose: { armL: -26, armR: 22, legL: 20, legR: -16 } },
  { label: 'e dall\'altra parte', pose: { armL: 22, armR: -26, legL: -16, legR: 20 } },
  { label: 'colpita', pose: { armL: 10, armR: -10, legL: 8, legR: -8 }, hit: true },
];

const EYE_POSES: { label: string; pose: EyePose; hit?: boolean }[] = [
  { label: 'gallina a sinistra', pose: { henX: -1, step: -0.8, flip: true, blink: false } },
  { label: 'al centro', pose: { henX: 0, step: 0.6, flip: false, blink: false } },
  { label: 'a destra', pose: { henX: 1, step: -0.7, flip: false, blink: false } },
  { label: 'occhio chiuso', pose: { ...EYE_REST, blink: true } },
  { label: 'colpito', pose: { henX: 0.2, step: 0.4, flip: false, blink: false }, hit: true },
];

const Cell: React.FC<{ label: string; children: React.ReactNode; box?: number; hitbox?: number }> = ({ label, children, box = size, hitbox }) => (
  <figure style={{ margin: 0, textAlign: 'center' }}>
    <div style={{ width: box, height: box, position: 'relative' }}>
      {children}
      {hitbox ? (
        <div
          style={{
            position: 'absolute',
            left: (box - (box * hitbox) / 240 / 1.0) / 2,
            top: (box - (box * hitbox) / 240 / 1.0) / 2,
            width: (box * hitbox) / 240,
            height: (box * hitbox) / 240,
            border: '1px dashed rgba(255,255,255,0.35)',
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </div>
    <figcaption style={{ fontSize: 12, marginTop: 4 }}>{label}</figcaption>
  </figure>
);

const Row: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section style={{ marginBottom: 26 }}>
    <h2 style={{ margin: '0 0 8px', fontSize: 14, letterSpacing: 2 }}>{title.toUpperCase()}</h2>
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>{children}</div>
  </section>
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <div style={{ padding: 18 }}>
    {(['a', 'b'] as FrogVariant[]).map(v => (
      <Row key={v} title={v === 'a' ? 'Rana Ciclope, variante A: bordo che sfuma sul rosso, arti verdi' : 'Rana Ciclope, variante B: piu\' rossa, arti rosso mattone'}>
        {FROG_POSES.map(p => (
          <Cell key={p.label} label={p.label}>
            <FrogBossArt variant={v} pose={p.pose} hit={p.hit} />
          </Cell>
        ))}
      </Row>
    ))}
    <Row title="LeGallineNellOcchi: la gallina passeggia nella pupilla">
      {EYE_POSES.map(p => (
        <Cell key={p.label} label={p.label}>
          <ChickenEyeBossArt pose={p.pose} hit={p.hit} />
        </Cell>
      ))}
    </Row>
  </div>
);
