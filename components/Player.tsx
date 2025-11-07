
import React from 'react';
import { Player as PlayerType } from '../types';
import { PlayerSprite, ShieldSprite } from '../services/assetService';

interface PlayerProps {
  player: PlayerType;
}

const Player: React.FC<PlayerProps> = ({ player }) => {
  const speedBoostActive = player.activePowerUp === 'speed-boost';
  
  return (
    <div
      style={{
        position: 'absolute',
        left: player.x,
        top: player.y,
        width: player.width,
        height: player.height,
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
            transition: player.isInvincible ? 'opacity 0.1s linear' : 'none',
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