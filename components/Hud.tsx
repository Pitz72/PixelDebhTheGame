import React from 'react';
import { HeartSprite, ItemSprite } from '../services/assetService';
import { ItemType, Boss } from '../types';

interface HudProps {
  score: number;
  lives: number;
  level: number;
  levelName: string;
  collectiblesLeft: number;
  activePowerUp: ItemType | null;
  boss?: Pick<Boss, 'hp' | 'maxHp'> | null;
  isGodMode: boolean;
  timeRemaining?: number | null;
  loopCount: number;
  playerX?: number;
  levelWidth?: number;
}

const Hud: React.FC<HudProps> = React.memo(({
  score,
  lives,
  level,
  levelName,
  collectiblesLeft,
  activePowerUp,
  boss,
  isGodMode,
  timeRemaining,
  loopCount,
  playerX = 0,
  levelWidth = 1920,
}) => {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPct = Math.min(100, Math.max(0, (playerX / Math.max(1, levelWidth - 180)) * 100));

  return (
    <>
      <div
        className="absolute top-0 left-0 right-0 px-6 py-4 flex justify-between items-start z-20 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(6, 3, 22, 0.88) 0%, rgba(10, 5, 34, 0.55) 75%, transparent 100%)',
          borderBottom: '1px solid rgba(0, 229, 255, 0.25)',
        }}
      >
        {/* Left Telemetry Cluster */}
        <div className="flex flex-col space-y-2.5">
          <div className="flex items-center space-x-6">
            {/* Score Panel */}
            <div className="flex items-center space-x-3 bg-[#0c0726]/80 px-4 py-1.5 rounded-xl border border-cyan-500/40 shadow-[0_0_15px_rgba(0,229,255,0.18)]">
              <span className="text-cyan-400 text-lg font-extrabold tracking-widest">SCORE</span>
              <span className="text-white text-3xl font-black tracking-wider font-mono">
                {score.toString().padStart(8, '0')}
              </span>
            </div>

            {/* Lives Panel */}
            <div className="flex items-center space-x-3 bg-[#0c0726]/80 px-4 py-1.5 rounded-xl border border-pink-500/40 shadow-[0_0_15px_rgba(255,23,68,0.18)]">
              <span className="text-pink-400 text-lg font-extrabold tracking-widest">LIVES</span>
              <div className="flex items-center space-x-1">
                {lives <= 6 ? (
                  Array.from({ length: Math.max(0, lives) }).map((_, i) => (
                    <div key={i} className="w-8 h-8">
                      <HeartSprite />
                    </div>
                  ))
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8">
                      <HeartSprite />
                    </div>
                    <span className="text-white text-2xl font-black">×{lives}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stage & Loop Badge */}
            <div className="flex items-center space-x-3 bg-[#0c0726]/80 px-4 py-1.5 rounded-xl border border-purple-500/40">
              <span className="text-yellow-400 text-lg font-extrabold tracking-widest">STAGE</span>
              <span className="text-white text-3xl font-black">{level}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-pink-600/80 text-white font-bold tracking-wider">
                LOOP {loopCount}
              </span>
            </div>

            {/* Collectibles Counter */}
            {!boss && (
              <div
                className={`flex items-center space-x-2.5 px-4 py-1.5 rounded-xl border ${
                  collectiblesLeft === 0
                    ? 'bg-emerald-950/80 border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.35)]'
                    : 'bg-[#0c0726]/80 border-amber-400/50'
                }`}
              >
                <div className="w-8 h-8">
                  <ItemSprite type="joystick" />
                </div>
                {collectiblesLeft === 0 ? (
                  <span className="text-emerald-300 text-xl font-black tracking-wider animate-pulse">
                    PORTAL OPEN!
                  </span>
                ) : (
                  <span className="text-white text-2xl font-black">× {collectiblesLeft}</span>
                )}
              </div>
            )}
          </div>

          {/* Bottom Row: Level Title & Vector Map Progress Radar */}
          <div className="flex items-center space-x-5 pl-1">
            <p
              className="text-cyan-300 text-xl font-bold tracking-wider uppercase"
              style={{ textShadow: '0 0 10px rgba(0, 229, 255, 0.5)' }}
            >
              {levelName}
            </p>
            {!boss && levelWidth > 2000 && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-cyan-400/80 font-bold tracking-widest">MAP</span>
                <div className="w-56 h-3 bg-slate-900/90 rounded-full border border-cyan-500/40 overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 transition-all duration-150"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="text-xs text-white/80 font-mono">{Math.round(progressPct)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Countdown timer (Labyrinth): under the bar, on the right, clear of the counters */}
        {timeRemaining !== null && timeRemaining !== undefined && (
          <div className="absolute right-6 top-24 flex flex-col items-center bg-[#0c0726]/90 px-6 py-2 rounded-2xl border-2 border-yellow-400/60 shadow-[0_0_20px_rgba(250,204,21,0.25)]">
            <p className="text-yellow-400 text-xs font-bold tracking-widest">TIME REMAINING</p>
            <p
              className={`text-4xl font-black font-mono ${
                timeRemaining < 45 ? 'text-red-500 animate-pulse' : 'text-white'
              }`}
            >
              {formatTime(timeRemaining)}
            </p>
          </div>
        )}

        {/* Right Status Badges */}
        <div className="flex items-center space-x-4">
          {isGodMode && (
            <div className="bg-lime-950/85 px-4 py-2 border-2 border-lime-400 rounded-xl shadow-[0_0_16px_rgba(163,230,53,0.4)]">
              <p className="text-xl text-lime-300 font-black tracking-widest animate-pulse">GOD MODE</p>
            </div>
          )}
          {activePowerUp && (
            <div className="flex items-center space-x-2 bg-[#0c0726]/90 px-4 py-1.5 border-2 border-yellow-400 rounded-xl shadow-[0_0_18px_rgba(250,204,21,0.45)] animate-pulse">
              <div className="w-9 h-9">
                <ItemSprite type={activePowerUp} />
              </div>
              <span className="text-yellow-300 text-sm font-bold uppercase tracking-wider">
                {activePowerUp}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Boss Vector Health Bar */}
      {boss && boss.hp > 0 && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 w-[46%] z-20 pointer-events-none">
          <div className="flex justify-between items-baseline mb-1 px-2">
            <p
              className="text-2xl font-black text-red-400 tracking-wider uppercase"
              style={{ textShadow: '0 0 12px rgba(255,23,68,0.6)' }}
            >
              {levelName}
            </p>
            <p className="text-lg font-mono text-white/90 font-bold">
              HP {boss.hp} / {boss.maxHp}
            </p>
          </div>
          <div className="w-full h-6 bg-slate-950/90 border-2 border-red-500/80 rounded-full overflow-hidden p-0.5 shadow-[0_0_20px_rgba(255,23,68,0.4)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 transition-all duration-150 ease-out"
              style={{ width: `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </>
  );
});

export default Hud;
