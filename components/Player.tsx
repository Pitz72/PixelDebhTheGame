import React from 'react';
import { Player as PlayerType } from '../types';
import { PlayerSprite, ShieldSprite } from '../services/assetService';

interface PlayerProps {
  player: PlayerType;
}

const Player: React.FC<PlayerProps> = React.memo(({ player }) => {
  const speedBoostActive = player.activePowerUp === 'speed-boost';
  const isMoving = Math.abs(player.vx) > 0.2;
  const isJumping = !player.isOnGround;

  const powerUpGlowColor = {
    'speed-boost': 'rgba(255, 238, 0, 0.55)',
    'super-throw': 'rgba(255, 110, 0, 0.65)',
  }[player.activePowerUp || ''] || 'transparent';

  const hasGlow = player.activePowerUp === 'speed-boost' || player.activePowerUp === 'super-throw';
  const trailOffset = player.direction === 'right' ? '-14px' : '14px';

  return (
    <div
      style={{
        position: 'absolute',
        left: player.x,
        top: player.y,
        width: player.width,
        height: player.height,
        boxShadow: hasGlow ? `0 0 28px 10px ${powerUpGlowColor}` : 'none',
        borderRadius: '50%',
        zIndex: 10,
      }}
    >
      {/* Speed Boost Holographic Afterimage */}
      {speedBoostActive && isMoving && (
        <div
          className="absolute bottom-0 w-full opacity-40 pointer-events-none"
          style={{
            left: trailOffset,
            height: 74,
            filter: 'hue-rotate(160deg) brightness(1.4) blur(1px)',
          }}
        >
          <PlayerSprite
            direction={player.direction}
            isInvincible={false}
            isMoving={isMoving}
            isJumping={isJumping}
          />
        </div>
      )}

      {/* Main HD Vector Player Sprite */}
      <div
        className={`absolute left-0 right-0 bottom-0${player.isInvincible ? ' animate-invincible' : ''}`}
        style={{
          height: 74,
          filter: speedBoostActive ? 'saturate(1.4) brightness(1.15)' : 'none',
        }}
      >
        <PlayerSprite
          direction={player.direction}
          isInvincible={player.isInvincible}
          showGlove={player.activePowerUp === 'super-throw' || player.capturedEnemyId !== null}
          isMoving={isMoving}
          isJumping={isJumping}
        />
      </div>

      {/* Hexagonal Force-Field Shield */}
      {player.hasShield && (
        <div className="absolute -inset-3 animate-pulse z-20 pointer-events-none">
          <ShieldSprite />
        </div>
      )}
    </div>
  );
});

export default Player;