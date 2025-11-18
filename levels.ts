
import { LevelData } from './types';
import { GAME_WIDTH, GAME_HEIGHT, BOSS_INITIAL_HP } from './constants';

const GOAL_WIDTH = 90;
const GOAL_HEIGHT = 150;

// --- LEVEL 1: The Beginning ---
// Extended to 4000px with split paths.
const level1: LevelData = {
    name: "Level 1: Neon Outskirts",
    musicTheme: 'adventure',
    playerStart: { x: 100, y: GAME_HEIGHT - 120 },
    platforms: [
        { x: 0, y: GAME_HEIGHT - 40, width: 4000, height: 40 }, // Floor
        
        // Intro jumps
        { x: 300, y: GAME_HEIGHT - 200, width: 200, height: 30 },
        { x: 600, y: GAME_HEIGHT - 350, width: 200, height: 30 },
        
        // Split path choice
        { x: 900, y: GAME_HEIGHT - 500, width: 400, height: 30 }, // Upper path
        { x: 900, y: GAME_HEIGHT - 200, width: 400, height: 30 }, // Lower path
        
        // Middle section
        { x: 1400, y: GAME_HEIGHT - 350, width: 300, height: 30 },
        { x: 1800, y: GAME_HEIGHT - 250, width: 300, height: 30 },
        { x: 1800, y: GAME_HEIGHT - 650, width: 300, height: 30 }, // High platform with reward
        
        // Bridge section
        { x: 2200, y: GAME_HEIGHT - 450, width: 600, height: 30 },
        
        // Stairs to finish
        { x: 3000, y: GAME_HEIGHT - 250, width: 200, height: 30 },
        { x: 3300, y: GAME_HEIGHT - 400, width: 200, height: 30 },
        { x: 3600, y: GAME_HEIGHT - 200, width: 400, height: 30 },
    ],
    items: [
        { type: 'joystick', x: 350, y: GAME_HEIGHT - 270, width: 50, height: 50 },
        { type: 'floppy', x: 1000, y: GAME_HEIGHT - 570, width: 50, height: 50 }, // Upper path reward
        { type: 'cartridge', x: 1900, y: GAME_HEIGHT - 720, width: 50, height: 50 }, // High platform reward
        { type: 'shield', x: 1500, y: GAME_HEIGHT - 420, width: 50, height: 50 },
        { type: 'super-throw', x: 2500, y: GAME_HEIGHT - 520, width: 50, height: 50 },
        { type: 'joystick', x: 3400, y: GAME_HEIGHT - 470, width: 50, height: 50 },
    ],
    enemies: [
        { type: 'base', x: 400, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 400, originalY: GAME_HEIGHT - 80 },
        { type: 'base', x: 1000, y: GAME_HEIGHT - 570, width: 50, height: 50, originalX: 1000, originalY: GAME_HEIGHT - 570 }, // Upper path enemy
        { type: 'base', x: 1000, y: GAME_HEIGHT - 270, width: 50, height: 50, originalX: 1000, originalY: GAME_HEIGHT - 270 }, // Lower path enemy
        { type: 'base', x: 2300, y: GAME_HEIGHT - 520, width: 50, height: 50, originalX: 2300, originalY: GAME_HEIGHT - 520 },
        { type: 'base', x: 2600, y: GAME_HEIGHT - 520, width: 50, height: 50, originalX: 2600, originalY: GAME_HEIGHT - 520 },
        { type: 'base', x: 3700, y: GAME_HEIGHT - 270, width: 50, height: 50, originalX: 3700, originalY: GAME_HEIGHT - 270 },
    ],
    goal: { x: 3900, y: GAME_HEIGHT - 40 - GOAL_HEIGHT, width: GOAL_WIDTH, height: GOAL_HEIGHT },
};

// --- LEVEL 2: Circuit City ---
const level2: LevelData = {
    name: "Level 2: Circuit City",
    musicTheme: 'adventure',
    playerStart: { x: 100, y: GAME_HEIGHT - 120 },
    platforms: [
        { x: 0, y: GAME_HEIGHT - 40, width: 4200, height: 40 }, // Floor
        
        { x: 400, y: GAME_HEIGHT - 200, width: 200, height: 30 },
        { x: 700, y: GAME_HEIGHT - 350, width: 200, height: 30 },
        { x: 1000, y: GAME_HEIGHT - 500, width: 300, height: 30 },
        
        // The drop zone
        { x: 1400, y: GAME_HEIGHT - 650, width: 200, height: 30 },
        { x: 1700, y: GAME_HEIGHT - 400, width: 200, height: 30 },
        { x: 2000, y: GAME_HEIGHT - 250, width: 200, height: 30 },
        
        // Long run
        { x: 2300, y: GAME_HEIGHT - 400, width: 800, height: 30 },
        { x: 2500, y: GAME_HEIGHT - 700, width: 400, height: 30 },
        
        // End challenge
        { x: 3200, y: GAME_HEIGHT - 250, width: 200, height: 30 },
        { x: 3500, y: GAME_HEIGHT - 400, width: 200, height: 30 },
    ],
    items: [
        { type: 'joystick', x: 450, y: GAME_HEIGHT - 270, width: 50, height: 50 },
        { type: 'floppy', x: 1100, y: GAME_HEIGHT - 570, width: 50, height: 50 },
        { type: 'cartridge', x: 2600, y: GAME_HEIGHT - 770, width: 50, height: 50 },
        { type: 'speed-boost', x: 2400, y: GAME_HEIGHT - 470, width: 50, height: 50 },
        { type: 'shield', x: 3550, y: GAME_HEIGHT - 470, width: 50, height: 50 },
    ],
    enemies: [
        { type: 'base', x: 750, y: GAME_HEIGHT - 420, width: 50, height: 50, originalX: 750, originalY: GAME_HEIGHT - 420 },
        { type: 'base', x: 1100, y: GAME_HEIGHT - 570, width: 50, height: 50, originalX: 1100, originalY: GAME_HEIGHT - 570 },
        { type: 'base', x: 2500, y: GAME_HEIGHT - 470, width: 50, height: 50, originalX: 2500, originalY: GAME_HEIGHT - 470 },
        { type: 'base', x: 2800, y: GAME_HEIGHT - 470, width: 50, height: 50, originalX: 2800, originalY: GAME_HEIGHT - 470 },
        { type: 'base', x: 2700, y: GAME_HEIGHT - 770, width: 50, height: 50, originalX: 2700, originalY: GAME_HEIGHT - 770 },
        { type: 'base', x: 3800, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 3800, originalY: GAME_HEIGHT - 80 },
    ],
    goal: { x: 4100, y: GAME_HEIGHT - 40 - GOAL_HEIGHT, width: GOAL_WIDTH, height: GOAL_HEIGHT },
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
        { x: 2100, y: GAME_HEIGHT - 40, width: 3900, height: 40 }, // long floor
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

// --- LEVEL 7: The Gauntlet ---
const level7: LevelData = {
    name: "Level 7: The Gauntlet",
    musicTheme: 'industrial',
    playerStart: { x: 50, y: GAME_HEIGHT - 120 },
    platforms: [
        { x: 0, y: GAME_HEIGHT - 40, width: 7500, height: 40 },
        { x: 400, y: GAME_HEIGHT - 250, width: 800, height: 30 },
        { x: 1500, y: GAME_HEIGHT - 400, width: 300, height: 30 },
        { x: 2000, y: GAME_HEIGHT - 550, width: 1000, height: 30 },
        { x: 3300, y: GAME_HEIGHT - 200, width: 500, height: 30 },
        { x: 4000, y: GAME_HEIGHT - 450, width: 200, height: 30 },
        { x: 4500, y: GAME_HEIGHT - 300, width: 800, height: 30 },
        { x: 5800, y: GAME_HEIGHT - 500, width: 400, height: 30 },
        { x: 6500, y: GAME_HEIGHT - 250, width: 600, height: 30 },
    ],
    items: [
        { type: 'shield', x: 4100, y: GAME_HEIGHT - 520, width: 50, height: 50 },
        { type: 'super-throw', x: 6000, y: GAME_HEIGHT - 570, width: 50, height: 50 },
    ],
    enemies: [
        { type: 'bomber', x: 900, y: GAME_HEIGHT - 290, width: 50, height: 50, originalX: 900, originalY: GAME_HEIGHT - 290 },
        { type: 'jumper', x: 1800, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 1800, originalY: GAME_HEIGHT - 80 },
        { type: 'flyer', x: 2500, y: 300, width: 60, height: 40, originalX: 2500, originalY: 300 },
        { type: 'base', x: 3500, y: GAME_HEIGHT - 240, width: 50, height: 50, originalX: 3500, originalY: GAME_HEIGHT - 240 },
        { type: 'bomber', x: 4800, y: GAME_HEIGHT - 340, width: 50, height: 50, originalX: 4800, originalY: GAME_HEIGHT - 340 },
        { type: 'flyer', x: 6800, y: 400, width: 60, height: 40, originalX: 6800, originalY: 400 },
    ],
    goal: { x: 7400, y: GAME_HEIGHT - 40 - GOAL_HEIGHT, width: GOAL_WIDTH, height: GOAL_HEIGHT },
};

// --- BOSS 2 ---
const bossLevel2: LevelData = { ...bossLevel1, name: "BOSS: Cyclops Frog II", musicTheme: 'boss'};

// --- LEVEL 9: The Ascent ---
const level9: LevelData = {
    name: "Level 9: The Ascent",
    musicTheme: 'ethereal',
    playerStart: { x: 50, y: GAME_HEIGHT - 120 },
    platforms: [
        { x: 0, y: GAME_HEIGHT - 40, width: 400, height: 40 },
        { x: 550, y: GAME_HEIGHT - 150, width: 150, height: 30 },
        { x: 200, y: GAME_HEIGHT - 300, width: 150, height: 30 },
        { x: 550, y: GAME_HEIGHT - 450, width: 150, height: 30 },
        { x: 900, y: GAME_HEIGHT - 550, width: 150, height: 30 },
        { x: 1250, y: GAME_HEIGHT - 650, width: 150, height: 30 },
        { x: 1600, y: GAME_HEIGHT - 750, width: 320, height: 30 },
        { x: 1200, y: GAME_HEIGHT - 900, width: 200, height: 30 },
        { x: 700, y: GAME_HEIGHT - 1000, width: 200, height: 30 },
        { x: 2000, y: GAME_HEIGHT - 40, width: 7000, height: 40 }, // Very long floor
    ],
    items: [
        { type: 'joystick', x: 600, y: GAME_HEIGHT - 220, width: 50, height: 50 },
        { type: 'shield', x: 1700, y: GAME_HEIGHT - 820, width: 50, height: 50 },
        { type: 'cartridge', x: 750, y: GAME_HEIGHT - 1070, width: 50, height: 50 },
    ],
    enemies: [
        { type: 'phaser', x: 400, y: 100, width: 50, height: 50, originalX: 400, originalY: 100 },
        { type: 'bomber', x: 1750, y: GAME_HEIGHT - 790, width: 50, height: 50, originalX: 1750, originalY: GAME_HEIGHT - 790 },
        { type: 'jumper', x: 3000, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 3000, originalY: GAME_HEIGHT - 80 },
        { type: 'base', x: 4200, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 4200, originalY: GAME_HEIGHT - 80 },
        { type: 'phaser', x: 6000, y: 300, width: 50, height: 50, originalX: 6000, originalY: 300 },
    ],
    goal: { x: 8900, y: GAME_HEIGHT - 40 - GOAL_HEIGHT, width: GOAL_WIDTH, height: GOAL_HEIGHT },
};

// --- LEVEL 10: The Drop ---
const level10: LevelData = {
    name: "Level 10: The Drop",
    musicTheme: 'ethereal',
    playerStart: { x: 100, y: 100 },
    platforms: [
        { x: 0, y: 200, width: 400, height: 30 },
        { x: 600, y: 350, width: 500, height: 30 },
        { x: 1300, y: 500, width: 300, height: 30 },
        { x: 1800, y: 650, width: 800, height: 30 },
        { x: 2800, y: 500, width: 200, height: 30 },
        { x: 3200, y: 350, width: 400, height: 30 },
        { x: 3800, y: 200, width: 7200, height: 30 },
        { x: 0, y: GAME_HEIGHT - 40, width: 11000, height: 40 }, // Floor
    ],
    items: [
        { type: 'shield', x: 1400, y: 430, width: 50, height: 50 },
        { type: 'joystick', x: 2200, y: 580, width: 50, height: 50 },
    ],
    enemies: [
        { type: 'flyer', x: 800, y: 200, width: 60, height: 40, originalX: 800, originalY: 200 },
        { type: 'bomber', x: 2000, y: 580, width: 50, height: 50, originalX: 2000, originalY: 580 },
        { type: 'phaser', x: 5000, y: 100, width: 50, height: 50, originalX: 5000, originalY: 100 },
        { type: 'jumper', x: 7000, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 7000, originalY: GAME_HEIGHT - 80 },
    ],
    goal: { x: 10900, y: GAME_HEIGHT - 40 - GOAL_HEIGHT, width: GOAL_WIDTH, height: GOAL_HEIGHT },
};

// --- BOSS 3 ---
const bossLevel3: LevelData = { ...bossLevel1, name: "BOSS: Final Frog", musicTheme: 'boss'};

// --- LEVEL 12: The Factory ---
const level12: LevelData = {
    name: "Level 12: The Factory",
    musicTheme: 'industrial',
    playerStart: { x: 100, y: GAME_HEIGHT - 120 },
    platforms: [
        { x: 0, y: GAME_HEIGHT - 40, width: 13500, height: 40 },
        { x: 500, y: GAME_HEIGHT - 200, width: 1000, height: 30 },
        { x: 1800, y: GAME_HEIGHT - 350, width: 1000, height: 30 },
        { x: 3100, y: GAME_HEIGHT - 500, width: 1000, height: 30 },
        { x: 4400, y: GAME_HEIGHT - 650, width: 1000, height: 30 },
        // Conveyor belts (visual distinction would be needed in component)
        { x: 6000, y: GAME_HEIGHT - 300, width: 1500, height: 30 },
        { x: 8000, y: GAME_HEIGHT - 500, width: 1500, height: 30 },
    ],
    items: [],
    enemies: [
        { type: 'base', x: 800, y: GAME_HEIGHT - 240, width: 50, height: 50, originalX: 800, originalY: GAME_HEIGHT - 240 },
        { type: 'jumper', x: 2200, y: GAME_HEIGHT - 390, width: 50, height: 50, originalX: 2200, originalY: GAME_HEIGHT - 390 },
        { type: 'bomber', x: 3500, y: GAME_HEIGHT - 540, width: 50, height: 50, originalX: 3500, originalY: GAME_HEIGHT - 540 },
        { type: 'phaser', x: 9000, y: 100, width: 50, height: 50, originalX: 9000, originalY: 100 },
        { type: 'flyer', x: 11000, y: 300, width: 60, height: 40, originalX: 11000, originalY: 300 },
    ],
    goal: { x: 13400, y: GAME_HEIGHT - 40 - GOAL_HEIGHT, width: GOAL_WIDTH, height: GOAL_HEIGHT },
};

// --- FINAL LEVEL: The Labyrinth ---
const finalLevel: LevelData = {
    name: "The Labyrinth",
    musicTheme: 'ethereal',
    playerStart: { x: 50, y: GAME_HEIGHT - 120 },
    platforms: [
        // Floor and Ceiling
        { x: 0, y: GAME_HEIGHT - 40, width: GAME_WIDTH, height: 40 },
        { x: 0, y: 0, width: GAME_WIDTH, height: 40 },
        // Walls
        { x: 0, y: 40, width: 40, height: GAME_HEIGHT - 80 },
        { x: GAME_WIDTH - 40, y: 40, width: 40, height: GAME_HEIGHT - 80 },
        // Maze platforms
        { x: 40, y: GAME_HEIGHT - 150, width: 500, height: 30 },
        { x: 300, y: GAME_HEIGHT - 300, width: 600, height: 30 },
        { x: 0, y: GAME_HEIGHT - 450, width: 400, height: 30 },
        { x: 500, y: GAME_HEIGHT - 600, width: GAME_WIDTH - 500, height: 30 },
        { x: 300, y: GAME_HEIGHT - 750, width: 400, height: 30 },
    ],
    items: [],
    enemies: [],
    // The goal is just to reach the end
    goal: { x: GAME_WIDTH - 150, y: 80, width: GOAL_WIDTH, height: GOAL_HEIGHT },
};


export const levels: LevelData[] = [
    level1,
    level2,
    level3,
    bossLevel1,
    level5,
    level6,
    level7,
    bossLevel2,
    level9,
    level10,
    level12,
    bossLevel3,
    finalLevel,
];
