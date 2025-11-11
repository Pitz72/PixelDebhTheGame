import React from 'react';
import { Player as PlayerType } from '../types';
import { PlayerSprite, ShieldSprite } from '../services/assetService';

interface PlayerProps {
  player: PlayerType;
}

const Player: React.FC<PlayerProps> = ({ player }) => {
  const speedBoostActive = player.activePowerUp === 'speed-boost';

  const powerUpGlowColor = {
    'speed-boost': 'rgba(255, 238, 0, 0.6)',
    'super-throw': 'rgba(255, 136, 0, 0.6)',
  }[player.activePowerUp || ''] || 'transparent';
  
  const hasGlow = player.activePowerUp === 'speed-boost' || player.activePowerUp === 'super-throw';
  
  return (
    <div
      className={hasGlow ? 'animate-pulse' : ''}
      style={{
        position: 'absolute',
        left: player.x,
        top: player.y,
        width: player.width,
        height: player.height,
        boxShadow: `0 0 25px 8px ${powerUpGlowColor}`,
        borderRadius: '50%',
        transition: 'box-shadow 0.3s ease-in-out',
      }}
    >
      {/* Speed Boost Trail */}
      {speedBoostActive && (
        <div className="absolute -left-2 top-0 w-full h-full opacity-50" style={{ filter: 'blur(4px)'}}>
            <PlayerSprite direction={player.direction} isInvincible={false} />
        </div>
      )}

      {/* Main Player Sprite */}
      <div
        className="absolute inset-0"
        style={{
            transition: 'opacity 0.1s linear',
            opacity: player.isInvincible && Math.floor(Date.now() / 100) % 2 === 0 ? 0.5 : 1,
            filter: speedBoostActive ? 'saturate(2)' : 'none',
        }}
      >
        <PlayerSprite direction={player.direction} isInvincible={player.isInvincible} showGlove={player.activePowerUp === 'super-throw'} />
      </div>

      {/* Shield Effect */}
      {player.hasShield && (
        <div className="absolute -inset-2 animate-pulse">
            <ShieldSprite />
        </div>
      )}
    </div>
  );
};

export default Player;