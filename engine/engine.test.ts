import { describe, it, expect } from 'vitest';
import { LevelData } from '../types';
import { GROUND_PATROL_RANGE, LAUNCH_MAX_DISTANCE } from '../constants';
import { createWorld, World, EngineEvent } from './world';
import { step } from './step';
import { mulberry32 } from './rng';

const FLOOR_Y = 1100;

const makeLevel = (over: Partial<LevelData> = {}): LevelData => ({
  name: 'test',
  musicTheme: 'adventure',
  levelWidth: 3000,
  levelHeight: 1200,
  playerStart: { x: 100, y: FLOOR_Y - 74 },
  platforms: [{ x: 0, y: FLOOR_Y, width: 3000, height: 40 }],
  items: [],
  enemies: [],
  ...over,
});

const enemy = (type: 'base' | 'jumper' | 'flyer' | 'bomber' | 'phaser', x: number, y: number, size = 50) => ({
  type,
  x,
  y,
  width: size,
  height: size,
  originalX: x,
  originalY: y,
});

const makeWorld = (levels: LevelData[], opts: { score?: number; lives?: number } = {}): World =>
  createWorld({ levels, rng: mulberry32(7), ...opts });

const run = (w: World, steps: number, each?: (w: World, i: number) => void) => {
  for (let i = 0; i < steps; i++) {
    step(w);
    each?.(w, i);
  }
};

const drain = (w: World): EngineEvent[] => w.events.splice(0, w.events.length);

describe('ground enemies (audit G2)', () => {
  it('stay on their platform and turn around at the ledge', () => {
    const w = makeWorld([
      makeLevel({
        platforms: [
          { x: 0, y: FLOOR_Y, width: 3000, height: 40 },
          { x: 500, y: 600, width: 300, height: 30 },
        ],
        enemies: [enemy('base', 600, 550)],
      }),
    ]);
    const e = w.enemies[0];
    let turned = 0;
    let last = e.direction;
    run(w, 1500, () => {
      expect(e.y).toBe(550); // never walks off and falls
      expect(e.x).toBeGreaterThanOrEqual(500 - 1);
      expect(e.x + e.width).toBeLessThanOrEqual(800 + 6);
      if (e.direction !== last) turned++;
      last = e.direction;
    });
    expect(turned).toBeGreaterThanOrEqual(2);
  });

  it('keep patrolling near their spawn on a very long floor instead of marching away', () => {
    const w = makeWorld([makeLevel({ enemies: [enemy('base', 1500, FLOOR_Y - 50)] })]);
    const e = w.enemies[0];
    let minX = e.x;
    let maxX = e.x;
    run(w, 3000, () => {
      minX = Math.min(minX, e.x);
      maxX = Math.max(maxX, e.x);
    });
    expect(maxX - 1500).toBeLessThanOrEqual(GROUND_PATROL_RANGE + 20);
    expect(1500 - minX).toBeLessThanOrEqual(GROUND_PATROL_RANGE + 20);
    expect(maxX - minX).toBeGreaterThan(GROUND_PATROL_RANGE); // and it really does patrol
  });

  it('Hoppy jumps', () => {
    const startY = FLOOR_Y - 50;
    const w = makeWorld([makeLevel({ enemies: [enemy('jumper', 1500, startY)] })]);
    const e = w.enemies[0];
    let minY = e.y;
    run(w, 600, () => {
      minY = Math.min(minY, e.y);
    });
    expect(minY).toBeLessThan(startY - 100);
    expect(e.y).toBeGreaterThan(startY - 5); // and lands again
  });
});

describe('Bomby (audit G3)', () => {
  for (const dx of [150, 300, 450]) {
    it(`hits a stationary player standing ${dx}px away on the same level`, () => {
      const px = 500;
      const w = makeWorld([
        makeLevel({
          playerStart: { x: px, y: FLOOR_Y - 74 },
          enemies: [enemy('bomber', px + dx, FLOOR_Y - 50)],
        }),
      ]);
      let hit = false;
      run(w, 1500, () => {
        if (w.lives < 3) hit = true;
      });
      expect(hit).toBe(true);
    });
  }

  it('does not start walking after being stunned (audit H7)', () => {
    const w = makeWorld([makeLevel({ enemies: [enemy('bomber', 900, FLOOR_Y - 50)] })]);
    const b = w.enemies[0];
    b.state = 'stunned';
    b.stunTimer = 50;
    b.vx = 0;
    run(w, 30);
    expect(b.state).toBe('active');
    expect(b.vx).toBe(0);
    expect(b.x).toBe(900);
  });

  it('bombs burst on the ground instead of flying through it', () => {
    const w = makeWorld([makeLevel({ enemies: [enemy('bomber', 900, FLOOR_Y - 50)] })]);
    w.player.x = 300;
    run(w, 1200);
    expect(w.projectiles.every(p => p.y < FLOOR_Y + 5)).toBe(true);
  });
});

describe('damage, lives and pits (audit H6, M6)', () => {
  it('a pit costs a life even with a shield, keeps the shield and respawns the player', () => {
    const w = makeWorld([makeLevel()]);
    w.player.hasShield = true;
    w.player.x = 400;
    w.player.y = 1500;
    step(w);
    expect(w.lives).toBe(2);
    expect(w.player.hasShield).toBe(true);
    expect(w.player.y).toBeLessThan(1200);
    run(w, 5);
    expect(w.lives).toBe(2); // no second life lost while falling
  });

  it('god mode just respawns without spamming damage', () => {
    const w = makeWorld([makeLevel()]);
    w.isGodMode = true;
    w.player.y = 1500;
    step(w);
    expect(w.lives).toBe(3);
    expect(w.player.y).toBeLessThan(1200);
    const sounds = drain(w).filter(e => e.type === 'sound' && e.name === 'hit').length;
    run(w, 30);
    const later = drain(w).filter(e => e.type === 'sound' && e.name === 'hit').length;
    expect(sounds + later).toBeLessThanOrEqual(2);
  });

  it('a pit and a projectile in the same step cost one life, not two', () => {
    const w = makeWorld([makeLevel()]);
    w.player.x = 400;
    w.player.y = 1500;
    w.projectiles.push({ id: 900, x: 400, y: 1500, width: 38, height: 38, vx: 0, vy: 0 });
    step(w);
    expect(w.lives).toBe(2);
  });

  it('game over is emitted exactly once', () => {
    const w = makeWorld([makeLevel()], { lives: 1 });
    w.player.y = 1500;
    w.projectiles.push({ id: 901, x: w.player.x, y: 1500, width: 38, height: 38, vx: 0, vy: 0 });
    run(w, 10);
    const over = drain(w).filter(e => e.type === 'gameOver');
    expect(w.status).toBe('gameover');
    expect(over).toHaveLength(1);
  });
});

describe('launched enemies (audit M5)', () => {
  it('pop after a maximum distance', () => {
    const w = makeWorld([makeLevel({ enemies: [enemy('base', 200, FLOOR_Y - 50)] })]);
    const e = w.enemies[0];
    e.state = 'launched';
    e.vx = 38;
    e.vy = 0;
    e.launchTravel = 0;
    run(w, 60);
    expect(e.state).toBe('defeated');
    expect(e.x - 200).toBeLessThan(LAUNCH_MAX_DISTANCE + 80);
  });

  it('knock out the enemy in their path and score for it', () => {
    const w = makeWorld([
      makeLevel({ enemies: [enemy('base', 200, FLOOR_Y - 50), enemy('base', 700, FLOOR_Y - 50)] }),
    ]);
    const [a, b] = w.enemies;
    a.state = 'launched';
    a.vx = 38;
    a.vy = 0;
    a.launchTravel = 0;
    run(w, 30);
    expect(a.state).toBe('defeated');
    expect(b.state).toBe('defeated');
    expect(w.score).toBeGreaterThan(0);
  });
});

describe('level flow (audit H3, H4, M2, M9)', () => {
  it('finishing the last level reports score and lives to the host', () => {
    const w = makeWorld(
      [makeLevel({ goal: { x: 400, y: FLOOR_Y - 150, width: 90, height: 150 } })],
      { score: 12345, lives: 2 }
    );
    w.player.x = 410;
    w.player.y = FLOOR_Y - 74;
    step(w);
    expect(w.status).toBe('level-cleared');
    run(w, 140);
    expect(w.status).toBe('completed');
    const done = drain(w).find(e => e.type === 'completed');
    expect(done).toEqual({ type: 'completed', score: 12345, lives: 2 });
  });

  it('keeps simulating effects while the banner is up', () => {
    const w = makeWorld([makeLevel({ goal: { x: 400, y: FLOOR_Y - 150, width: 90, height: 150 } })]);
    w.player.x = 410;
    step(w);
    const rings = w.shockwaves.length;
    expect(rings).toBeGreaterThan(0);
    const before = w.shockwaves[0].radius;
    run(w, 5);
    expect(w.shockwaves.length === 0 || w.shockwaves[0].radius !== before).toBe(true);
  });

  it('the endurance boss lends lives only for the fight', () => {
    const bossLevel = makeLevel({
      levelWidth: 2688,
      levelHeight: 1250,
      boss: { type: 'chickenEye', x: 1100, y: 300, width: 320, height: 320, maxHp: 10 },
    });
    const w = makeWorld([bossLevel, makeLevel()]);
    expect(w.lives).toBe(5);
    w.boss!.hp = 1;
    const b = w.boss!;
    w.playerProjectiles.push({ id: 950, x: b.x + b.width / 2, y: b.y + b.height / 2, width: 24, height: 24, vx: 0, vy: 0 });
    step(w);
    expect(w.status).toBe('level-cleared');
    run(w, 200);
    expect(w.currentLevelIndex).toBe(1);
    expect(w.status).toBe('playing');
    expect(w.lives).toBe(3);
  });

  it('a score carried into a new loop keeps the extra-life threshold consistent', () => {
    const w = makeWorld([makeLevel()], { score: 25000 });
    expect(w.nextExtraLifeScore).toBe(40000);
  });
});

describe('determinism', () => {
  it('same seed and inputs give the same world', () => {
    const levels = [
      makeLevel({
        enemies: [enemy('base', 900, FLOOR_Y - 50), enemy('jumper', 1400, FLOOR_Y - 50), enemy('bomber', 1800, FLOOR_Y - 50)],
      }),
    ];
    const a = makeWorld(levels);
    const b = makeWorld(levels);
    const script = (w: World, i: number) => {
      w.input = { left: false, right: i % 200 < 120, up: false, down: false, shoot: false };
      if (i % 90 === 0) w.actions.push('jump');
    };
    for (let i = 0; i < 900; i++) {
      script(a, i);
      script(b, i);
      step(a);
      step(b);
    }
    expect(JSON.stringify({ p: a.player, e: a.enemies, s: a.score, l: a.lives })).toBe(
      JSON.stringify({ p: b.player, e: b.enemies, s: b.score, l: b.lives })
    );
  });
});
