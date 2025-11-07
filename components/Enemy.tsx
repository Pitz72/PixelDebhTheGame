
import React from 'react';
import { Enemy as EnemyType } from '../types';
import { EnemySprite } from '../services/assetService';

interface EnemyProps {
  enemy: EnemyType;
}

const Enemy: React.FC<EnemyProps> = ({ enemy }) => {
  if (enemy.state === 'defeated') return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: enemy.x,
        top: enemy.y,
        width: enemy.width,
        height: enemy.height,
        transform: `scaleX(${enemy.direction === 'left' ? -1 : 1})`
      }}
    >
      <EnemySprite type={enemy.type} state={enemy.state} />
    </div>
  );
};

export default Enemy;
