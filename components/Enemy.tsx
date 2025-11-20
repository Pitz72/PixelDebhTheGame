
import React from 'react';
import { Enemy as EnemyType } from '../types';
import { EnemySprite } from '../services/assetService';

interface EnemyProps {
  enemy: EnemyType;
}

const Enemy: React.FC<EnemyProps> = React.memo(({ enemy }) => {
  if (enemy.state === 'defeated') return null;

  const isStunned = enemy.state === 'stunned';
  const directionScale = enemy.direction === 'left' ? -1 : 1;

  // Cast style to allow custom properties
  const style: React.CSSProperties & { '--direction-scale'?: number } = {
    position: 'absolute',
    left: enemy.x,
    top: enemy.y,
    width: enemy.width,
    height: enemy.height,
    '--direction-scale': directionScale,
    transform: `scaleX(${directionScale})`,
  };

  return (
    <div
      className={isStunned ? 'animate-shake' : ''}
      style={style}
    >
      <EnemySprite type={enemy.type} state={enemy.state} />
    </div>
  );
});

export default Enemy;