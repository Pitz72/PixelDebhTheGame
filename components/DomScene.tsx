import React from 'react';
import Player from './Player';
import Enemy from './Enemy';
import Platform from './Platform';
import Background from './Background';
import CyclopsFrogBoss from './FrogBoss';
import ChickenEyeBoss from './ChickenEyeBoss';
import ShadowHeadBoss from './ShadowHeadBoss';
import {
  ItemSprite,
  PlayerProjectileSprite,
  CDROMSprite,
  BombSprite,
  GoalSprite,
  EggSprite,
  FireballSprite,
  CheckpointSprite,
} from '../services/assetService';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';
import { Frame } from '../engine/frame';

/**
 * The original DOM/SVG renderer. It is only used as a fallback when WebGL is not available
 * (some Linux setups), so the game still runs, just without lights and heavy particles.
 */
const DomScene: React.FC<{ frame: Frame }> = ({ frame }) => {
  const { player, bosses } = frame;
  // the dark arena is for the last boss alone
  const isShadowHeadBoss = bosses.length === 1 && bosses[0].type === 'shadowHead';

  const cullMinX = frame.cameraX - 450;
  const cullMaxX = frame.cameraX + GAME_WIDTH + 450;
  const cullMinY = frame.cameraY - 450;
  const cullMaxY = frame.cameraY + GAME_HEIGHT + 450;
  const isVisible = (obj: { x: number; y: number; width: number; height: number }) =>
    obj.x + obj.width >= cullMinX &&
    obj.x <= cullMaxX &&
    obj.y + obj.height >= cullMinY &&
    obj.y <= cullMaxY;

  const shakeX = frame.screenShake > 0.2 ? (Math.random() - 0.5) * frame.screenShake * 1.8 : 0;
  const shakeY = frame.screenShake > 0.2 ? (Math.random() - 0.5) * frame.screenShake * 1.8 : 0;

  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none z-30"
        style={{ boxShadow: 'inset 0 0 90px rgba(0, 0, 0, 0.55)' }}
      />

      {isShadowHeadBoss ? (
        <div
          className="absolute inset-0 z-0"
          style={{ background: 'radial-gradient(circle at 50% 50%, #1a020c 0%, #040006 80%)' }}
        />
      ) : (
        <Background cameraX={frame.cameraX} cameraY={frame.cameraY} theme={frame.theme} />
      )}

      <div
        className="absolute top-0 left-0"
        style={{
          willChange: 'transform',
          transform: `translate3d(${-frame.cameraX + shakeX}px, ${-frame.cameraY + shakeY}px, 0)`,
        }}
      >
        {frame.platforms.map((p, i) =>
          isVisible(p) ? <Platform key={i} platform={p} theme={frame.theme} /> : null
        )}

        {frame.springs.map((s, i) =>
          isVisible(s) ? (
            <div
              key={`spring-${i}`}
              style={{
                position: 'absolute',
                left: s.x,
                top: s.y + (s.pressed > 0 ? s.height * 0.5 : 0),
                width: s.width,
                height: s.pressed > 0 ? s.height * 0.5 : s.height,
                zIndex: 2,
                background: 'linear-gradient(#69f0ae 0 28%, #263238 28% 100%)',
                border: '2px solid #69f0ae',
                borderRadius: 4,
                boxShadow: '0 0 14px rgba(105, 240, 174, 0.55)',
              }}
            />
          ) : null
        )}

        {frame.checkpoints.map(cp =>
          isVisible(cp) ? (
            <div
              key={cp.id}
              style={{ position: 'absolute', left: cp.x, top: cp.y, width: cp.width, height: cp.height, zIndex: 2 }}
            >
              <CheckpointSprite activated={cp.activated} />
            </div>
          ) : null
        )}

        {frame.goal && isVisible(frame.goal) && (
          <div
            style={{
              position: 'absolute',
              left: frame.goal.x,
              top: frame.goal.y,
              width: frame.goal.width,
              height: frame.goal.height,
              zIndex: 3,
            }}
          >
            <GoalSprite unlocked={frame.collectiblesLeft === 0} remaining={frame.collectiblesLeft} />
          </div>
        )}

        {frame.items.map(c =>
          isVisible(c) ? (
            <div
              key={c.id}
              style={{ position: 'absolute', left: c.x, top: c.y, width: c.width, height: c.height, zIndex: 5 }}
            >
              <ItemSprite type={c.type} />
            </div>
          ) : null
        )}

        {player.width && <Player player={player} />}

        {frame.enemies.map(e => (isVisible(e) ? <Enemy key={e.id} enemy={e} /> : null))}

        {bosses.map((b, i) =>
          b.type === 'frog' ? (
            <CyclopsFrogBoss key={i} boss={b} />
          ) : b.type === 'chickenEye' ? (
            <ChickenEyeBoss key={i} boss={b} />
          ) : (
            <ShadowHeadBoss key={i} boss={b} />
          )
        )}

        {frame.projectiles.map(p =>
          isVisible(p) ? (
            <div
              key={p.id}
              style={{ position: 'absolute', left: p.x, top: p.y, width: p.width, height: p.height, zIndex: 12 }}
            >
              {p.isBomb ? <BombSprite /> : p.isEgg ? <EggSprite /> : p.isFireball ? <FireballSprite /> : <CDROMSprite />}
            </div>
          ) : null
        )}

        {frame.playerProjectiles.map(p =>
          isVisible(p) ? (
            <div
              key={p.id}
              style={{ position: 'absolute', left: p.x, top: p.y, width: p.width, height: p.height, zIndex: 12 }}
            >
              <PlayerProjectileSprite />
            </div>
          ) : null
        )}

        {frame.shockwaves.map(sw => (
          <div
            key={sw.id}
            style={{
              position: 'absolute',
              left: sw.x - sw.radius,
              top: sw.y - sw.radius,
              width: sw.radius * 2,
              height: sw.radius * 2,
              borderRadius: '50%',
              border: `${sw.strokeWidth}px solid ${sw.color}`,
              boxShadow: `0 0 18px ${sw.color}, inset 0 0 12px ${sw.color}`,
              opacity: sw.life,
              pointerEvents: 'none',
              zIndex: 14,
            }}
          />
        ))}

        {frame.particles.map(p => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: '50%',
              boxShadow: `0 0 10px ${p.color}`,
              opacity: p.life,
              pointerEvents: 'none',
              zIndex: 15,
            }}
          />
        ))}

        {frame.floatingTexts.map(ft => (
          <div
            key={ft.id}
            style={{
              position: 'absolute',
              left: ft.x,
              top: ft.y,
              transform: `translate(-50%, -50%) scale(${ft.scale})`,
              color: ft.color,
              fontFamily: "'Orbitron Variable', 'Orbitron', sans-serif",
              fontWeight: 900,
              fontSize: '18px',
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap',
              textShadow: `0 0 12px ${ft.color}, 2px 2px 0px #090318`,
              opacity: ft.life,
              pointerEvents: 'none',
              zIndex: 18,
            }}
          >
            {ft.text}
          </div>
        ))}
      </div>
    </>
  );
};

export default DomScene;
