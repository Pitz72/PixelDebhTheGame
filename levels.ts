import { LevelData } from './types';
import { GAME_WIDTH, GAME_HEIGHT, BOSS_INITIAL_HP } from './constants';

// --- LEVEL 1: The Beginning ---
// Length: ~2400px. Enemies: Base only. Goal: Introduce basic movement and capture.
const level1: LevelData = {
    name: "Level 1: The Beginning",
    playerStart: { x: 100, y: GAME_HEIGHT - 120 },
    platforms: [
        { x: 0, y: GAME_HEIGHT - 40, width: 2400, height: 40 }, // Floor
        { x: 300, y: GAME_HEIGHT - 250, width: 400, height: 30 },
        { x: 900, y: GAME_HEIGHT - 400, width: 500, height: 30 },
        { x: 1600, y: GAME_HEIGHT - 250, width: 300, height: 30 },
        { x: 1300, y: GAME_HEIGHT - 550, width: 200, height: 30 },
        { x: 600, y: GAME_HEIGHT - 650, width: 400, height: 30 },
    ],
    items: [
        { type: 'joystick', x: 350, y: GAME_HEIGHT - 320, width: 50, height: 50 },
        { type: 'floppy', x: 1000, y: GAME_HEIGHT - 470, width: 50, height: 50 },
        { type: 'cartridge', x: 700, y: GAME_HEIGHT - 720, width: 50, height: 50 },
        { type: 'shield', x: 1650, y: GAME_HEIGHT - 320, width: 50, height: 50 },
    ],
    enemies: [
        { type: 'base', x: 400, y: GAME_HEIGHT - 290, width: 50, height: 50, originalX: 400, originalY: GAME_HEIGHT - 290 },
        { type: 'base', x: 1000, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 1000, originalY: GAME_HEIGHT - 80 },
        { type: 'base', x: 1700, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 1700, originalY: GAME_HEIGHT - 80 },
        { type: 'base', x: 1100, y: GAME_HEIGHT - 440, width: 50, height: 50, originalX: 1100, originalY: GAME_HEIGHT - 440 },
    ],
};

// --- LEVEL 2: Rising Up ---
// Length: ~3000px. Enemies: Base only. Goal: More complex platforming.
const level2: LevelData = {
    name: "Level 2: Rising Up",
    playerStart: { x: 100, y: GAME_HEIGHT - 120 },
    platforms: [
        { x: 0, y: GAME_HEIGHT - 40, width: 3000, height: 40 }, // Floor
        { x: 400, y: GAME_HEIGHT - 200, width: 200, height: 30 },
        { x: 800, y: GAME_HEIGHT - 350, width: 150, height: 30 },
        { x: 1100, y: GAME_HEIGHT - 500, width: 300, height: 30 },
        { x: 1600, y: GAME_HEIGHT - 400, width: 250, height: 30 },
        { x: 1300, y: GAME_HEIGHT - 650, width: 200, height: 30 },
        { x: 700, y: GAME_HEIGHT - 800, width: 400, height: 30 },
        { x: 2000, y: GAME_HEIGHT - 250, width: 300, height: 30 },
        { x: 2500, y: GAME_HEIGHT - 500, width: 400, height: 30 },
    ],
    items: [
        { type: 'joystick', x: 450, y: GAME_HEIGHT - 270, width: 50, height: 50 },
        { type: 'floppy', x: 1200, y: GAME_HEIGHT - 570, width: 50, height: 50 },
        { type: 'cartridge', x: 800, y: GAME_HEIGHT - 870, width: 50, height: 50 },
        { type: 'speed-boost', x: 2600, y: GAME_HEIGHT - 570, width: 50, height: 50 },
    ],
    enemies: [
        { type: 'base', x: 500, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 500, originalY: GAME_HEIGHT - 80 },
        { type: 'base', x: 1150, y: GAME_HEIGHT - 540, width: 50, height: 50, originalX: 1150, originalY: GAME_HEIGHT - 540 },
        { type: 'base', x: 1700, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 1700, originalY: GAME_HEIGHT - 80 },
        { type: 'base', x: 2100, y: GAME_HEIGHT - 290, width: 50, height: 50, originalX: 2100, originalY: GAME_HEIGHT - 290 },
        { type: 'base', x: 2600, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 2600, originalY: GAME_HEIGHT - 80 },
    ],
};

// --- LEVEL 3: Hoppy Hills ---
// Length: ~3800px. Enemies: Introduce Jumper. Goal: Teach player about the new threat.
const level3: LevelData = {
    name: "Level 3: Hoppy Hills",
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
        { x: 3300, y: GAME_HEIGHT - 40, width: 500, height: 40 },
    ],
    items: [
        { type: 'joystick', x: 800, y: GAME_HEIGHT - 320, width: 50, height: 50 },
        { type: 'floppy', x: 300, y: GAME_HEIGHT - 570, width: 50, height: 50 },
        { type: 'cartridge', x: 900, y: GAME_HEIGHT - 770, width: 50, height: 50 },
        { type: 'super-throw', x: 2650, y: GAME_HEIGHT - 670, width: 50, height: 50 },
    ],
    enemies: [
        { type: 'jumper', x: 700, y: GAME_HEIGHT - 290, width: 50, height: 50, originalX: 700, originalY: GAME_HEIGHT - 290 },
        { type: 'base', x: 1500, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 1500, originalY: GAME_HEIGHT - 80 },
        { type: 'base', x: 300, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 300, originalY: GAME_HEIGHT - 80 },
        { type: 'jumper', x: 1800, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 1800, originalY: GAME_HEIGHT - 80 },
        { type: 'base', x: 2500, y: GAME_HEIGHT - 240, width: 50, height: 50, originalX: 2500, originalY: GAME_HEIGHT - 240 },
        { type: 'jumper', x: 3400, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 3400, originalY: GAME_HEIGHT - 80 },
    ],
};

// --- BOSS 1 ---
const bossLevel1: LevelData = {
    name: "BOSS: Cyclops Frog",
    playerStart: { x: 100, y: GAME_HEIGHT - 120 },
    platforms: [
      { x: 0, y: GAME_HEIGHT - 40, width: GAME_WIDTH, height: 40 },
    ],
    items: [],
    enemies: [],
    boss: {
      x: (GAME_WIDTH / 2) - 160,
      y: GAME_HEIGHT - 40 - 320,
      width: 320,
      height: 320,
      maxHp: BOSS_INITIAL_HP, 
    },
};

// --- LEVEL 5: Vertical Ventures ---
// Length: ~4800px. Enemies: Base, Jumper. Goal: Combine enemies, more verticality.
const level5: LevelData = {
    name: "Level 5: Vertical Ventures",
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
        { x: 3800, y: GAME_HEIGHT - 40, width: 1000, height: 40 },
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
};

// --- LEVEL 6: Flappy Skies ---
// Length: ~6000px. Enemies: Introduce Flyer. Goal: Teach player about aerial threats.
const level6: LevelData = {
    name: "Level 6: Flappy Skies",
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
};

// --- LEVEL 7: The Gauntlet ---
// Length: ~7500px. Enemies: Introduce Bomber. Goal: Teach area denial.
const level7: LevelData = {
    name: "Level 7: The Gauntlet",
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
};

// --- BOSS 2 ---
const bossLevel2: LevelData = { ...bossLevel1, name: "BOSS: Cyclops Frog II"};

// --- LEVEL 9: The Ascent ---
// Length: ~9000px. Enemies: Introduce Phaser. Goal: Teach threat that ignores terrain.
const level9: LevelData = {
    name: "Level 9: The Ascent",
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
    ],
};

// --- LEVEL 10: The Drop ---
// Length: ~11000px. Enemies: All types. Goal: Descending level with tricky jumps.
const level10: LevelData = {
    name: "Level 10: The Drop",
    playerStart: { x: 50, y: 100 },
    platforms: [
        { x: 0, y: 200, width: 200, height: 30 },
        { x: 350, y: 300, width: 150, height: 30 },
        { x: 600, y: 400, width: 100, height: 30 },
        { x: 850, y: 500, width: 200, height: 30 },
        { x: 1200, y: 550, width: 100, height: 30 },
        { x: 1450, y: 550, width: 100, height: 30 },
        { x: 1700, y: 550, width: 220, height: 30 },
        { x: 1300, y: 250, width: 300, height: 30 },
        { x: 0, y: GAME_HEIGHT - 40, width: 200, height: 40 },
        { x: 2200, y: GAME_HEIGHT - 40, width: 8800, height: 40 }, // Long floor
    ],
    items: [
        { type: 'floppy', x: 400, y: 230, width: 50, height: 50 },
        { type: 'speed-boost', x: 1780, y: 480, width: 50, height: 50 },
        { type: 'cartridge', x: 10000, y: GAME_HEIGHT - 110, width: 50, height: 50 },
    ],
    enemies: [
        { type: 'jumper', x: 900, y: 460, width: 50, height: 50, originalX: 900, originalY: 460 },
        { type: 'phaser', x: 600, y: 700, width: 50, height: 50, originalX: 600, originalY: 700 },
        { type: 'base', x: 2500, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 2500, originalY: GAME_HEIGHT - 80 },
        { type: 'bomber', x: 4000, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 4000, originalY: GAME_HEIGHT - 80 },
    ],
};

// --- LEVEL 11: The Citadel ---
// Length: ~13000px. Enemies: All types. Goal: Final challenge mixing all elements.
const level11: LevelData = {
    name: "Level 11: The Citadel",
    playerStart: { x: 935, y: 100 },
    platforms: [
        { x: 860, y: 200, width: 200, height: 30 },
        { x: 500, y: 350, width: 150, height: 30 },
        { x: 1250, y: 350, width: 150, height: 30 },
        { x: 0, y: 500, width: 300, height: 30 },
        { x: GAME_WIDTH - 300, y: 500, width: 300, height: 30 },
        { x: 400, y: 650, width: 1120, height: 30 },
        { x: 0, y: GAME_HEIGHT - 40, width: 600, height: 40 },
        { x: 800, y: GAME_HEIGHT - 40, width: 12200, height: 40 },
    ],
    items: [
        { type: 'joystick', x: 150, y: 430, width: 50, height: 50 },
        { type: 'floppy', x: GAME_WIDTH - 200, y: 430, width: 50, height: 50 },
        { type: 'shield', x: 935, y: 600, width: 50, height: 50 },
        { type: 'super-throw', x: 200, y: GAME_HEIGHT - 320, width: 50, height: 50 },
        { type: 'cartridge', x: 12000, y: GAME_HEIGHT - 120, width: 50, height: 50 },
    ],
    enemies: [
        { type: 'bomber', x: 550, y: 310, width: 50, height: 50, originalX: 550, originalY: 310 },
        { type: 'phaser', x: 960, y: 450, width: 50, height: 50, originalX: 960, originalY: 450 },
        { type: 'jumper', x: 100, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 100, originalY: GAME_HEIGHT - 80 },
        { type: 'flyer', x: 3000, y: GAME_HEIGHT - 80, width: 60, height: 40, originalX: 3000, originalY: GAME_HEIGHT - 300 },
    ],
};

const finalBoss: LevelData = { ...bossLevel1, name: "FINAL BOSS", boss: { ...bossLevel1.boss!, maxHp: BOSS_INITIAL_HP * 2 } };
const labyrinth: LevelData = { ...level7, name: "The Labyrinth"};


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
  level11,
  finalBoss,
  labyrinth,
];