import { LevelData, EnemyType, ItemType } from './types';
import { GAME_WIDTH, GAME_HEIGHT, BOSS_INITIAL_HP, BOSS_2_HP, BOSS_3_HP } from './constants';

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
// EXPONENTIAL +40% PROGRESSIVE LEVEL DEFINITIONS (LEVELS 1 TO 12)
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
    { type: 'flyer', x: 900, y: 450, width: 60, height: 44, originalX: 900, originalY: 450 },
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

// --- LEVEL 7 — BOSS 2: LeGallineNellOcchi (Arena Expanded +40%: 2688 x 1250 px) ---
const bossLevel2: LevelData = {
  name: "Level 7 — BOSS: LeGallineNellOcchi",
  musicTheme: 'boss',
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

// --- LEVEL 8: The Gauntlet (4500 * 1.4^6 = 33,880 px) ---
const rawLevel8: LevelData = {
  name: "Level 8: The Gauntlet",
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

const level8 = buildExponentialExtension(rawLevel8, {
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

// --- LEVEL 11 — BOSS 3: CapocciaNelBuio (Zero-G Arena Expanded +40%: 2688 x 1512 px) ---
const bossLevel3: LevelData = {
  name: "Level 11 — BOSS: CapocciaNelBuio",
  musicTheme: 'boss',
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

// --- LEVEL 12: The Labyrinth (ZERO-G MAZE — EXPANDED EXPONENTIALLY TO 14,000 x 8,400 px) ---
const MAZE_WIDTH = 14000;
const MAZE_HEIGHT = 8400;

const finalLevel: LevelData = {
  name: "Level 12: The Labyrinth",
  musicTheme: 'ethereal',
  isZeroG: true,
  timeLimit: 600, // 10 Minutes for the expanded 6-sector Mega-Labyrinth
  levelWidth: MAZE_WIDTH,
  levelHeight: MAZE_HEIGHT,
  playerStart: { x: 250, y: 250 },
  platforms: [
    // --- OUTER BOUNDARIES ---
    { x: 0, y: 0, width: MAZE_WIDTH, height: 48 },
    { x: 0, y: MAZE_HEIGHT - 48, width: MAZE_WIDTH, height: 48 },
    { x: 0, y: 0, width: 48, height: MAZE_HEIGHT },
    { x: MAZE_WIDTH - 48, y: 0, width: 48, height: MAZE_HEIGHT },

    // --- SECTOR 1 (Y: 0 -> 1400) ---
    { x: 0, y: 1400, width: 12600, height: 44 }, // Passage on Far Right (12600..14000)
    { x: 2200, y: 0, width: 44, height: 950 },
    { x: 4500, y: 450, width: 44, height: 950 },
    { x: 6800, y: 0, width: 44, height: 900 },
    { x: 9200, y: 400, width: 1600, height: 44 },
    { x: 11400, y: 0, width: 44, height: 900 },

    // --- SECTOR 2 (Y: 1400 -> 2800) ---
    { x: 1400, y: 2800, width: 12600, height: 44 }, // Passage on Far Left (0..1400)
    { x: 11200, y: 1400, width: 44, height: 950 },
    { x: 8600, y: 1850, width: 44, height: 950 },
    { x: 5800, y: 1400, width: 44, height: 950 },
    { x: 3200, y: 1950, width: 1800, height: 44 },

    // --- SECTOR 3 (Y: 2800 -> 4200) ---
    { x: 0, y: 4200, width: 12600, height: 44 }, // Passage on Far Right (12600..14000)
    { x: 2600, y: 2800, width: 44, height: 950 },
    { x: 5400, y: 3250, width: 44, height: 950 },
    { x: 8200, y: 2800, width: 44, height: 900 },
    { x: 10200, y: 3450, width: 1600, height: 44 },

    // --- SECTOR 4 (Y: 4200 -> 5600) ---
    { x: 1400, y: 5600, width: 12600, height: 44 }, // Passage on Far Left (0..1400)
    { x: 11000, y: 4200, width: 44, height: 950 },
    { x: 8000, y: 4650, width: 44, height: 950 },
    { x: 5000, y: 4200, width: 44, height: 950 },
    { x: 2200, y: 4850, width: 1800, height: 44 },

    // --- SECTOR 5 (Y: 5600 -> 7000) ---
    { x: 0, y: 7000, width: 12600, height: 44 }, // Passage on Far Right (12600..14000)
    { x: 3000, y: 5600, width: 44, height: 950 },
    { x: 6400, y: 6050, width: 44, height: 950 },
    { x: 9600, y: 5600, width: 44, height: 950 },

    // --- SECTOR 6: THE CORE SANCTUARY (Y: 7000 -> 8400) ---
    { x: 10800, y: 7000, width: 44, height: 900 },
    { x: 7600, y: 7500, width: 44, height: 900 },
    { x: 4400, y: 7000, width: 44, height: 900 },
    { x: 1800, y: 7500, width: 44, height: 900 },
    // Goal Portal Alcove
    { x: 0, y: 7600, width: 700, height: 44 },
  ],
  checkpoints: [
    { x: 13200, y: 1250, width: 48, height: 96 },
    { x: 700, y: 2650, width: 48, height: 96 },
    { x: 13200, y: 4050, width: 48, height: 96 },
    { x: 700, y: 5450, width: 48, height: 96 },
    { x: 13200, y: 6850, width: 48, height: 96 },
  ],
  items: [
    // Sector 1
    { type: 'speed-boost', x: 900, y: 400, width: 55, height: 55 },
    { type: 'joystick', x: 3200, y: 700, width: 55, height: 55 },
    { type: 'floppy', x: 7800, y: 500, width: 55, height: 55 },
    { type: 'shield', x: 12200, y: 650, width: 55, height: 55 },
    // Sector 2
    { type: 'speed-boost', x: 12800, y: 2000, width: 55, height: 55 },
    { type: 'cartridge', x: 9800, y: 2100, width: 55, height: 55 },
    { type: 'super-throw', x: 6400, y: 2300, width: 55, height: 55 },
    { type: 'joystick', x: 1800, y: 2100, width: 55, height: 55 },
    // Sector 3
    { type: 'speed-boost', x: 1200, y: 3400, width: 55, height: 55 },
    { type: 'floppy', x: 4000, y: 3500, width: 55, height: 55 },
    { type: 'shield', x: 7200, y: 3600, width: 55, height: 55 },
    { type: 'cartridge', x: 11600, y: 3300, width: 55, height: 55 },
    // Sector 4
    { type: 'speed-boost', x: 12500, y: 4900, width: 55, height: 55 },
    { type: 'joystick', x: 9400, y: 4800, width: 55, height: 55 },
    { type: 'floppy', x: 3400, y: 4500, width: 55, height: 55 },
    // Sector 5
    { type: 'speed-boost', x: 1400, y: 6200, width: 55, height: 55 },
    { type: 'shield', x: 5000, y: 6300, width: 55, height: 55 },
    { type: 'cartridge', x: 11200, y: 6300, width: 55, height: 55 },
    // Sector 6
    { type: 'speed-boost', x: 12200, y: 7700, width: 55, height: 55 },
    { type: 'super-throw', x: 8800, y: 7700, width: 55, height: 55 },
    { type: 'joystick', x: 2800, y: 7800, width: 55, height: 55 },
  ],
  enemies: [
    // Sector 1
    { type: 'phaser', x: 1800, y: 600, width: 54, height: 54, originalX: 1800, originalY: 600 },
    { type: 'flyer', x: 5600, y: 500, width: 64, height: 46, originalX: 5600, originalY: 500 },
    { type: 'bomber', x: 10000, y: 340, width: 54, height: 54, originalX: 10000, originalY: 340 },
    // Sector 2
    { type: 'phaser', x: 10200, y: 2100, width: 54, height: 54, originalX: 10200, originalY: 2100 },
    { type: 'flyer', x: 7200, y: 2000, width: 64, height: 46, originalX: 7200, originalY: 2000 },
    { type: 'bomber', x: 3800, y: 1890, width: 54, height: 54, originalX: 3800, originalY: 1890 },
    // Sector 3
    { type: 'phaser', x: 3800, y: 3500, width: 54, height: 54, originalX: 3800, originalY: 3500 },
    { type: 'flyer', x: 6800, y: 3400, width: 64, height: 46, originalX: 6800, originalY: 3400 },
    { type: 'phaser', x: 11800, y: 3600, width: 54, height: 54, originalX: 11800, originalY: 3600 },
    // Sector 4
    { type: 'flyer', x: 9600, y: 4900, width: 64, height: 46, originalX: 9600, originalY: 4900 },
    { type: 'phaser', x: 6400, y: 4900, width: 54, height: 54, originalX: 6400, originalY: 4900 },
    { type: 'bomber', x: 2800, y: 4790, width: 54, height: 54, originalX: 2800, originalY: 4790 },
    // Sector 5
    { type: 'phaser', x: 4600, y: 6300, width: 54, height: 54, originalX: 4600, originalY: 6300 },
    { type: 'flyer', x: 8200, y: 6200, width: 64, height: 46, originalX: 8200, originalY: 6200 },
    { type: 'phaser', x: 11600, y: 6400, width: 54, height: 54, originalX: 11600, originalY: 6400 },
    // Sector 6
    { type: 'phaser', x: 9200, y: 7800, width: 54, height: 54, originalX: 9200, originalY: 7800 },
    { type: 'flyer', x: 6000, y: 7700, width: 64, height: 46, originalX: 6000, originalY: 7700 },
    { type: 'phaser', x: 2600, y: 7800, width: 54, height: 54, originalX: 2600, originalY: 7800 },
    { type: 'bomber', x: 500, y: 7540, width: 54, height: 54, originalX: 500, originalY: 7540 },
  ],
  goal: { x: 220, y: 8050, width: GOAL_WIDTH, height: GOAL_HEIGHT },
};

export const levels: LevelData[] = [
  level1,
  level2,
  level3,
  bossLevel1,
  level5,
  level6,
  bossLevel2,
  level8,
  level9,
  level10,
  bossLevel3,
  finalLevel,
];
