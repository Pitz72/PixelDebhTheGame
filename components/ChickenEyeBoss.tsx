import React from 'react';
import { Boss as BossType } from '../types';
import { ChickenEyeBossArt } from './bosses/ChickenEyeArt';
import { eyePose } from './bosses/bossPoses';

interface ChickenEyeBossProps {
  boss: BossType;
}

/** The fallback (DOM) scene's LeGallineNellOcchi: the same drawing as the game, hen strolling and all. */
const ChickenEyeBoss: React.FC<ChickenEyeBossProps> = ({ boss }) => (
  <div
    style={{
      position: 'absolute',
      left: boss.x,
      top: boss.y,
      width: boss.width,
      height: boss.height,
      filter: boss.isHit
        ? 'brightness(2.5) drop-shadow(0 0 28px #ff3d00)'
        : 'drop-shadow(0 10px 24px rgba(0, 0, 0, 0.55)) drop-shadow(0 0 18px rgba(244, 81, 30, 0.45))',
      transition: 'filter 0.05s linear',
      zIndex: 9,
    }}
  >
    <ChickenEyeBossArt pose={eyePose(Date.now())} />
  </div>
);

export default ChickenEyeBoss;
