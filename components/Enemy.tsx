import React from 'react';
import { Enemy as EnemyType } from '../types';
import { EnemySprite } from '../services/assetService';

interface EnemyProps {
  enemy: EnemyType;
}

const Enemy: React.FC<EnemyProps> = ({ enemy }) => {
  if (enemy.state === 'defeated') return null;

  const isStunned = enemy.state === 'stunned';
  const isCaptured = enemy.state === 'captured';
  const isLaunched = enemy.state === 'launched';
  const directionScale = enemy.direction === 'left' ? -1 : 1;

  const style: React.CSSProperties & { '--direction-scale'?: number } = {
    position: 'absolute',
    left: enemy.x,
    top: enemy.y,
    width: enemy.width,
    height: enemy.height,
    '--direction-scale': directionScale,
    transform: `scaleX(${directionScale})`,
    filter: enemy.isSuperLaunched
      ? 'drop-shadow(0 0 16px #ff6d00) drop-shadow(0 0 8px #ffea00) brightness(1.3)'
      : isLaunched
      ? 'drop-shadow(0 0 12px #00e5ff)'
      : isStunned
      ? 'drop-shadow(0 0 10px #ffea00)'
      : isCaptured
      ? 'drop-shadow(0 0 12px #d500f9)'
      : 'drop-shadow(0 5px 7px rgba(0,0,0,0.5))',
    zIndex: isCaptured || isLaunched ? 11 : 8,
  };

  return (
    <div className={isStunned ? 'animate-shake' : ''} style={style}>
      {isStunned && (
        <div className="absolute -top-5 left-0 right-0 flex justify-center items-center space-x-1.5 pointer-events-none">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 shadow-[0_0_8px_#ffea00] animate-ping" />
          <span className="w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_8px_#00e5ff] animate-bounce" />
          <span className="w-2.5 h-2.5 rounded-full bg-pink-400 shadow-[0_0_8px_#ff4081] animate-ping" />
        </div>
      )}
      {isCaptured && (
        <div
          className="absolute -inset-1.5 rounded-full border-2 border-purple-400/70 animate-pulse pointer-events-none"
          style={{ boxShadow: '0 0 14px rgba(213, 0, 249, 0.5) inset' }}
        />
      )}
      <EnemySprite type={enemy.type} state={enemy.state} />
    </div>
  );
};

export default Enemy;