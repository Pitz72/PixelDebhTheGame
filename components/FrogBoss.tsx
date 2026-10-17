import React from 'react';
import { Boss as BossType } from '../types';
import { FrogBossArt } from './bosses/FrogArt';
import { frogPose } from './bosses/bossPoses';

interface CyclopsFrogBossProps {
  boss: BossType;
}

/** The fallback (DOM) scene's frog: the same drawing as the game, with its limbs swaying on a clock. */
const CyclopsFrogBoss: React.FC<CyclopsFrogBossProps> = ({ boss }) => (
  <div
    style={{
      position: 'absolute',
      left: boss.x,
      top: boss.y,
      width: boss.width,
      height: boss.height,
      filter: boss.isHit
        ? 'brightness(2.6) drop-shadow(0 0 28px #00ff88)'
        : 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.55)) drop-shadow(0 0 18px rgba(102, 187, 106, 0.35))',
      transition: 'filter 0.06s linear',
      zIndex: 9,
    }}
  >
    <FrogBossArt pose={frogPose(Date.now() / 300, Math.hypot(boss.vx, boss.vy), boss.isThrowing ? 1 : 0)} />
  </div>
);

export default CyclopsFrogBoss;
