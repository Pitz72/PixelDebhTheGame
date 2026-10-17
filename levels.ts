import { LevelData, EnemyType, ItemType } from './types';
import { GAME_WIDTH, GAME_HEIGHT, BOSS_INITIAL_HP, BOSS_2_HP, BOSS_3_HP, MAZE_PLAYER_SPEED, MAZE_ZOOM } from './constants';
import { generateMaze } from './mazeGen';

const GOAL_WIDTH = 90;
const GOAL_HEIGHT = 150;

// Deterministic pseudo-random helper for reproducible level architecture
const seededVal = (seed: number, index: number): number => {
  const x = Math.sin(seed * 9973 + index * 7919) * 10000;
  return x - Math.floor(x);
};

interface ExpansionConfig {
  seed: number;
  baseEndX: number;
  targetWidth: number;
  levelHeight: number;
  allowPits: boolean;
  isSkyway?: boolean;
  allowedEnemies: EnemyType[];
  collectibleInterval: number;
}

/**
 * Generates hand-tuned modular platforming sectors to extend any level
 * up to its exponential +40% target width, guaranteeing:
 * - Zero soft-locks (every high tier has a step-up recovery staircase from the floor)
 * - Regular Checkpoints every ~2600px
 * - Speed-Boosts, Shields, and Super-Throws for exciting high-speed traversal
 */
function buildExponentialExtension(
  baseLevel: LevelData,
  cfg: ExpansionConfig
): LevelData {
  const floorY = cfg.levelHeight - 40;
  const shiftY = cfg.levelHeight - GAME_HEIGHT;

  // Shift base level elements vertically so they sit anchored to floorY (except Skyway which starts at top)
  const platforms = baseLevel.platforms.map(p => ({
    ...p,
    y: cfg.isSkyway && p.y < GAME_HEIGHT - 100 ? p.y : p.y + shiftY,
  }));

  const items = baseLevel.items.map(it => ({
    ...it,
    y: cfg.isSkyway && it.y < GAME_HEIGHT - 150 ? it.y : it.y + shiftY,
  }));

  const enemies = baseLevel.enemies.map(en => {
    const newY = cfg.isSkyway && en.y < GAME_HEIGHT - 150 ? en.y : en.y + shiftY;
    return {
      ...en,
      y: newY,
      originalY: newY,
    };
  });

  const checkpoints: NonNullable<LevelData['checkpoints']> = [];

  // Add recovery staircases in the base section if it's a Skyway or vertical level (fixes Level 5 & Level 9/10 soft-locks!)
  if (cfg.isSkyway) {
    for (let rx = 1600; rx < cfg.baseEndX; rx += 2200) {
      for (let stepY = floorY - 220; stepY >= 320; stepY -= 220) {
        platforms.push({
          x: rx + ((stepY / 220) % 2 === 0 ? 0 : 120),
          y: stepY,
          width: 180,
          height: 28,
        });
      }
    }
  }

  // Checkpoint at the end of the original base section
  checkpoints.push({
    x: Math.min(cfg.baseEndX - 300, 2600),
    y: floorY - 96,
    width: 48,
    height: 96,
  });

  let cursorX = cfg.baseEndX;
  let sectorIdx = 0;
  const collectibleTypes: ItemType[] = ['joystick', 'floppy', 'cartridge'];
  const powerUpTypes: ItemType[] = ['speed-boost', 'shield', 'super-throw'];

  while (cursorX < cfg.targetWidth - 900) {
    sectorIdx++;
    const r1 = seededVal(cfg.seed, sectorIdx * 3 + 1);
    const r2 = seededVal(cfg.seed, sectorIdx * 3 + 2);
    const r3 = seededVal(cfg.seed, sectorIdx * 3 + 3);

    const sectorLen = 900 + Math.floor(r1 * 450); // 900..1350px per sector
    const gap = cfg.allowPits && r2 > 0.45 ? 160 + Math.floor(r3 * 60) : 0; // Safe jumpable pit (160..220px)

    const floorWidth = Math.min(sectorLen, cfg.targetWidth - 500 - cursorX);
    if (floorWidth <= 200) break;

    // 1. Ground Floor Segment
    platforms.push({
      x: cursorX,
      y: floorY,
      width: floorWidth,
      height: 40,
    });

    // 2. Multi-tier Platform Architecture (Low -> Mid -> High)
    const lowY = floorY - (180 + Math.floor(r1 * 50));
    const midY = lowY - (180 + Math.floor(r2 * 50));
    const highY = midY - (180 + Math.floor(r3 * 50));

    const p1X = cursorX + 80;
    const p1W = 240 + Math.floor(r2 * 120);
    platforms.push({ x: p1X, y: lowY, width: p1W, height: 30 });

    const p2X = cursorX + 340;
    const p2W = 280 + Math.floor(r3 * 160);
    platforms.push({ x: p2X, y: midY, width: p2W, height: 30 });

    const p3X = cursorX + 580;
    const p3W = 260 + Math.floor(r1 * 140);
    if (p3X + p3W < cursorX + floorWidth - 40) {
      platforms.push({ x: p3X, y: highY, width: p3W, height: 30 });
    }

    // If Skyway level, also build high altitude sky-islands + vertical recovery tower
    if (cfg.isSkyway) {
      const skyY = 260 + Math.floor(r2 * 140);
      platforms.push({ x: cursorX + 140, y: skyY, width: 380, height: 30 });
      platforms.push({ x: cursorX + 620, y: skyY + 60, width: 320, height: 30 });
      // Recovery step between highY and skyY so player can always climb back up from floor!
      let bridgeY = highY - 210;
      let toggle = 0;
      while (bridgeY > skyY + 120) {
        platforms.push({
          x: cursorX + 200 + (toggle % 2) * 140,
          y: bridgeY,
          width: 170,
          height: 26,
        });
        bridgeY -= 210;
        toggle++;
      }
    }

    // 3. Place Checkpoint every 3 sectors (~3200px)
    if (sectorIdx % 3 === 0) {
      checkpoints.push({
        x: cursorX + 50,
        y: floorY - 96,
        width: 48,
        height: 96,
      });
    }

    // 4. Place Power-Ups (Speed-Boost prioritized for fast map traversal)
    if (sectorIdx % 2 === 1) {
      const pType = sectorIdx % 4 === 1 ? 'speed-boost' : powerUpTypes[sectorIdx % powerUpTypes.length];
      items.push({
        type: pType,
        x: p1X + Math.floor(p1W / 2) - 25,
        y: lowY - 65,
        width: 50,
        height: 50,
      });
    }

    // 5. Place Collectibles at regular intervals
    if (sectorIdx % cfg.collectibleInterval === 0) {
      const cType = collectibleTypes[sectorIdx % collectibleTypes.length];
      items.push({
        type: cType,
        x: p2X + Math.floor(p2W / 2) - 25,
        y: midY - 65,
        width: 50,
        height: 50,
      });
    }

    // 6. Populate Enemies
    const enemyType1 = cfg.allowedEnemies[sectorIdx % cfg.allowedEnemies.length];
    if (enemyType1 === 'flyer') {
      enemies.push({
        type: 'flyer',
        x: p2X + 60,
        y: midY - 140,
        width: 60,
        height: 44,
        originalX: p2X + 60,
        originalY: midY - 140,
      });
    } else {
      enemies.push({
        type: enemyType1,
        x: p2X + 80,
        y: midY - 52,
        width: 50,
        height: 50,
        originalX: p2X + 80,
        originalY: midY - 52,
      });
    }

    if (r3 > 0.35) {
      const enemyType2 = cfg.allowedEnemies[(sectorIdx + 1) % cfg.allowedEnemies.length];
      enemies.push({
        type: enemyType2,
        x: cursorX + Math.floor(floorWidth * 0.65),
        y: enemyType2 === 'flyer' ? lowY - 110 : floorY - 52,
        width: enemyType2 === 'flyer' ? 60 : 50,
        height: enemyType2 === 'flyer' ? 44 : 50,
        originalX: cursorX + Math.floor(floorWidth * 0.65),
        originalY: enemyType2 === 'flyer' ? lowY - 110 : floorY - 52,
      });
    }

    cursorX += floorWidth + gap;
  }

  // Final Goal Landing Runway
  const finalRunwayStart = Math.min(cursorX, cfg.targetWidth - 700);
  const finalRunwayWidth = cfg.targetWidth - finalRunwayStart;
  platforms.push({
    x: finalRunwayStart,
    y: floorY,
    width: finalRunwayWidth,
    height: 40,
  });

  return {
    ...baseLevel,
    levelWidth: cfg.targetWidth,
    levelHeight: cfg.levelHeight,
    playerStart: {
      x: baseLevel.playerStart.x,
      y: cfg.isSkyway ? baseLevel.playerStart.y : baseLevel.playerStart.y + shiftY,
    },
    platforms,
    items,
    enemies,
    checkpoints,
    goal: {
      x: cfg.targetWidth - 180,
      y: floorY - GOAL_HEIGHT,
      width: GOAL_WIDTH,
      height: GOAL_HEIGHT,
    },
  };
}

// ============================================================================
// EXPONENTIAL +40% PROGRESSIVE LEVEL DEFINITIONS (LEVELS 1 TO 13)
// Formula: W(k) = 4500 * (1.40 ^ k)
// ============================================================================

// --- LEVEL 1: Neon Outskirts (4500 * 1.4^1 = 6,300 px) ---
const rawLevel1: LevelData = {
  name: "Level 1: Neon Outskirts",
  musicTheme: 'adventure',
  playerStart: { x: 100, y: GAME_HEIGHT - 120 },
  platforms: [
    { x: 0, y: GAME_HEIGHT - 40, width: 4500, height: 40 },
    { x: 300, y: GAME_HEIGHT - 200, width: 220, height: 30 },
    { x: 600, y: GAME_HEIGHT - 350, width: 220, height: 30 },
    { x: 900, y: GAME_HEIGHT - 500, width: 420, height: 30 },
    { x: 900, y: GAME_HEIGHT - 200, width: 420, height: 30 },
    { x: 1400, y: GAME_HEIGHT - 350, width: 320, height: 30 },
    { x: 1800, y: GAME_HEIGHT - 250, width: 320, height: 30 },
    { x: 1800, y: GAME_HEIGHT - 650, width: 320, height: 30 },
    { x: 2200, y: GAME_HEIGHT - 450, width: 600, height: 30 },
    { x: 2900, y: GAME_HEIGHT - 300, width: 220, height: 30 },
    { x: 3200, y: GAME_HEIGHT - 450, width: 220, height: 30 },
    { x: 3500, y: GAME_HEIGHT - 600, width: 400, height: 30 },
    { x: 4000, y: GAME_HEIGHT - 200, width: 420, height: 30 },
  ],
  items: [
    { type: 'joystick', x: 350, y: GAME_HEIGHT - 270, width: 50, height: 50 },
    { type: 'floppy', x: 1000, y: GAME_HEIGHT - 570, width: 50, height: 50 },
    { type: 'cartridge', x: 1900, y: GAME_HEIGHT - 720, width: 50, height: 50 },
    { type: 'shield', x: 1500, y: GAME_HEIGHT - 420, width: 50, height: 50 },
    { type: 'super-throw', x: 2500, y: GAME_HEIGHT - 520, width: 50, height: 50 },
    { type: 'joystick', x: 3600, y: GAME_HEIGHT - 670, width: 50, height: 50 },
    { type: 'floppy', x: 4100, y: GAME_HEIGHT - 270, width: 50, height: 50 },
  ],
  enemies: [
    { type: 'base', x: 400, y: GAME_HEIGHT - 90, width: 50, height: 50, originalX: 400, originalY: GAME_HEIGHT - 90 },
    { type: 'base', x: 1000, y: GAME_HEIGHT - 550, width: 50, height: 50, originalX: 1000, originalY: GAME_HEIGHT - 550 },
    { type: 'base', x: 1000, y: GAME_HEIGHT - 250, width: 50, height: 50, originalX: 1000, originalY: GAME_HEIGHT - 250 },
    { type: 'base', x: 2300, y: GAME_HEIGHT - 500, width: 50, height: 50, originalX: 2300, originalY: GAME_HEIGHT - 500 },
    { type: 'base', x: 2600, y: GAME_HEIGHT - 500, width: 50, height: 50, originalX: 2600, originalY: GAME_HEIGHT - 500 },
    { type: 'base', x: 3300, y: GAME_HEIGHT - 90, width: 50, height: 50, originalX: 3300, originalY: GAME_HEIGHT - 90 },
    { type: 'base', x: 3700, y: GAME_HEIGHT - 650, width: 50, height: 50, originalX: 3700, originalY: GAME_HEIGHT - 650 },
  ],
};

const level1 = buildExponentialExtension(rawLevel1, {
  seed: 101,
  baseEndX: 4500,
  targetWidth: 6300,
  levelHeight: 1080,
  allowPits: false,
  allowedEnemies: ['base'],
  collectibleInterval: 1,
});

// --- LEVEL 2: Circuit City (4500 * 1.4^2 = 8,820 px) ---
const rawLevel2: LevelData = {
  name: "Level 2: Circuit City",
  musicTheme: 'adventure',
  playerStart: { x: 100, y: GAME_HEIGHT - 120 },
  platforms: [
    { x: 0, y: GAME_HEIGHT - 40, width: 4800, height: 40 },
    { x: 400, y: GAME_HEIGHT - 200, width: 220, height: 30 },
    { x: 700, y: GAME_HEIGHT - 350, width: 220, height: 30 },
    { x: 1000, y: GAME_HEIGHT - 500, width: 320, height: 30 },
    { x: 1400, y: GAME_HEIGHT - 650, width: 240, height: 30 },
    { x: 1700, y: GAME_HEIGHT - 400, width: 240, height: 30 },
    { x: 2000, y: GAME_HEIGHT - 250, width: 240, height: 30 },
    { x: 2300, y: GAME_HEIGHT - 400, width: 800, height: 30 },
    { x: 2500, y: GAME_HEIGHT - 700, width: 420, height: 30 },
    { x: 3200, y: GAME_HEIGHT - 250, width: 320, height: 30 },
    { x: 3600, y: GAME_HEIGHT - 450, width: 320, height: 30 },
    { x: 4000, y: GAME_HEIGHT - 650, width: 320, height: 30 },
    { x: 4400, y: GAME_HEIGHT - 350, width: 300, height: 30 },
  ],
  items: [
    { type: 'joystick', x: 450, y: GAME_HEIGHT - 270, width: 50, height: 50 },
    { type: 'floppy', x: 1100, y: GAME_HEIGHT - 570, width: 50, height: 50 },
    { type: 'cartridge', x: 2600, y: GAME_HEIGHT - 770, width: 50, height: 50 },
    { type: 'speed-boost', x: 2400, y: GAME_HEIGHT - 470, width: 50, height: 50 },
    { type: 'shield', x: 3700, y: GAME_HEIGHT - 520, width: 50, height: 50 },
    { type: 'joystick', x: 4100, y: GAME_HEIGHT - 720, width: 50, height: 50 },
  ],
  enemies: [
    { type: 'base', x: 750, y: GAME_HEIGHT - 400, width: 50, height: 50, originalX: 750, originalY: GAME_HEIGHT - 400 },
    { type: 'base', x: 1100, y: GAME_HEIGHT - 550, width: 50, height: 50, originalX: 1100, originalY: GAME_HEIGHT - 550 },
    { type: 'base', x: 2500, y: GAME_HEIGHT - 450, width: 50, height: 50, originalX: 2500, originalY: GAME_HEIGHT - 450 },
    { type: 'base', x: 2800, y: GAME_HEIGHT - 450, width: 50, height: 50, originalX: 2800, originalY: GAME_HEIGHT - 450 },
    { type: 'base', x: 2700, y: GAME_HEIGHT - 750, width: 50, height: 50, originalX: 2700, originalY: GAME_HEIGHT - 750 },
    { type: 'base', x: 3700, y: GAME_HEIGHT - 90, width: 50, height: 50, originalX: 3700, originalY: GAME_HEIGHT - 90 },
    { type: 'base', x: 4100, y: GAME_HEIGHT - 700, width: 50, height: 50, originalX: 4100, originalY: GAME_HEIGHT - 700 },
  ],
};

const level2 = buildExponentialExtension(rawLevel2, {
  seed: 202,
  baseEndX: 4800,
  targetWidth: 8820,
  levelHeight: 1200,
  allowPits: false,
  allowedEnemies: ['base', 'jumper'],
  collectibleInterval: 1,
});

// --- LEVEL 3: Hoppy Hills (4500 * 1.4^3 = 12,350 px) ---
const rawLevel3: LevelData = {
  name: "Level 3: Hoppy Hills",
  musicTheme: 'adventure',
  playerStart: { x: 100, y: GAME_HEIGHT - 120 },
  platforms: [
    { x: 0, y: GAME_HEIGHT - 40, width: 550, height: 40 },
    { x: 650, y: GAME_HEIGHT - 250, width: 620, height: 30 },
    { x: 1400, y: GAME_HEIGHT - 40, width: 850, height: 40 },
    { x: 200, y: GAME_HEIGHT - 500, width: 320, height: 30 },
    { x: 700, y: GAME_HEIGHT - 700, width: 520, height: 30 },
    { x: 2300, y: GAME_HEIGHT - 200, width: 420, height: 30 },
    { x: 2850, y: GAME_HEIGHT - 400, width: 340, height: 30 },
    { x: 2400, y: GAME_HEIGHT - 600, width: 420, height: 30 },
    { x: 3300, y: GAME_HEIGHT - 40, width: 1200, height: 40 },
  ],
  items: [
    { type: 'joystick', x: 800, y: GAME_HEIGHT - 320, width: 50, height: 50 },
    { type: 'floppy', x: 300, y: GAME_HEIGHT - 570, width: 50, height: 50 },
    { type: 'cartridge', x: 900, y: GAME_HEIGHT - 770, width: 50, height: 50 },
    { type: 'super-throw', x: 2650, y: GAME_HEIGHT - 670, width: 50, height: 50 },
    { type: 'speed-boost', x: 4200, y: GAME_HEIGHT - 110, width: 50, height: 50 },
    { type: 'cartridge', x: 3800, y: GAME_HEIGHT - 110, width: 50, height: 50 },
  ],
  enemies: [
    { type: 'jumper', x: 700, y: GAME_HEIGHT - 300, width: 50, height: 50, originalX: 700, originalY: GAME_HEIGHT - 300 },
    { type: 'base', x: 1500, y: GAME_HEIGHT - 90, width: 50, height: 50, originalX: 1500, originalY: GAME_HEIGHT - 90 },
    { type: 'base', x: 300, y: GAME_HEIGHT - 90, width: 50, height: 50, originalX: 300, originalY: GAME_HEIGHT - 90 },
    { type: 'jumper', x: 1800, y: GAME_HEIGHT - 90, width: 50, height: 50, originalX: 1800, originalY: GAME_HEIGHT - 90 },
    { type: 'base', x: 2500, y: GAME_HEIGHT - 250, width: 50, height: 50, originalX: 2500, originalY: GAME_HEIGHT - 250 },
    { type: 'jumper', x: 3400, y: GAME_HEIGHT - 90, width: 50, height: 50, originalX: 3400, originalY: GAME_HEIGHT - 90 },
    { type: 'base', x: 4000, y: GAME_HEIGHT - 90, width: 50, height: 50, originalX: 4000, originalY: GAME_HEIGHT - 90 },
  ],
};

const level3 = buildExponentialExtension(rawLevel3, {
  seed: 303,
  baseEndX: 4500,
  targetWidth: 12350,
  levelHeight: 1300,
  allowPits: true,
  allowedEnemies: ['base', 'jumper'],
  collectibleInterval: 2,
});

// --- LEVEL 4 — BOSS 1: Cyclops Frog (Arena Expanded +40%: 2688 x 1200 px) ---
const bossLevel1: LevelData = {
  name: "Level 4 — BOSS: Cyclops Frog",
  musicTheme: 'boss',
  musicTrack: 'bossFrog',
  levelWidth: 2688,
  levelHeight: 1200,
  playerStart: { x: 200, y: 1200 - 130 },
  platforms: [
    { x: 0, y: 1200 - 40, width: 2688, height: 40 },
    { x: 220, y: 1200 - 260, width: 320, height: 28 },
    { x: 1180, y: 1200 - 380, width: 328, height: 28 },
    { x: 2140, y: 1200 - 260, width: 320, height: 28 },
  ],
  items: [],
  enemies: [],
  boss: {
    type: 'frog',
    x: 1344 - 160,
    y: 320,
    width: 320,
    height: 320,
    maxHp: BOSS_INITIAL_HP,
  },
};

// --- LEVEL 5: Vertical Ventures (4500 * 1.4^4 = 17,290 px) ---
const rawLevel5: LevelData = {
  name: "Level 5: Vertical Ventures",
  musicTheme: 'industrial',
  playerStart: { x: 80, y: GAME_HEIGHT - 120 },
  platforms: [
    { x: 0, y: GAME_HEIGHT - 40, width: 5200, height: 40 }, // Continuous safety floor + recovery steps
    { x: 450, y: GAME_HEIGHT - 200, width: 200, height: 30 },
    { x: 220, y: GAME_HEIGHT - 360, width: 200, height: 30 },
    { x: 520, y: GAME_HEIGHT - 510, width: 220, height: 30 },
    { x: 850, y: GAME_HEIGHT - 660, width: 280, height: 30 },
    { x: 1200, y: GAME_HEIGHT - 810, width: 420, height: 30 },
    { x: 1700, y: GAME_HEIGHT - 950, width: 260, height: 30 },
    { x: 2150, y: GAME_HEIGHT - 800, width: 320, height: 30 },
    { x: 2600, y: GAME_HEIGHT - 650, width: 220, height: 30 },
    { x: 2300, y: GAME_HEIGHT - 500, width: 220, height: 30 },
    { x: 2600, y: GAME_HEIGHT - 350, width: 420, height: 30 },
    { x: 3200, y: GAME_HEIGHT - 200, width: 420, height: 30 },
    // Middle recovery steps so player can climb back up from floor anywhere
    { x: 1500, y: GAME_HEIGHT - 220, width: 200, height: 30 },
    { x: 1800, y: GAME_HEIGHT - 420, width: 200, height: 30 },
    { x: 1500, y: GAME_HEIGHT - 620, width: 200, height: 30 },
  ],
  items: [
    { type: 'super-throw', x: 520, y: GAME_HEIGHT - 270, width: 50, height: 50 },
    { type: 'floppy', x: 900, y: GAME_HEIGHT - 730, width: 50, height: 50 },
    { type: 'cartridge', x: 1780, y: GAME_HEIGHT - 1020, width: 50, height: 50 },
    { type: 'shield', x: 2700, y: GAME_HEIGHT - 420, width: 50, height: 50 },
    { type: 'joystick', x: 280, y: GAME_HEIGHT - 430, width: 50, height: 50 },
    { type: 'cartridge', x: 1300, y: GAME_HEIGHT - 880, width: 50, height: 50 },
    { type: 'floppy', x: 2360, y: GAME_HEIGHT - 570, width: 50, height: 50 },
    { type: 'joystick', x: 3400, y: GAME_HEIGHT - 270, width: 50, height: 50 },
  ],
  enemies: [
    { type: 'base', x: 200, y: GAME_HEIGHT - 90, width: 50, height: 50, originalX: 200, originalY: GAME_HEIGHT - 90 },
    { type: 'jumper', x: 900, y: GAME_HEIGHT - 710, width: 50, height: 50, originalX: 900, originalY: GAME_HEIGHT - 710 },
    { type: 'jumper', x: 1300, y: GAME_HEIGHT - 860, width: 50, height: 50, originalX: 1300, originalY: GAME_HEIGHT - 860 },
    { type: 'base', x: 2750, y: GAME_HEIGHT - 400, width: 50, height: 50, originalX: 2750, originalY: GAME_HEIGHT - 400 },
    { type: 'jumper', x: 4000, y: GAME_HEIGHT - 90, width: 50, height: 50, originalX: 4000, originalY: GAME_HEIGHT - 90 },
    { type: 'base', x: 4500, y: GAME_HEIGHT - 90, width: 50, height: 50, originalX: 4500, originalY: GAME_HEIGHT - 90 },
  ],
};

const level5 = buildExponentialExtension(rawLevel5, {
  seed: 505,
  baseEndX: 5200,
  targetWidth: 17290,
  levelHeight: 1500,
  allowPits: true,
  allowedEnemies: ['base', 'jumper', 'flyer'],
  collectibleInterval: 2,
});

// --- LEVEL 6: Flappy Skies (4500 * 1.4^5 = 24,200 px) ---
const rawLevel6: LevelData = {
  name: "Level 6: Flappy Skies",
  musicTheme: 'industrial',
  playerStart: { x: 100, y: GAME_HEIGHT - 120 },
  platforms: [
    { x: 0, y: GAME_HEIGHT - 40, width: 1000, height: 40 },
    { x: 1150, y: GAME_HEIGHT - 40, width: 800, height: 40 },
    { x: 2100, y: GAME_HEIGHT - 40, width: 3900, height: 40 },
    { x: 500, y: GAME_HEIGHT - 250, width: 900, height: 30 },
    { x: 1600, y: GAME_HEIGHT - 450, width: 320, height: 30 },
    { x: 100, y: GAME_HEIGHT - 500, width: 240, height: 30 },
    { x: 500, y: GAME_HEIGHT - 650, width: 900, height: 30 },
    { x: 2300, y: GAME_HEIGHT - 200, width: 420, height: 30 },
    { x: 2900, y: GAME_HEIGHT - 350, width: 220, height: 30 },
    { x: 3300, y: GAME_HEIGHT - 500, width: 800, height: 30 },
    { x: 4500, y: GAME_HEIGHT - 250, width: 500, height: 30 },
    { x: 5200, y: GAME_HEIGHT - 550, width: 420, height: 30 },
  ],
  items: [
    { type: 'shield', x: 150, y: GAME_HEIGHT - 570, width: 50, height: 50 },
    { type: 'floppy', x: 950, y: GAME_HEIGHT - 720, width: 50, height: 50 },
    { type: 'cartridge', x: 3500, y: GAME_HEIGHT - 570, width: 50, height: 50 },
    { type: 'speed-boost', x: 4600, y: GAME_HEIGHT - 320, width: 50, height: 50 },
    { type: 'joystick', x: 600, y: GAME_HEIGHT - 320, width: 50, height: 50 },
    { type: 'cartridge', x: 1700, y: GAME_HEIGHT - 520, width: 50, height: 50 },
    { type: 'floppy', x: 2500, y: GAME_HEIGHT - 270, width: 50, height: 50 },
    { type: 'joystick', x: 5300, y: GAME_HEIGHT - 620, width: 50, height: 50 },
  ],
  enemies: [
    { type: 'flyer', x: 900, y: 560, width: 60, height: 44, originalX: 900, originalY: 560 },
    { type: 'jumper', x: 400, y: GAME_HEIGHT - 90, width: 50, height: 50, originalX: 400, originalY: GAME_HEIGHT - 90 },
    { type: 'base', x: 1500, y: GAME_HEIGHT - 90, width: 50, height: 50, originalX: 1500, originalY: GAME_HEIGHT - 90 },
    { type: 'flyer', x: 2600, y: 300, width: 60, height: 44, originalX: 2600, originalY: 300 },
    { type: 'jumper', x: 3000, y: GAME_HEIGHT - 90, width: 50, height: 50, originalX: 3000, originalY: GAME_HEIGHT - 90 },
    { type: 'base', x: 3800, y: GAME_HEIGHT - 550, width: 50, height: 50, originalX: 3800, originalY: GAME_HEIGHT - 550 },
    { type: 'flyer', x: 4800, y: 350, width: 60, height: 44, originalX: 4800, originalY: 350 },
    { type: 'base', x: 5500, y: GAME_HEIGHT - 90, width: 50, height: 50, originalX: 5500, originalY: GAME_HEIGHT - 90 },
  ],
};

const level6 = buildExponentialExtension(rawLevel6, {
  seed: 606,
  baseEndX: 6000,
  targetWidth: 24200,
  levelHeight: 1550,
  allowPits: true,
  allowedEnemies: ['base', 'jumper', 'flyer'],
  collectibleInterval: 3,
});

// --- LEVEL 8 — BOSS 2: LeGallineNellOcchi (Arena Expanded +40%: 2688 x 1250 px) ---
const bossLevel2: LevelData = {
  name: "Level 8 — BOSS: LeGallineNellOcchi",
  musicTheme: 'boss',
  musicTrack: 'bossChickenEye',
  levelWidth: 2688,
  levelHeight: 1250,
  playerStart: { x: 200, y: 1250 - 130 },
  platforms: [
    { x: 0, y: 1250 - 40, width: 2688, height: 40 },
    { x: 300, y: 1250 - 250, width: 280, height: 28 },
    { x: 2108, y: 1250 - 250, width: 280, height: 28 },
  ],
  items: [],
  enemies: [],
  boss: {
    type: 'chickenEye',
    x: 1344 - 150,
    y: 320,
    width: 300,
    height: 300,
    maxHp: BOSS_2_HP,
  },
};

// --- LEVEL 7: The Gauntlet (4500 * 1.4^6 = 33,880 px) ---
const rawLevel7: LevelData = {
  name: "Level 7: The Gauntlet",
  musicTheme: 'industrial',
  playerStart: { x: 60, y: GAME_HEIGHT - 120 },
  platforms: [
    { x: 0, y: GAME_HEIGHT - 40, width: 1000, height: 40 },
    { x: 1180, y: GAME_HEIGHT - 40, width: 1020, height: 40 },
    { x: 2380, y: GAME_HEIGHT - 40, width: 1520, height: 40 },
    { x: 4080, y: GAME_HEIGHT - 40, width: 1020, height: 40 },
    { x: 5280, y: GAME_HEIGHT - 40, width: 2220, height: 40 },
    { x: 1000, y: GAME_HEIGHT - 250, width: 220, height: 30 },
    { x: 1400, y: GAME_HEIGHT - 450, width: 420, height: 30 },
    { x: 2000, y: GAME_HEIGHT - 600, width: 320, height: 30 },
    { x: 2500, y: GAME_HEIGHT - 400, width: 420, height: 30 },
    { x: 3000, y: GAME_HEIGHT - 250, width: 220, height: 30 },
    { x: 3300, y: GAME_HEIGHT - 250, width: 220, height: 30 },
    { x: 3600, y: GAME_HEIGHT - 250, width: 220, height: 30 },
    { x: 4000, y: GAME_HEIGHT - 550, width: 800, height: 30 },
    { x: 5000, y: GAME_HEIGHT - 400, width: 240, height: 30 },
    { x: 5400, y: GAME_HEIGHT - 250, width: 240, height: 30 },
    { x: 6000, y: GAME_HEIGHT - 200, width: 240, height: 30 },
    { x: 6300, y: GAME_HEIGHT - 350, width: 240, height: 30 },
    { x: 6600, y: GAME_HEIGHT - 500, width: 420, height: 30 },
  ],
  items: [
    { type: 'shield', x: 1500, y: GAME_HEIGHT - 510, width: 50, height: 50 },
    { type: 'joystick', x: 2120, y: GAME_HEIGHT - 660, width: 50, height: 50 },
    { type: 'floppy', x: 3080, y: GAME_HEIGHT - 310, width: 50, height: 50 },
    { type: 'cartridge', x: 3680, y: GAME_HEIGHT - 310, width: 50, height: 50 },
    { type: 'super-throw', x: 4400, y: GAME_HEIGHT - 610, width: 50, height: 50 },
    { type: 'speed-boost', x: 5460, y: GAME_HEIGHT - 310, width: 50, height: 50 },
    { type: 'joystick', x: 6750, y: GAME_HEIGHT - 560, width: 50, height: 50 },
    { type: 'shield', x: 7000, y: GAME_HEIGHT - 110, width: 50, height: 50 },
  ],
  enemies: [
    { type: 'jumper', x: 500, y: GAME_HEIGHT - 90, width: 50, height: 50, originalX: 500, originalY: GAME_HEIGHT - 90 },
    { type: 'flyer', x: 1400, y: GAME_HEIGHT - 530, width: 60, height: 44, originalX: 1400, originalY: GAME_HEIGHT - 530 },
    { type: 'bomber', x: 1700, y: GAME_HEIGHT - 500, width: 50, height: 50, originalX: 1700, originalY: GAME_HEIGHT - 500 },
    { type: 'phaser', x: 2800, y: GAME_HEIGHT - 90, width: 50, height: 50, originalX: 2800, originalY: GAME_HEIGHT - 90 },
    { type: 'bomber', x: 3380, y: GAME_HEIGHT - 300, width: 50, height: 50, originalX: 3380, originalY: GAME_HEIGHT - 300 },
    { type: 'flyer', x: 4200, y: GAME_HEIGHT - 660, width: 60, height: 44, originalX: 4200, originalY: GAME_HEIGHT - 660 },
    { type: 'base', x: 5500, y: GAME_HEIGHT - 90, width: 50, height: 50, originalX: 5500, originalY: GAME_HEIGHT - 90 },
    { type: 'jumper', x: 5800, y: GAME_HEIGHT - 90, width: 50, height: 50, originalX: 5800, originalY: GAME_HEIGHT - 90 },
    { type: 'bomber', x: 6800, y: GAME_HEIGHT - 550, width: 50, height: 50, originalX: 6800, originalY: GAME_HEIGHT - 550 },
    { type: 'phaser', x: 7100, y: GAME_HEIGHT - 90, width: 50, height: 50, originalX: 7100, originalY: GAME_HEIGHT - 90 },
  ],
};

const level7 = buildExponentialExtension(rawLevel7, {
  seed: 808,
  baseEndX: 7500,
  targetWidth: 33880,
  levelHeight: 1650,
  allowPits: true,
  allowedEnemies: ['base', 'jumper', 'flyer', 'bomber', 'phaser'],
  collectibleInterval: 3,
});

// --- LEVEL 9: The Ascent (4500 * 1.4^7 = 47,430 px) ---
const rawLevel9: LevelData = {
  name: "Level 9: The Ascent",
  musicTheme: 'ethereal',
  playerStart: { x: 60, y: GAME_HEIGHT - 120 },
  platforms: [
    { x: 0, y: GAME_HEIGHT - 40, width: 9500, height: 40 }, // Continuous safety base + ascent steps
    { x: 650, y: GAME_HEIGHT - 200, width: 220, height: 30 },
    { x: 900, y: GAME_HEIGHT - 350, width: 220, height: 30 },
    { x: 1150, y: GAME_HEIGHT - 500, width: 220, height: 30 },
    { x: 1400, y: GAME_HEIGHT - 650, width: 320, height: 30 },
    { x: 1800, y: GAME_HEIGHT - 650, width: 1000, height: 30 },
    { x: 2900, y: GAME_HEIGHT - 500, width: 240, height: 30 },
    { x: 3200, y: GAME_HEIGHT - 350, width: 240, height: 30 },
    { x: 4400, y: GAME_HEIGHT - 200, width: 260, height: 30 },
    { x: 4800, y: GAME_HEIGHT - 350, width: 260, height: 30 },
    { x: 5200, y: GAME_HEIGHT - 500, width: 260, height: 30 },
    { x: 5600, y: GAME_HEIGHT - 650, width: 1000, height: 30 },
    { x: 6800, y: GAME_HEIGHT - 500, width: 420, height: 30 },
    { x: 7400, y: GAME_HEIGHT - 350, width: 420, height: 30 },
    { x: 8000, y: GAME_HEIGHT - 200, width: 420, height: 30 },
  ],
  items: [
    { type: 'joystick', x: 1450, y: GAME_HEIGHT - 720, width: 50, height: 50 },
    { type: 'shield', x: 2000, y: GAME_HEIGHT - 720, width: 50, height: 50 },
    { type: 'floppy', x: 3800, y: GAME_HEIGHT - 110, width: 50, height: 50 },
    { type: 'speed-boost', x: 5300, y: GAME_HEIGHT - 560, width: 50, height: 50 },
    { type: 'cartridge', x: 6200, y: GAME_HEIGHT - 720, width: 50, height: 50 },
    { type: 'super-throw', x: 7500, y: GAME_HEIGHT - 410, width: 50, height: 50 },
  ],
  enemies: [
    { type: 'phaser', x: 1000, y: GAME_HEIGHT - 400, width: 50, height: 50, originalX: 1000, originalY: GAME_HEIGHT - 400 },
    { type: 'flyer', x: 2200, y: GAME_HEIGHT - 780, width: 60, height: 44, originalX: 2200, originalY: GAME_HEIGHT - 780 },
    { type: 'bomber', x: 3900, y: GAME_HEIGHT - 90, width: 50, height: 50, originalX: 3900, originalY: GAME_HEIGHT - 90 },
    { type: 'jumper', x: 4800, y: GAME_HEIGHT - 400, width: 50, height: 50, originalX: 4800, originalY: GAME_HEIGHT - 400 },
    { type: 'flyer', x: 5600, y: GAME_HEIGHT - 750, width: 60, height: 44, originalX: 5600, originalY: GAME_HEIGHT - 750 },
    { type: 'phaser', x: 6000, y: GAME_HEIGHT - 700, width: 50, height: 50, originalX: 6000, originalY: GAME_HEIGHT - 700 },
    { type: 'bomber', x: 8700, y: GAME_HEIGHT - 90, width: 50, height: 50, originalX: 8700, originalY: GAME_HEIGHT - 90 },
  ],
};

const level9 = buildExponentialExtension(rawLevel9, {
  seed: 909,
  baseEndX: 9500,
  targetWidth: 47430,
  levelHeight: 1850,
  allowPits: true,
  allowedEnemies: ['jumper', 'flyer', 'bomber', 'phaser'],
  collectibleInterval: 4,
});

// --- LEVEL 10: The Drop (4500 * 1.4^8 = 66,400 px) ---
const rawLevel10: LevelData = {
  name: "Level 10: The Drop",
  musicTheme: 'ethereal',
  playerStart: { x: 100, y: 100 },
  platforms: [
    { x: 0, y: 200, width: 420, height: 30 },
    { x: 600, y: 350, width: 500, height: 30 },
    { x: 1300, y: 500, width: 320, height: 30 },
    { x: 1800, y: 650, width: 800, height: 30 },
    { x: 2800, y: 500, width: 240, height: 30 },
    { x: 3200, y: 350, width: 420, height: 30 },
    // Skyway
    { x: 3800, y: 200, width: 420, height: 30 },
    { x: 4350, y: 200, width: 320, height: 30 },
    { x: 4800, y: 250, width: 420, height: 30 },
    { x: 5400, y: 200, width: 240, height: 30 },
    { x: 5800, y: 300, width: 500, height: 30 },
    { x: 6500, y: 200, width: 420, height: 30 },
    { x: 7100, y: 400, width: 320, height: 30 },
    { x: 7500, y: 200, width: 600, height: 30 },
    { x: 8300, y: 250, width: 320, height: 30 },
    { x: 8800, y: 200, width: 420, height: 30 },
    { x: 9400, y: 300, width: 420, height: 30 },
    { x: 10000, y: 400, width: 800, height: 30 },
    { x: 0, y: GAME_HEIGHT - 40, width: 11000, height: 40 },
  ],
  items: [
    { type: 'shield', x: 1400, y: 430, width: 50, height: 50 },
    { type: 'joystick', x: 2200, y: 580, width: 50, height: 50 },
    { type: 'cartridge', x: 4450, y: 140, width: 50, height: 50 },
    { type: 'floppy', x: 750, y: 280, width: 50, height: 50 },
    { type: 'cartridge', x: 2850, y: 430, width: 50, height: 50 },
    { type: 'joystick', x: 3300, y: 280, width: 50, height: 50 },
    { type: 'super-throw', x: 6700, y: 140, width: 50, height: 50 },
    { type: 'shield', x: 8400, y: 190, width: 50, height: 50 },
  ],
  enemies: [
    { type: 'flyer', x: 800, y: 200, width: 60, height: 44, originalX: 800, originalY: 200 },
    { type: 'bomber', x: 2000, y: 600, width: 50, height: 50, originalX: 2000, originalY: 600 },
    { type: 'jumper', x: 4900, y: 200, width: 50, height: 50, originalX: 4900, originalY: 200 },
    { type: 'flyer', x: 6000, y: 200, width: 60, height: 44, originalX: 6000, originalY: 200 },
    { type: 'jumper', x: 7700, y: 150, width: 50, height: 50, originalX: 7700, originalY: 150 },
    { type: 'phaser', x: 9000, y: 150, width: 50, height: 50, originalX: 9000, originalY: 150 },
    { type: 'phaser', x: 5000, y: 100, width: 50, height: 50, originalX: 5000, originalY: 100 },
    { type: 'jumper', x: 7000, y: GAME_HEIGHT - 90, width: 50, height: 50, originalX: 7000, originalY: GAME_HEIGHT - 90 },
    { type: 'phaser', x: 9000, y: GAME_HEIGHT - 90, width: 50, height: 50, originalX: 9000, originalY: GAME_HEIGHT - 90 },
  ],
};

const level10 = buildExponentialExtension(rawLevel10, {
  seed: 1010,
  baseEndX: 11000,
  targetWidth: 66400,
  levelHeight: 2050,
  allowPits: false,
  isSkyway: true,
  allowedEnemies: ['jumper', 'flyer', 'bomber', 'phaser'],
  collectibleInterval: 5,
});

// --- LEVEL 11: The Phantom Reach (4500 * 1.4^9 = 92,960 px) ---
// The third level of the ethereal world: ghosts over broken ground, then a long elevated
// causeway, then an arena of floating islands. Every hop is a single jump (see tests/reachability).
const F11 = GAME_HEIGHT - 40; // top of the ground
const rawLevel11: LevelData = {
  name: "Level 11: The Phantom Reach",
  musicTheme: 'ethereal',
  playerStart: { x: 60, y: GAME_HEIGHT - 120 },
  platforms: [
    // Ground, broken by three jumpable pits
    { x: 0, y: F11, width: 1500, height: 40 },
    { x: 1720, y: F11, width: 1680, height: 40 },
    { x: 3600, y: F11, width: 2600, height: 40 },
    { x: 6400, y: F11, width: 4100, height: 40 },
    // Act I: a stair up to the high ledge, then a ridge walking back down
    { x: 800, y: F11 - 170, width: 260, height: 30 },
    { x: 1160, y: F11 - 330, width: 240, height: 30 },
    { x: 1500, y: F11 - 490, width: 300, height: 30 },
    { x: 1900, y: F11 - 380, width: 300, height: 30 },
    { x: 2300, y: F11 - 250, width: 260, height: 30 },
    { x: 2700, y: F11 - 370, width: 300, height: 30 },
    { x: 3100, y: F11 - 250, width: 240, height: 30 },
    // Act II: onto the causeway, a long walkway in the air with a gap every few hundred pixels
    { x: 3620, y: F11 - 210, width: 220, height: 30 },
    { x: 3820, y: F11 - 420, width: 640, height: 30 },
    { x: 4640, y: F11 - 420, width: 600, height: 30 },
    { x: 5420, y: F11 - 420, width: 700, height: 30 },
    { x: 6320, y: F11 - 420, width: 600, height: 30 },
    // Act III: the arena of floating islands
    { x: 7300, y: F11 - 200, width: 300, height: 30 },
    { x: 7800, y: F11 - 340, width: 300, height: 30 },
    { x: 8300, y: F11 - 210, width: 300, height: 30 },
    { x: 8800, y: F11 - 350, width: 300, height: 30 },
    { x: 9300, y: F11 - 220, width: 320, height: 30 },
    { x: 9800, y: F11 - 360, width: 300, height: 30 },
    { x: 10200, y: F11 - 240, width: 260, height: 30 },
  ],
  items: [
    { type: 'joystick', x: 1625, y: F11 - 555, width: 50, height: 50 },
    { type: 'shield', x: 2000, y: F11 - 445, width: 50, height: 50 },
    { type: 'floppy', x: 2450, y: F11 - 65, width: 50, height: 50 },
    { type: 'cartridge', x: 2800, y: F11 - 435, width: 50, height: 50 },
    { type: 'speed-boost', x: 3900, y: F11 - 65, width: 50, height: 50 },
    { type: 'joystick', x: 4900, y: F11 - 485, width: 50, height: 50 },
    { type: 'super-throw', x: 5700, y: F11 - 485, width: 50, height: 50 },
    { type: 'floppy', x: 6500, y: F11 - 485, width: 50, height: 50 },
    { type: 'speed-boost', x: 6900, y: F11 - 65, width: 50, height: 50 },
    { type: 'cartridge', x: 7900, y: F11 - 405, width: 50, height: 50 },
    { type: 'floppy', x: 8900, y: F11 - 415, width: 50, height: 50 },
    { type: 'shield', x: 9400, y: F11 - 285, width: 50, height: 50 },
    { type: 'joystick', x: 9900, y: F11 - 425, width: 50, height: 50 },
  ],
  enemies: [
    { type: 'phaser', x: 1000, y: F11 - 400, width: 50, height: 50, originalX: 1000, originalY: F11 - 400 },
    { type: 'flyer', x: 2000, y: F11 - 560, width: 60, height: 44, originalX: 2000, originalY: F11 - 560 },
    { type: 'jumper', x: 2600, y: F11 - 50, width: 50, height: 50, originalX: 2600, originalY: F11 - 50 },
    { type: 'base', x: 3050, y: F11 - 50, width: 50, height: 50, originalX: 3050, originalY: F11 - 50 },
    { type: 'phaser', x: 3700, y: F11 - 300, width: 50, height: 50, originalX: 3700, originalY: F11 - 300 },
    { type: 'base', x: 4300, y: F11 - 50, width: 50, height: 50, originalX: 4300, originalY: F11 - 50 },
    { type: 'bomber', x: 4700, y: F11 - 470, width: 50, height: 50, originalX: 4700, originalY: F11 - 470 },
    { type: 'flyer', x: 5200, y: F11 - 560, width: 60, height: 44, originalX: 5200, originalY: F11 - 560 },
    { type: 'jumper', x: 5600, y: F11 - 50, width: 50, height: 50, originalX: 5600, originalY: F11 - 50 },
    { type: 'flyer', x: 6000, y: F11 - 520, width: 60, height: 44, originalX: 6000, originalY: F11 - 520 },
    { type: 'bomber', x: 6800, y: F11 - 50, width: 50, height: 50, originalX: 6800, originalY: F11 - 50 },
    { type: 'jumper', x: 7000, y: F11 - 50, width: 50, height: 50, originalX: 7000, originalY: F11 - 50 },
    { type: 'phaser', x: 7500, y: F11 - 300, width: 50, height: 50, originalX: 7500, originalY: F11 - 300 },
    { type: 'phaser', x: 8600, y: F11 - 300, width: 50, height: 50, originalX: 8600, originalY: F11 - 300 },
    { type: 'flyer', x: 9100, y: F11 - 540, width: 60, height: 44, originalX: 9100, originalY: F11 - 540 },
    { type: 'bomber', x: 9850, y: F11 - 410, width: 50, height: 50, originalX: 9850, originalY: F11 - 410 },
    { type: 'phaser', x: 10000, y: F11 - 150, width: 50, height: 50, originalX: 10000, originalY: F11 - 150 },
  ],
};

const level11 = buildExponentialExtension(rawLevel11, {
  seed: 1111,
  baseEndX: 10500,
  targetWidth: 92960,
  levelHeight: 2250,
  allowPits: true,
  allowedEnemies: ['jumper', 'flyer', 'bomber', 'phaser'],
  collectibleInterval: 6,
});

// --- LEVEL 12 — BOSS 3: CapocciaNelBuio (Zero-G Arena Expanded +40%: 2688 x 1512 px) ---
const bossLevel3: LevelData = {
  name: "Level 12 — BOSS: CapocciaNelBuio",
  musicTheme: 'boss',
  musicTrack: 'bossShadowHead',
  isZeroG: true,
  levelWidth: 2688,
  levelHeight: 1512,
  playerStart: { x: 1344, y: 1150 },
  platforms: [],
  items: [],
  enemies: [],
  boss: {
    type: 'shadowHead',
    x: 1344 - 160,
    y: 450,
    width: 320,
    height: 320,
    maxHp: BOSS_3_HP,
  },
};

// --- LEVEL 13: The Labyrinth ---
// A real labyrinth built from a seed (see mazeGen.ts): corridors on a grid with dead ends and loops,
// the exit in the farthest cell, every item on the map to collect, and a camera zoomed in on the
// player so the map stays hidden.
const labyrinth = generateMaze({
  seed: 32,
  cols: 36,
  rows: 22,
  pitch: 256,
  wall: 56,
  items: { joystick: 6, floppy: 6, cartridge: 6, 'speed-boost': 2, shield: 2, 'super-throw': 2 },
  enemies: { phaser: 4, flyer: 7, base: 7, jumper: 5, bomber: 4 },
  braid: 0.35,
  straight: 0.55,
  playerSpeed: MAZE_PLAYER_SPEED,
});

const finalLevel: LevelData = {
  name: "Level 13: The Labyrinth",
  musicTheme: 'ethereal',
  isZeroG: true,
  maze: labyrinth.data,
  zoom: MAZE_ZOOM,
  timeLimit: labyrinth.timeLimit,
  levelWidth: labyrinth.levelWidth,
  levelHeight: labyrinth.levelHeight,
  playerStart: labyrinth.playerStart,
  platforms: labyrinth.platforms,
  checkpoints: labyrinth.checkpoints,
  items: labyrinth.items,
  enemies: labyrinth.enemies,
  goal: labyrinth.goal,
};

export const levels: LevelData[] = [
  // World 1
  level1,
  level2,
  level3,
  bossLevel1,
  // World 2
  level5,
  level6,
  level7,
  bossLevel2,
  // World 3
  level9,
  level10,
  level11,
  bossLevel3,
  // The finale
  finalLevel,
];
