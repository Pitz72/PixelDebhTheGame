
import { LevelData } from './types';
import { GAME_WIDTH, GAME_HEIGHT, BOSS_INITIAL_HP, BOSS_2_HP, BOSS_3_HP } from './constants';

const GOAL_WIDTH = 90;
const GOAL_HEIGHT = 150;

// --- LEVEL 1: Neon Outskirts ---
const level1: LevelData = {
    name: "Level 1: Neon Outskirts",
    musicTheme: 'adventure',
    playerStart: { x: 100, y: GAME_HEIGHT - 120 },
    platforms: [
        { x: 0, y: GAME_HEIGHT - 40, width: 4500, height: 40 }, // Floor
        { x: 300, y: GAME_HEIGHT - 200, width: 200, height: 30 },
        { x: 600, y: GAME_HEIGHT - 350, width: 200, height: 30 },
        { x: 900, y: GAME_HEIGHT - 500, width: 400, height: 30 }, // Upper path
        { x: 900, y: GAME_HEIGHT - 200, width: 400, height: 30 }, // Lower path
        { x: 1400, y: GAME_HEIGHT - 350, width: 300, height: 30 },
        { x: 1800, y: GAME_HEIGHT - 250, width: 300, height: 30 },
        { x: 1800, y: GAME_HEIGHT - 650, width: 300, height: 30 }, // High platform
        { x: 2200, y: GAME_HEIGHT - 450, width: 600, height: 30 },
        { x: 2900, y: GAME_HEIGHT - 300, width: 200, height: 30 },
        { x: 3200, y: GAME_HEIGHT - 450, width: 200, height: 30 },
        { x: 3500, y: GAME_HEIGHT - 600, width: 400, height: 30 },
        { x: 4000, y: GAME_HEIGHT - 200, width: 400, height: 30 },
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
        { type: 'base', x: 400, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 400, originalY: GAME_HEIGHT - 80 },
        { type: 'base', x: 1000, y: GAME_HEIGHT - 570, width: 50, height: 50, originalX: 1000, originalY: GAME_HEIGHT - 570 },
        { type: 'base', x: 1000, y: GAME_HEIGHT - 270, width: 50, height: 50, originalX: 1000, originalY: GAME_HEIGHT - 270 },
        { type: 'base', x: 2300, y: GAME_HEIGHT - 520, width: 50, height: 50, originalX: 2300, originalY: GAME_HEIGHT - 520 },
        { type: 'base', x: 2600, y: GAME_HEIGHT - 520, width: 50, height: 50, originalX: 2600, originalY: GAME_HEIGHT - 520 },
        { type: 'base', x: 3300, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 3300, originalY: GAME_HEIGHT - 80 },
        { type: 'base', x: 3700, y: GAME_HEIGHT - 650, width: 50, height: 50, originalX: 3700, originalY: GAME_HEIGHT - 650 },
    ],
    goal: { x: 4350, y: GAME_HEIGHT - 40 - GOAL_HEIGHT, width: GOAL_WIDTH, height: GOAL_HEIGHT },
};

// --- LEVEL 2: Circuit City ---
const level2: LevelData = {
    name: "Level 2: Circuit City",
    musicTheme: 'adventure',
    playerStart: { x: 100, y: GAME_HEIGHT - 120 },
    platforms: [
        { x: 0, y: GAME_HEIGHT - 40, width: 4800, height: 40 },
        { x: 400, y: GAME_HEIGHT - 200, width: 200, height: 30 },
        { x: 700, y: GAME_HEIGHT - 350, width: 200, height: 30 },
        { x: 1000, y: GAME_HEIGHT - 500, width: 300, height: 30 },
        { x: 1400, y: GAME_HEIGHT - 650, width: 200, height: 30 },
        { x: 1700, y: GAME_HEIGHT - 400, width: 200, height: 30 },
        { x: 2000, y: GAME_HEIGHT - 250, width: 200, height: 30 },
        { x: 2300, y: GAME_HEIGHT - 400, width: 800, height: 30 },
        { x: 2500, y: GAME_HEIGHT - 700, width: 400, height: 30 },
        { x: 3200, y: GAME_HEIGHT - 250, width: 300, height: 30 },
        { x: 3600, y: GAME_HEIGHT - 450, width: 300, height: 30 },
        { x: 4000, y: GAME_HEIGHT - 650, width: 300, height: 30 },
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
        { type: 'base', x: 750, y: GAME_HEIGHT - 420, width: 50, height: 50, originalX: 750, originalY: GAME_HEIGHT - 420 },
        { type: 'base', x: 1100, y: GAME_HEIGHT - 570, width: 50, height: 50, originalX: 1100, originalY: GAME_HEIGHT - 570 },
        { type: 'base', x: 2500, y: GAME_HEIGHT - 470, width: 50, height: 50, originalX: 2500, originalY: GAME_HEIGHT - 470 },
        { type: 'base', x: 2800, y: GAME_HEIGHT - 470, width: 50, height: 50, originalX: 2800, originalY: GAME_HEIGHT - 470 },
        { type: 'base', x: 2700, y: GAME_HEIGHT - 770, width: 50, height: 50, originalX: 2700, originalY: GAME_HEIGHT - 770 },
        { type: 'base', x: 3700, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 3700, originalY: GAME_HEIGHT - 80 },
        { type: 'base', x: 4100, y: GAME_HEIGHT - 720, width: 50, height: 50, originalX: 4100, originalY: GAME_HEIGHT - 720 },
    ],
    goal: { x: 4600, y: GAME_HEIGHT - 40 - GOAL_HEIGHT, width: GOAL_WIDTH, height: GOAL_HEIGHT },
};

// --- LEVEL 3: Hoppy Hills ---
const level3: LevelData = {
    name: "Level 3: Hoppy Hills",
    musicTheme: 'adventure',
    playerStart: { x: 100, y: GAME_HEIGHT - 120 },
    platforms: [
        { x: 0, y: GAME_HEIGHT - 40, width: 500, height: 40 },
        { x: 650, y: GAME_HEIGHT - 250, width: 600, height: 30 },
        { x: 1400, y: GAME_HEIGHT - 40, width: 800, height: 40 },
        { x: 200, y: GAME_HEIGHT - 500, width: 300, height: 30 },
        { x: 700, y: GAME_HEIGHT - 700, width: 500, height: 30 },
        { x: 2300, y: GAME_HEIGHT - 200, width: 400, height: 30 },
        { x: 2900, y: GAME_HEIGHT - 400, width: 300, height: 30 },
        { x: 2400, y: GAME_HEIGHT - 600, width: 400, height: 30 },
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
        { type: 'jumper', x: 700, y: GAME_HEIGHT - 290, width: 50, height: 50, originalX: 700, originalY: GAME_HEIGHT - 290 },
        { type: 'base', x: 1500, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 1500, originalY: GAME_HEIGHT - 80 },
        { type: 'base', x: 300, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 300, originalY: GAME_HEIGHT - 80 },
        { type: 'jumper', x: 1800, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 1800, originalY: GAME_HEIGHT - 80 },
        { type: 'base', x: 2500, y: GAME_HEIGHT - 240, width: 50, height: 50, originalX: 2500, originalY: GAME_HEIGHT - 240 },
        { type: 'jumper', x: 3400, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 3400, originalY: GAME_HEIGHT - 80 },
        { type: 'base', x: 4000, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 4000, originalY: GAME_HEIGHT - 80 },
    ],
    goal: { x: 4400, y: GAME_HEIGHT - 40 - GOAL_HEIGHT, width: GOAL_WIDTH, height: GOAL_HEIGHT },
};

// --- BOSS 1 ---
const bossLevel1: LevelData = {
    name: "BOSS: Cyclops Frog",
    musicTheme: 'boss',
    playerStart: { x: 100, y: GAME_HEIGHT - 120 },
    platforms: [
      { x: 0, y: GAME_HEIGHT - 40, width: GAME_WIDTH, height: 40 },
    ],
    items: [],
    enemies: [],
    boss: {
      type: 'frog',
      x: (GAME_WIDTH / 2) - 160,
      y: GAME_HEIGHT / 2 - 200, 
      width: 320,
      height: 320,
      maxHp: BOSS_INITIAL_HP, 
    },
};

// --- LEVEL 5: Vertical Ventures ---
const level5: LevelData = {
    name: "Level 5: Vertical Ventures",
    musicTheme: 'industrial',
    playerStart: { x: 80, y: GAME_HEIGHT - 120 },
    platforms: [
        { x: 0, y: GAME_HEIGHT - 40, width: 400, height: 40 },
        { x: 550, y: GAME_HEIGHT - 200, width: 150, height: 30 },
        { x: 250, y: GAME_HEIGHT - 350, width: 150, height: 30 },
        { x: 550, y: GAME_HEIGHT - 500, width: 150, height: 30 },
        { x: 850, y: GAME_HEIGHT - 650, width: 250, height: 30 },
        { x: 1200, y: GAME_HEIGHT - 800, width: 400, height: 30 },
        { x: 1700, y: GAME_HEIGHT - 950, width: 220, height: 30 },
        { x: 2200, y: GAME_HEIGHT - 800, width: 300, height: 30 },
        { x: 2600, y: GAME_HEIGHT - 650, width: 150, height: 30 },
        { x: 2300, y: GAME_HEIGHT - 500, width: 150, height: 30 },
        { x: 2600, y: GAME_HEIGHT - 350, width: 400, height: 30 },
        { x: 3200, y: GAME_HEIGHT - 200, width: 400, height: 30 },
        { x: 3800, y: GAME_HEIGHT - 40, width: 1400, height: 40 },
    ],
    items: [
        { type: 'super-throw', x: 600, y: GAME_HEIGHT - 270, width: 50, height: 50 },
        { type: 'floppy', x: 900, y: GAME_HEIGHT - 720, width: 50, height: 50 },
        { type: 'cartridge', x: 1800, y: GAME_HEIGHT - 1020, width: 50, height: 50 },
        { type: 'shield', x: 2700, y: GAME_HEIGHT - 420, width: 50, height: 50 },
        { type: 'joystick', x: 300, y: GAME_HEIGHT - 420, width: 50, height: 50 },
        { type: 'cartridge', x: 1300, y: GAME_HEIGHT - 870, width: 50, height: 50 },
        { type: 'floppy', x: 2400, y: GAME_HEIGHT - 570, width: 50, height: 50 },
        { type: 'joystick', x: 3400, y: GAME_HEIGHT - 270, width: 50, height: 50 },
    ],
    enemies: [
        { type: 'base', x: 150, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 150, originalY: GAME_HEIGHT - 80 },
        { type: 'jumper', x: 900, y: GAME_HEIGHT - 690, width: 50, height: 50, originalX: 900, originalY: GAME_HEIGHT - 690 },
        { type: 'jumper', x: 1300, y: GAME_HEIGHT - 840, width: 50, height: 50, originalX: 1300, originalY: GAME_HEIGHT - 840 },
        { type: 'base', x: 2750, y: GAME_HEIGHT - 390, width: 50, height: 50, originalX: 2750, originalY: GAME_HEIGHT - 390 },
        { type: 'jumper', x: 4000, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 4000, originalY: GAME_HEIGHT - 80 },
        { type: 'base', x: 4500, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 4500, originalY: GAME_HEIGHT - 80 },
    ],
    goal: { x: 5100, y: GAME_HEIGHT - 40 - GOAL_HEIGHT, width: GOAL_WIDTH, height: GOAL_HEIGHT },
};

// --- LEVEL 6: Flappy Skies ---
const level6: LevelData = {
    name: "Level 6: Flappy Skies",
    musicTheme: 'industrial',
    playerStart: { x: 100, y: GAME_HEIGHT - 120 },
    platforms: [
        { x: 0, y: GAME_HEIGHT - 40, width: 1000, height: 40 },
        { x: 1150, y: GAME_HEIGHT - 40, width: 800, height: 40 },
        { x: 2100, y: GAME_HEIGHT - 40, width: 3900, height: 40 },
        { x: 500, y: GAME_HEIGHT - 250, width: 900, height: 30 },
        { x: 1600, y: GAME_HEIGHT - 450, width: 300, height: 30 },
        { x: 100, y: GAME_HEIGHT - 500, width: 200, height: 30 },
        { x: 500, y: GAME_HEIGHT - 650, width: 900, height: 30 },
        { x: 2300, y: GAME_HEIGHT - 200, width: 400, height: 30 },
        { x: 2900, y: GAME_HEIGHT - 350, width: 150, height: 30 },
        { x: 3300, y: GAME_HEIGHT - 500, width: 800, height: 30 },
        { x: 4500, y: GAME_HEIGHT - 250, width: 500, height: 30 },
        { x: 5200, y: GAME_HEIGHT - 600, width: 400, height: 30 },
    ],
    items: [
        { type: 'shield', x: 150, y: GAME_HEIGHT - 570, width: 50, height: 50 },
        { type: 'floppy', x: 950, y: GAME_HEIGHT - 720, width: 50, height: 50 },
        { type: 'cartridge', x: 3500, y: GAME_HEIGHT - 570, width: 50, height: 50 },
        { type: 'speed-boost', x: 4600, y: GAME_HEIGHT - 320, width: 50, height: 50 },
        { type: 'joystick', x: 600, y: GAME_HEIGHT - 320, width: 50, height: 50 },
        { type: 'cartridge', x: 1700, y: GAME_HEIGHT - 520, width: 50, height: 50 },
        { type: 'floppy', x: 2500, y: GAME_HEIGHT - 270, width: 50, height: 50 },
        { type: 'joystick', x: 5300, y: GAME_HEIGHT - 670, width: 50, height: 50 },
    ],
    enemies: [
        { type: 'flyer', x: 900, y: 450, width: 60, height: 40, originalX: 900, originalY: 450 },
        { type: 'jumper', x: 400, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 400, originalY: GAME_HEIGHT - 80 },
        { type: 'base', x: 1500, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 1500, originalY: GAME_HEIGHT - 80 },
        { type: 'flyer', x: 2600, y: 200, width: 60, height: 40, originalX: 2600, originalY: 200 },
        { type: 'jumper', x: 3000, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 3000, originalY: GAME_HEIGHT - 80 },
        { type: 'base', x: 3800, y: GAME_HEIGHT - 540, width: 50, height: 50, originalX: 3800, originalY: GAME_HEIGHT - 540 },
        { type: 'flyer', x: 4800, y: 300, width: 60, height: 40, originalX: 4800, originalY: 300 },
        { type: 'base', x: 5500, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 5500, originalY: GAME_HEIGHT - 80 },
    ],
    goal: { x: 5900, y: GAME_HEIGHT - 40 - GOAL_HEIGHT, width: GOAL_WIDTH, height: GOAL_HEIGHT },
};

// --- BOSS 2: LeGallineNellOcchi ---
const bossLevel2: LevelData = {
    name: "BOSS: LeGallineNellOcchi",
    musicTheme: 'boss',
    playerStart: { x: 100, y: GAME_HEIGHT - 120 },
    platforms: [
      { x: 0, y: GAME_HEIGHT - 40, width: GAME_WIDTH, height: 40 },
    ],
    items: [],
    enemies: [],
    boss: {
      type: 'chickenEye',
      x: (GAME_WIDTH / 2) - 150,
      y: GAME_HEIGHT / 2 - 200, 
      width: 300,
      height: 300,
      maxHp: BOSS_2_HP,
    },
};

// --- LEVEL 7: The Gauntlet (REWORKED) ---
const level7: LevelData = {
    name: "Level 7: The Gauntlet",
    musicTheme: 'industrial',
    playerStart: { x: 50, y: GAME_HEIGHT - 120 },
    platforms: [
        { x: 0, y: GAME_HEIGHT - 40, width: 1000, height: 40 },
        { x: 1200, y: GAME_HEIGHT - 40, width: 1000, height: 40 }, // Pit 1
        { x: 2400, y: GAME_HEIGHT - 40, width: 1500, height: 40 }, // Pit 2
        { x: 4100, y: GAME_HEIGHT - 40, width: 1000, height: 40 }, // Pit 3
        { x: 5300, y: GAME_HEIGHT - 40, width: 2200, height: 40 }, // Final run
        { x: 1000, y: GAME_HEIGHT - 250, width: 200, height: 30 },
        { x: 1400, y: GAME_HEIGHT - 450, width: 400, height: 30 },
        { x: 2000, y: GAME_HEIGHT - 600, width: 300, height: 30 },
        { x: 2500, y: GAME_HEIGHT - 400, width: 400, height: 30 },
        { x: 3000, y: GAME_HEIGHT - 250, width: 200, height: 30 },
        { x: 3300, y: GAME_HEIGHT - 250, width: 200, height: 30 },
        { x: 3600, y: GAME_HEIGHT - 250, width: 200, height: 30 },
        { x: 4000, y: GAME_HEIGHT - 600, width: 800, height: 30 },
        { x: 5000, y: GAME_HEIGHT - 400, width: 200, height: 30 },
        { x: 5400, y: GAME_HEIGHT - 250, width: 200, height: 30 },
        { x: 6000, y: GAME_HEIGHT - 200, width: 200, height: 30 },
        { x: 6300, y: GAME_HEIGHT - 350, width: 200, height: 30 },
        { x: 6600, y: GAME_HEIGHT - 500, width: 400, height: 30 },
    ],
    items: [
        { type: 'shield', x: 1500, y: GAME_HEIGHT - 500, width: 50, height: 50 },
        { type: 'joystick', x: 2200, y: GAME_HEIGHT - 650, width: 50, height: 50 },
        { type: 'floppy', x: 3100, y: GAME_HEIGHT - 300, width: 50, height: 50 },
        { type: 'cartridge', x: 3700, y: GAME_HEIGHT - 300, width: 50, height: 50 },
        { type: 'super-throw', x: 4400, y: GAME_HEIGHT - 650, width: 50, height: 50 },
        { type: 'speed-boost', x: 5400, y: GAME_HEIGHT - 300, width: 50, height: 50 },
        { type: 'joystick', x: 6700, y: GAME_HEIGHT - 550, width: 50, height: 50 },
        { type: 'shield', x: 7000, y: GAME_HEIGHT - 100, width: 50, height: 50 },
    ],
    enemies: [
        { type: 'jumper', x: 500, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 500, originalY: GAME_HEIGHT - 80 },
        { type: 'flyer', x: 1400, y: GAME_HEIGHT - 500, width: 60, height: 40, originalX: 1400, originalY: GAME_HEIGHT - 500 },
        { type: 'bomber', x: 1700, y: GAME_HEIGHT - 490, width: 50, height: 50, originalX: 1700, originalY: GAME_HEIGHT - 490 },
        { type: 'phaser', x: 2800, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 2800, originalY: GAME_HEIGHT - 80 },
        { type: 'bomber', x: 3400, y: GAME_HEIGHT - 290, width: 50, height: 50, originalX: 3400, originalY: GAME_HEIGHT - 290 },
        { type: 'flyer', x: 4000, y: GAME_HEIGHT - 700, width: 60, height: 40, originalX: 4000, originalY: GAME_HEIGHT - 700 },
        { type: 'base', x: 5500, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 5500, originalY: GAME_HEIGHT - 80 },
        { type: 'jumper', x: 5800, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 5800, originalY: GAME_HEIGHT - 80 },
        { type: 'bomber', x: 6800, y: GAME_HEIGHT - 540, width: 50, height: 50, originalX: 6800, originalY: GAME_HEIGHT - 540 },
        { type: 'phaser', x: 7000, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 7000, originalY: GAME_HEIGHT - 80 },
    ],
    goal: { x: 7400, y: GAME_HEIGHT - 40 - GOAL_HEIGHT, width: GOAL_WIDTH, height: GOAL_HEIGHT },
};

// --- LEVEL 8: The Ascent (REWORKED 2.0) ---
const level8: LevelData = {
    name: "Level 8: The Ascent",
    musicTheme: 'ethereal',
    playerStart: { x: 50, y: GAME_HEIGHT - 120 },
    platforms: [
        { x: 0, y: GAME_HEIGHT - 40, width: 600, height: 40 },
        { x: 650, y: GAME_HEIGHT - 200, width: 200, height: 30 },
        { x: 900, y: GAME_HEIGHT - 350, width: 200, height: 30 },
        { x: 1150, y: GAME_HEIGHT - 500, width: 200, height: 30 },
        { x: 1400, y: GAME_HEIGHT - 650, width: 300, height: 30 },
        { x: 1800, y: GAME_HEIGHT - 650, width: 1000, height: 30 },
        { x: 2900, y: GAME_HEIGHT - 500, width: 200, height: 30 },
        { x: 3200, y: GAME_HEIGHT - 350, width: 200, height: 30 },
        { x: 3500, y: GAME_HEIGHT - 40, width: 800, height: 40 },
        { x: 4400, y: GAME_HEIGHT - 200, width: 250, height: 30 },
        { x: 4800, y: GAME_HEIGHT - 350, width: 250, height: 30 },
        { x: 5200, y: GAME_HEIGHT - 500, width: 250, height: 30 },
        { x: 5600, y: GAME_HEIGHT - 650, width: 1000, height: 30 },
        { x: 6800, y: GAME_HEIGHT - 500, width: 400, height: 30 },
        { x: 7400, y: GAME_HEIGHT - 350, width: 400, height: 30 },
        { x: 8000, y: GAME_HEIGHT - 200, width: 400, height: 30 },
        { x: 8500, y: GAME_HEIGHT - 40, width: 1000, height: 40 },
    ],
    items: [
        { type: 'joystick', x: 1450, y: GAME_HEIGHT - 720, width: 50, height: 50 },
        { type: 'shield', x: 2000, y: GAME_HEIGHT - 720, width: 50, height: 50 },
        { type: 'floppy', x: 3800, y: GAME_HEIGHT - 100, width: 50, height: 50 },
        { type: 'speed-boost', x: 5300, y: GAME_HEIGHT - 550, width: 50, height: 50 },
        { type: 'cartridge', x: 6200, y: GAME_HEIGHT - 720, width: 50, height: 50 },
        { type: 'super-throw', x: 7500, y: GAME_HEIGHT - 400, width: 50, height: 50 },
    ],
    enemies: [
        { type: 'phaser', x: 1000, y: GAME_HEIGHT - 400, width: 50, height: 50, originalX: 1000, originalY: GAME_HEIGHT - 400 },
        { type: 'flyer', x: 2200, y: GAME_HEIGHT - 800, width: 60, height: 40, originalX: 2200, originalY: GAME_HEIGHT - 800 },
        { type: 'bomber', x: 3900, y: GAME_HEIGHT - 90, width: 50, height: 50, originalX: 3900, originalY: GAME_HEIGHT - 90 },
        { type: 'jumper', x: 4800, y: GAME_HEIGHT - 390, width: 50, height: 50, originalX: 4800, originalY: GAME_HEIGHT - 390 },
        { type: 'flyer', x: 5600, y: GAME_HEIGHT - 750, width: 60, height: 40, originalX: 5600, originalY: GAME_HEIGHT - 750 },
        { type: 'phaser', x: 6000, y: GAME_HEIGHT - 700, width: 50, height: 50, originalX: 6000, originalY: GAME_HEIGHT - 700 },
        { type: 'bomber', x: 8700, y: GAME_HEIGHT - 90, width: 50, height: 50, originalX: 8700, originalY: GAME_HEIGHT - 90 },
    ],
    goal: { x: 9200, y: GAME_HEIGHT - 40 - GOAL_HEIGHT, width: GOAL_WIDTH, height: GOAL_HEIGHT },
};

// --- LEVEL 9: The Drop (REDESIGNED SKYWAY) ---
const level9: LevelData = {
    name: "Level 9: The Drop",
    musicTheme: 'ethereal',
    playerStart: { x: 100, y: 100 },
    platforms: [
        { x: 0, y: 200, width: 400, height: 30 },
        { x: 600, y: 350, width: 500, height: 30 },
        { x: 1300, y: 500, width: 300, height: 30 },
        { x: 1800, y: 650, width: 800, height: 30 },
        { x: 2800, y: 500, width: 200, height: 30 },
        { x: 3200, y: 350, width: 400, height: 30 },
        // Broken Skyway Section (Replaces single 7200px platform)
        { x: 3800, y: 200, width: 400, height: 30 }, // 1
        { x: 4350, y: 200, width: 300, height: 30 }, // 2 (Gap 150)
        { x: 4800, y: 250, width: 400, height: 30 }, // 3
        { x: 5400, y: 200, width: 200, height: 30 }, // 4 (High jump)
        { x: 5800, y: 300, width: 500, height: 30 }, // 5
        { x: 6500, y: 200, width: 400, height: 30 }, // 6
        { x: 7100, y: 400, width: 300, height: 30 }, // 7 (Low)
        { x: 7500, y: 200, width: 600, height: 30 }, // 8
        { x: 8300, y: 250, width: 300, height: 30 }, // 9
        { x: 8800, y: 200, width: 400, height: 30 }, // 10
        { x: 9400, y: 300, width: 400, height: 30 }, // 11
        { x: 10000, y: 400, width: 800, height: 30 }, // 12 Final landing

        { x: 0, y: GAME_HEIGHT - 40, width: 11000, height: 40 }, // Floor
    ],
    items: [
        { type: 'shield', x: 1400, y: 430, width: 50, height: 50 },
        { type: 'joystick', x: 2200, y: 580, width: 50, height: 50 },
        { type: 'cartridge', x: 4450, y: 150, width: 50, height: 50 }, // On Skyway
        { type: 'floppy', x: 500, y: 150, width: 50, height: 50 },
        { type: 'cartridge', x: 2850, y: 430, width: 50, height: 50 },
        { type: 'joystick', x: 3300, y: 280, width: 50, height: 50 },
        { type: 'super-throw', x: 6700, y: 150, width: 50, height: 50 }, // On Skyway
        { type: 'shield', x: 8400, y: 200, width: 50, height: 50 }, // On Skyway
    ],
    enemies: [
        { type: 'flyer', x: 800, y: 200, width: 60, height: 40, originalX: 800, originalY: 200 },
        { type: 'bomber', x: 2000, y: 580, width: 50, height: 50, originalX: 2000, originalY: 580 },
        // Skyway Enemies
        { type: 'jumper', x: 4900, y: 170, width: 50, height: 50, originalX: 4900, originalY: 170 },
        { type: 'flyer', x: 6000, y: 200, width: 60, height: 40, originalX: 6000, originalY: 200 },
        { type: 'jumper', x: 7700, y: 120, width: 50, height: 50, originalX: 7700, originalY: 120 },
        { type: 'phaser', x: 9000, y: 150, width: 50, height: 50, originalX: 9000, originalY: 150 },

        { type: 'phaser', x: 5000, y: 100, width: 50, height: 50, originalX: 5000, originalY: 100 },
        { type: 'jumper', x: 7000, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 7000, originalY: GAME_HEIGHT - 80 },
        { type: 'phaser', x: 9000, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 9000, originalY: GAME_HEIGHT - 80 },
    ],
    goal: { x: 10900, y: GAME_HEIGHT - 40 - GOAL_HEIGHT, width: GOAL_WIDTH, height: GOAL_HEIGHT },
};

// --- BOSS 3: CapocciaNelBuio ---
const bossLevel3: LevelData = {
    name: "BOSS: CapocciaNelBuio",
    musicTheme: 'boss',
    playerStart: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 200 },
    platforms: [], // NO PLATFORMS - ZERO G
    items: [],
    enemies: [],
    boss: {
      type: 'shadowHead',
      x: (GAME_WIDTH / 2) - 150,
      y: GAME_HEIGHT / 2 - 200, 
      width: 300,
      height: 300,
      maxHp: BOSS_3_HP,
    },
};

// --- FINAL LEVEL: The Labyrinth (ZERO G MAZE - EXPANDED 5000x4000) ---
const MAZE_WIDTH = 5000;
const MAZE_HEIGHT = 4000;

const finalLevel: LevelData = {
    name: "The Labyrinth",
    musicTheme: 'ethereal',
    isZeroG: true, // Enable Zero-G Movement
    timeLimit: 300, // 5 Minutes
    playerStart: { x: 100, y: 100 },
    platforms: [
        // --- BOUNDARIES ---
        { x: 0, y: 0, width: MAZE_WIDTH, height: 40 }, // Top
        { x: 0, y: MAZE_HEIGHT - 40, width: MAZE_WIDTH, height: 40 }, // Bottom
        { x: 0, y: 0, width: 40, height: MAZE_HEIGHT }, // Left
        { x: MAZE_WIDTH - 40, y: 0, width: 40, height: MAZE_HEIGHT }, // Right

        // --- ZONE 1: The Entrance (Top Left) 0-1000Y ---
        // Divider 1 at Y=1000
        { x: 0, y: 1000, width: 4500, height: 40 }, // Gap at far right
        // Obstacles inside Zone 1
        { x: 800, y: 0, width: 40, height: 700 },
        { x: 1600, y: 300, width: 40, height: 700 },
        { x: 2400, y: 0, width: 40, height: 600 },
        { x: 3500, y: 200, width: 600, height: 40 },

        // --- ZONE 2: The Middle Path (1000-2000Y) ---
        // Divider 2 at Y=2000
        { x: 500, y: 2000, width: 4500, height: 40 }, // Gap at far left
        // Obstacles
        { x: 4000, y: 1000, width: 40, height: 800 },
        { x: 3000, y: 1200, width: 40, height: 800 },
        { x: 1500, y: 1000, width: 40, height: 600 },
        { x: 500, y: 1500, width: 1000, height: 40 },

        // --- ZONE 3: The Depths (2000-3000Y) ---
        // Divider 3 at Y=3000
        { x: 0, y: 3000, width: 4500, height: 40 }, // Gap at far right
        // Obstacles
        { x: 1000, y: 2000, width: 40, height: 700 },
        { x: 2000, y: 2300, width: 40, height: 700 },
        { x: 3000, y: 2000, width: 40, height: 500 },
        { x: 3500, y: 2500, width: 800, height: 40 },

        // --- ZONE 4: The Exit Run (3000-4000Y) ---
        // Long corridors
        { x: 4000, y: 3000, width: 40, height: 600 },
        { x: 3000, y: 3400, width: 40, height: 600 },
        { x: 2000, y: 3000, width: 40, height: 600 },
        { x: 1000, y: 3400, width: 40, height: 600 },
        // Goal Enclosure
        { x: 0, y: 3500, width: 400, height: 40 },
    ],
    items: [
        // Zone 1 Items
        { type: 'joystick', x: 400, y: 800, width: 50, height: 50 },
        { type: 'floppy', x: 2000, y: 200, width: 50, height: 50 },
        { type: 'shield', x: 4000, y: 500, width: 50, height: 50 },
        
        // Zone 2 Items
        { type: 'cartridge', x: 4200, y: 1500, width: 50, height: 50 },
        { type: 'super-throw', x: 2200, y: 1800, width: 50, height: 50 },
        { type: 'joystick', x: 200, y: 1200, width: 50, height: 50 },

        // Zone 3 Items
        { type: 'speed-boost', x: 500, y: 2500, width: 50, height: 50 },
        { type: 'floppy', x: 3200, y: 2800, width: 50, height: 50 },
        { type: 'cartridge', x: 4800, y: 2100, width: 50, height: 50 },

        // Zone 4 Items
        { type: 'shield', x: 4500, y: 3500, width: 50, height: 50 },
        { type: 'super-throw', x: 2500, y: 3200, width: 50, height: 50 },
        { type: 'joystick', x: 500, y: 3800, width: 50, height: 50 },
    ],
    enemies: [
        // Populate heavily with Flyers and Phasers (best for zero G)
        { type: 'phaser', x: 1200, y: 400, width: 50, height: 50, originalX: 1200, originalY: 400 },
        { type: 'flyer', x: 3000, y: 300, width: 60, height: 40, originalX: 3000, originalY: 300 },
        { type: 'bomber', x: 4000, y: 900, width: 50, height: 50, originalX: 4000, originalY: 900 },
        
        { type: 'phaser', x: 1000, y: 1400, width: 50, height: 50, originalX: 1000, originalY: 1400 },
        { type: 'flyer', x: 3500, y: 1500, width: 60, height: 40, originalX: 3500, originalY: 1500 },
        { type: 'bomber', x: 200, y: 1800, width: 50, height: 50, originalX: 200, originalY: 1800 },
        
        { type: 'phaser', x: 2500, y: 2500, width: 50, height: 50, originalX: 2500, originalY: 2500 },
        { type: 'flyer', x: 500, y: 2200, width: 60, height: 40, originalX: 500, originalY: 2200 },
        { type: 'bomber', x: 4500, y: 2800, width: 50, height: 50, originalX: 4500, originalY: 2800 },

        { type: 'phaser', x: 1500, y: 3500, width: 50, height: 50, originalX: 1500, originalY: 3500 },
        { type: 'phaser', x: 3500, y: 3500, width: 50, height: 50, originalX: 3500, originalY: 3500 },
        { type: 'bomber', x: 200, y: 3200, width: 50, height: 50, originalX: 200, originalY: 3200 }, // Guarding goal area
    ],
    goal: { x: 100, y: 3700, width: GOAL_WIDTH, height: GOAL_HEIGHT }, // Bottom Left
};


export const levels: LevelData[] = [
    level1,
    level2,
    level3,
    bossLevel1,
    level5,
    level6,
    bossLevel2,
    level7,
    level8,
    level9,
    bossLevel3,
    finalLevel,
];
