import { LevelData } from './types';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';

export const levels: LevelData[] = [
  // Level 1: Introduction (Expanded)
  {
    playerStart: { x: 100, y: GAME_HEIGHT - 120 },
    platforms: [
      { x: 0, y: GAME_HEIGHT - 40, width: 3840, height: 40 }, // Expanded Floor
      { x: 300, y: GAME_HEIGHT - 250, width: 400, height: 30 },
      { x: GAME_WIDTH - 700, y: GAME_HEIGHT - 250, width: 400, height: 30 },
      { x: 850, y: GAME_HEIGHT - 500, width: 600, height: 30 },
      { x: 450, y: GAME_HEIGHT - 750, width: 300, height: 30 }, // Moved from x: 150
      { x: GAME_WIDTH - 450, y: GAME_HEIGHT - 750, width: 300, height: 30 },
      // New section
      { x: 2100, y: GAME_HEIGHT - 200, width: 300, height: 30 },
      { x: 2500, y: GAME_HEIGHT - 350, width: 150, height: 30 },
      { x: 2800, y: GAME_HEIGHT - 500, width: 400, height: 30 },
      { x: 3400, y: GAME_HEIGHT - 650, width: 200, height: 30 },
    ],
    items: [
      { type: 'joystick', x: 350, y: GAME_HEIGHT - 320, width: 50, height: 50 },
      { type: 'floppy', x: GAME_WIDTH - 650, y: GAME_HEIGHT - 320, width: 50, height: 50 },
      { type: 'cartridge', x: 925, y: GAME_HEIGHT - 570, width: 50, height: 50 },
      { type: 'joystick', x: 500, y: GAME_HEIGHT - 820, width: 50, height: 50 }, // Moved from x: 200
      { type: 'floppy', x: GAME_WIDTH - 300, y: GAME_HEIGHT - 820, width: 50, height: 50 },
      { type: 'shield', x: 1200, y: GAME_HEIGHT - 570, width: 50, height: 50 },
       // New section
      { type: 'speed-boost', x: 2150, y: GAME_HEIGHT - 270, width: 50, height: 50 },
      { type: 'cartridge', x: 2900, y: GAME_HEIGHT - 570, width: 50, height: 50 },
      { type: 'joystick', x: 3450, y: GAME_HEIGHT - 720, width: 50, height: 50 },
    ],
    enemies: [
      { type: 'base', x: 400, y: GAME_HEIGHT - 290, width: 50, height: 50, originalX: 400, originalY: GAME_HEIGHT - 290 },
      { type: 'base', x: GAME_WIDTH - 500, y: GAME_HEIGHT - 290, width: 50, height: 50, originalX: GAME_WIDTH - 500, originalY: GAME_HEIGHT - 290 },
      // New section
      { type: 'jumper', x: 2000, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 2000, originalY: GAME_HEIGHT - 80 },
      { type: 'flyer', x: 2600, y: 400, width: 60, height: 40, originalX: 2600, originalY: 400 },
      { type: 'base', x: 3000, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 3000, originalY: GAME_HEIGHT - 80 },
    ],
  },
  // Level 2: Introduction to Jumpers (Expanded)
  {
    playerStart: { x: 100, y: GAME_HEIGHT - 120 },
    platforms: [
      { x: 0, y: GAME_HEIGHT - 40, width: 3000, height: 40 }, // Continuous floor
      { x: 400, y: GAME_HEIGHT - 200, width: 200, height: 30 },
      { x: 800, y: GAME_HEIGHT - 400, width: 300, height: 30 },
      { x: 1200, y: GAME_HEIGHT - 600, width: 400, height: 30 },
      { x: 150, y: GAME_HEIGHT - 500, width: 300, height: 30 },
      { x: 700, y: GAME_HEIGHT - 800, width: 500, height: 30 },
      // New section
      { x: 1800, y: GAME_HEIGHT - 250, width: 300, height: 30 },
      { x: 2200, y: GAME_HEIGHT - 450, width: 200, height: 30 },
      { x: 2500, y: GAME_HEIGHT - 650, width: 400, height: 30 },
    ],
    items: [
      { type: 'joystick', x: 450, y: GAME_HEIGHT - 270, width: 50, height: 50 },
      { type: 'floppy', x: 900, y: GAME_HEIGHT - 470, width: 50, height: 50 },
      { type: 'cartridge', x: 1300, y: GAME_HEIGHT - 670, width: 50, height: 50 },
      { type: 'shield', x: 200, y: GAME_HEIGHT - 570, width: 50, height: 50 },
      { type: 'floppy', x: 900, y: GAME_HEIGHT - 870, width: 50, height: 50 },
      // New section
      { type: 'joystick', x: 2300, y: GAME_HEIGHT - 520, width: 50, height: 50 },
      { type: 'speed-boost', x: 2600, y: GAME_HEIGHT - 720, width: 50, height: 50 },
    ],
    enemies: [
      { type: 'jumper', x: 850, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 850, originalY: GAME_HEIGHT - 80 },
      { type: 'base', x: 1250, y: GAME_HEIGHT - 640, width: 50, height: 50, originalX: 1250, originalY: GAME_HEIGHT - 640 },
      { type: 'jumper', x: 1600, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 1600, originalY: GAME_HEIGHT - 80 },
      // New section
      { type: 'jumper', x: 2000, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 2000, originalY: GAME_HEIGHT - 80 },
      { type: 'flyer', x: 2400, y: 300, width: 60, height: 40, originalX: 2400, originalY: 300 },
    ],
  },
  // Level 3: Aerial Assault (Expanded)
  {
    playerStart: { x: 100, y: GAME_HEIGHT - 120 },
    platforms: [
        { x: 0, y: GAME_HEIGHT - 40, width: 500, height: 40 },
        { x: 650, y: GAME_HEIGHT - 250, width: 600, height: 30 },
        { x: 1400, y: GAME_HEIGHT - 40, width: 1000, height: 40 }, // Extended landing
        { x: 200, y: GAME_HEIGHT - 500, width: 300, height: 30 },
        { x: 650, y: GAME_HEIGHT - 700, width: 600, height: 30 },
        // New section
        { x: 2500, y: GAME_HEIGHT - 200, width: 300, height: 30 },
        { x: 2900, y: GAME_HEIGHT - 400, width: 300, height: 30 },
        { x: 2400, y: GAME_HEIGHT - 600, width: 400, height: 30 },
    ],
    items: [
        { type: 'joystick', x: 800, y: GAME_HEIGHT - 320, width: 50, height: 50 },
        { type: 'speed-boost', x: 300, y: GAME_HEIGHT - 570, width: 50, height: 50 },
        { type: 'cartridge', x: 900, y: GAME_HEIGHT - 770, width: 50, height: 50 },
        // New section
        { type: 'super-throw', x: 2600, y: GAME_HEIGHT - 270, width: 50, height: 50 },
    ],
    enemies: [
        { type: 'base', x: 1500, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 1500, originalY: GAME_HEIGHT - 80 },
        { type: 'flyer', x: 900, y: 150, width: 60, height: 40, originalX: 900, originalY: 150 },
        { type: 'jumper', x: 700, y: GAME_HEIGHT - 290, width: 50, height: 50, originalX: 700, originalY: GAME_HEIGHT - 290 },
        { type: 'flyer', x: 400, y: 400, width: 60, height: 40, originalX: 400, originalY: 400 },
        // New section
        { type: 'flyer', x: 2700, y: 200, width: 60, height: 40, originalX: 2700, originalY: 200 },
        { type: 'base', x: 2000, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 2000, originalY: GAME_HEIGHT - 80 },
    ],
  },
  // Level 4: The Frog's Lair (BOSS - Redesigned)
  {
    playerStart: { x: 100, y: GAME_HEIGHT - 120 },
    platforms: [
      { x: 0, y: GAME_HEIGHT - 40, width: GAME_WIDTH, height: 40 }, // Simple Floor
    ],
    items: [], // No items
    enemies: [], // No enemies
    boss: {
      x: (GAME_WIDTH / 2) - 125,
      y: GAME_HEIGHT - 40 - 250, // Sits on the floor
      width: 250,
      height: 250,
      vx: 0, // Stationary boss
      maxHp: 30, // Tougher boss
    },
    enemySpawns: [], // No spawns
  },
  // Level 5: The Ascent (Expanded)
  {
    playerStart: { x: 80, y: GAME_HEIGHT - 120 },
    platforms: [
        { x: 0, y: GAME_HEIGHT - 40, width: 400, height: 40 },
        { x: 550, y: GAME_HEIGHT - 200, width: 150, height: 30 },
        { x: 250, y: GAME_HEIGHT - 350, width: 150, height: 30 },
        { x: 550, y: GAME_HEIGHT - 500, width: 150, height: 30 },
        { x: 850, y: GAME_HEIGHT - 650, width: 250, height: 30 },
        { x: 1200, y: GAME_HEIGHT - 800, width: 400, height: 30 },
        { x: 1700, y: GAME_HEIGHT - 950, width: 220, height: 30 },
        // New section (wider ascent)
        { x: 2200, y: GAME_HEIGHT - 800, width: 300, height: 30 },
        { x: 2600, y: GAME_HEIGHT - 650, width: 150, height: 30 },
        { x: 2300, y: GAME_HEIGHT - 500, width: 150, height: 30 },
        { x: 2600, y: GAME_HEIGHT - 350, width: 400, height: 30 },
        { x: 2800, y: GAME_HEIGHT - 40, width: 400, height: 40 },
    ],
    items: [
        { type: 'super-throw', x: 600, y: GAME_HEIGHT - 270, width: 50, height: 50 },
        { type: 'floppy', x: 900, y: GAME_HEIGHT - 720, width: 50, height: 50 },
        { type: 'cartridge', x: 1800, y: GAME_HEIGHT - 1020, width: 50, height: 50 },
        // New section
        { type: 'shield', x: 2700, y: GAME_HEIGHT - 420, width: 50, height: 50 },
    ],
    enemies: [
        { type: 'base', x: 150, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 150, originalY: GAME_HEIGHT - 80 },
        { type: 'jumper', x: 900, y: GAME_HEIGHT - 690, width: 50, height: 50, originalX: 900, originalY: GAME_HEIGHT - 690 },
        { type: 'flyer', x: 1400, y: 300, width: 60, height: 40, originalX: 1400, originalY: 300 },
        { type: 'flyer', x: 400, y: 600, width: 60, height: 40, originalX: 400, originalY: 600 },
        // New section
        { type: 'base', x: 2850, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 2850, originalY: GAME_HEIGHT - 80 },
        { type: 'flyer', x: 2400, y: 400, width: 60, height: 40, originalX: 2400, originalY: 400 },
    ],
  },
  // Level 6: Final Fortress (Expanded)
  {
    playerStart: { x: 1820, y: GAME_HEIGHT - 120 },
    platforms: [
        { x: 0, y: GAME_HEIGHT - 40, width: 200, height: 40 },
        { x: 350, y: GAME_HEIGHT - 40, width: 400, height: 40 },
        { x: 900, y: GAME_HEIGHT - 40, width: 400, height: 40 },
        { x: 1450, y: GAME_HEIGHT - 40, width: 1500, height: 40 }, // Extended floor
        { x: 1600, y: GAME_HEIGHT - 250, width: 150, height: 30 },
        { x: 1200, y: GAME_HEIGHT - 350, width: 150, height: 30 },
        { x: 800, y: GAME_HEIGHT - 250, width: 150, height: 30 },
        { x: 450, y: GAME_HEIGHT - 350, width: 150, height: 30 },
        { x: 100, y: GAME_HEIGHT - 500, width: 200, height: 30 },
        { x: 500, y: GAME_HEIGHT - 600, width: 900, height: 30 },
        { x: 1600, y: GAME_HEIGHT - 750, width: 320, height: 30 },
        { x: 0, y: GAME_HEIGHT - 850, width: 320, height: 30 },
        // New section
        { x: 2000, y: GAME_HEIGHT - 200, width: 400, height: 30 },
        { x: 2500, y: GAME_HEIGHT - 350, width: 150, height: 30 },
        { x: 2200, y: GAME_HEIGHT - 500, width: 150, height: 30 },
        { x: 2600, y: GAME_HEIGHT - 650, width: 300, height: 30 },
    ],
    items: [
        { type: 'shield', x: 150, y: GAME_HEIGHT - 570, width: 50, height: 50 },
        { type: 'floppy', x: 1850, y: GAME_HEIGHT - 820, width: 50, height: 50 },
        { type: 'cartridge', x: 150, y: GAME_HEIGHT - 920, width: 50, height: 50 },
        { type: 'speed-boost', x: 950, y: GAME_HEIGHT - 100, width: 50, height: 50 },
        // New section
        { type: 'joystick', x: 2700, y: GAME_HEIGHT - 720, width: 50, height: 50 },
    ],
    enemies: [
        { type: 'jumper', x: 400, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 400, originalY: GAME_HEIGHT - 80 },
        { type: 'jumper', x: 1200, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 1200, originalY: GAME_HEIGHT - 80 },
        { type: 'base', x: 500, y: GAME_HEIGHT - 390, width: 50, height: 50, originalX: 500, originalY: GAME_HEIGHT - 390 },
        { type: 'base', x: 1650, y: GAME_HEIGHT - 290, width: 50, height: 50, originalX: 1650, originalY: GAME_HEIGHT - 290 },
        { type: 'flyer', x: 900, y: 450, width: 60, height: 40, originalX: 900, originalY: 450 },
        { type: 'flyer', x: 900, y: 150, width: 60, height: 40, originalX: 900, originalY: 150 },
        { type: 'base', x: 700, y: GAME_HEIGHT - 640, width: 50, height: 50, originalX: 700, originalY: GAME_HEIGHT - 640 },
        { type: 'base', x: 1200, y: GAME_HEIGHT - 640, width: 50, height: 50, originalX: 1200, originalY: GAME_HEIGHT - 640 },
        // New section
        { type: 'jumper', x: 2100, y: GAME_HEIGHT - 240, width: 50, height: 50, originalX: 2100, originalY: GAME_HEIGHT - 240 },
        { type: 'base', x: 2800, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 2800, originalY: GAME_HEIGHT - 80 },
    ],
  },
  // Level 7: The Gauntlet (Expanded)
  {
    playerStart: { x: 50, y: GAME_HEIGHT - 120 },
    platforms: [
        { x: 0, y: GAME_HEIGHT - 40, width: 3500, height: 40 }, // Extended Gauntlet floor
        { x: 200, y: GAME_HEIGHT - 250, width: 300, height: 30 },
        { x: 700, y: GAME_HEIGHT - 250, width: 500, height: 30 },
        { x: 1400, y: GAME_HEIGHT - 250, width: 300, height: 30 },
        { x: 400, y: GAME_HEIGHT - 500, width: 1100, height: 30 },
        { x: 200, y: GAME_HEIGHT - 750, width: 1520, height: 30 },
        // New Section
        { x: 1900, y: GAME_HEIGHT - 250, width: 1400, height: 30 },
        { x: 1800, y: GAME_HEIGHT - 500, width: 400, height: 30 },
        { x: 2500, y: GAME_HEIGHT - 650, width: 800, height: 30 },
    ],
    items: [
        { type: 'cartridge', x: 250, y: GAME_HEIGHT - 320, width: 50, height: 50 },
        { type: 'super-throw', x: 950, y: GAME_HEIGHT - 320, width: 50, height: 50 },
        { type: 'joystick', x: 1650, y: GAME_HEIGHT - 320, width: 50, height: 50 },
        { type: 'shield', x: 950, y: GAME_HEIGHT - 820, width: 50, height: 50 },
        // New section
        { type: 'floppy', x: 2800, y: GAME_HEIGHT - 720, width: 50, height: 50 },
    ],
    enemies: [
        { type: 'base', x: 300, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 300, originalY: GAME_HEIGHT - 80 },
        { type: 'jumper', x: 500, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 500, originalY: GAME_HEIGHT - 80 },
        { type: 'base', x: 700, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 700, originalY: GAME_HEIGHT - 80 },
        { type: 'jumper', x: 900, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 900, originalY: GAME_HEIGHT - 80 },
        { type: 'base', x: 1100, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 1100, originalY: GAME_HEIGHT - 80 },
        { type: 'base', x: 1300, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 1300, originalY: GAME_HEIGHT - 80 },
        { type: 'jumper', x: 1500, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 1500, originalY: GAME_HEIGHT - 80 },
        { type: 'flyer', x: 600, y: 200, width: 60, height: 40, originalX: 600, originalY: 200 },
        { type: 'flyer', x: 1300, y: 200, width: 60, height: 40, originalX: 1300, originalY: 200 },
        { type: 'jumper', x: 1000, y: GAME_HEIGHT - 540, width: 50, height: 50, originalX: 1000, originalY: GAME_HEIGHT - 540 },
        // New section
        { type: 'base', x: 1800, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 1800, originalY: GAME_HEIGHT - 80 },
        { type: 'jumper', x: 2000, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 2000, originalY: GAME_HEIGHT - 80 },
        { type: 'base', x: 2200, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 2200, originalY: GAME_HEIGHT - 80 },
        { type: 'flyer', x: 2500, y: 200, width: 60, height: 40, originalX: 2500, originalY: 200 },
    ],
  },
  // Level 8: Flyer's Nest (Expanded)
  {
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
        // New section
        { x: 2000, y: GAME_HEIGHT - 40, width: 800, height: 40 },
        { x: 2100, y: GAME_HEIGHT - 200, width: 150, height: 30 },
        { x: 2400, y: GAME_HEIGHT - 350, width: 150, height: 30 },
        { x: 2700, y: GAME_HEIGHT - 500, width: 150, height: 30 },
    ],
    items: [
        { type: 'joystick', x: 600, y: GAME_HEIGHT - 220, width: 50, height: 50 },
        { type: 'shield', x: 1700, y: GAME_HEIGHT - 820, width: 50, height: 50 },
        { type: 'cartridge', x: 750, y: GAME_HEIGHT - 1070, width: 50, height: 50 },
        // New section
        { type: 'speed-boost', x: 2200, y: GAME_HEIGHT - 80, width: 50, height: 50 },
    ],
    enemies: [
        { type: 'flyer', x: 400, y: 100, width: 60, height: 40, originalX: 400, originalY: 100 },
        { type: 'flyer', x: 800, y: 200, width: 60, height: 40, originalX: 800, originalY: 200 },
        { type: 'flyer', x: 1200, y: 300, width: 60, height: 40, originalX: 1200, originalY: 300 },
        { type: 'flyer', x: 1500, y: 150, width: 60, height: 40, originalX: 1500, originalY: 150 },
        { type: 'flyer', x: 1000, y: 600, width: 60, height: 40, originalX: 1000, originalY: 600 },
        { type: 'jumper', x: 1750, y: GAME_HEIGHT - 790, width: 50, height: 50, originalX: 1750, originalY: GAME_HEIGHT - 790 },
        // New section
        { type: 'flyer', x: 2300, y: 250, width: 60, height: 40, originalX: 2300, originalY: 250 },
        { type: 'flyer', x: 2600, y: 450, width: 60, height: 40, originalX: 2600, originalY: 450 },
    ],
  },
  // Level 9: Precision (Expanded)
  {
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
        { x: GAME_WIDTH - 200, y: GAME_HEIGHT - 40, width: 200, height: 40 },
        // New section
        { x: 2200, y: 500, width: 100, height: 30 },
        { x: 2400, y: 450, width: 100, height: 30 },
        { x: 2600, y: 400, width: 100, height: 30 },
        { x: 2800, y: 350, width: 100, height: 30 },
        { x: 3000, y: 300, width: 300, height: 30 },
    ],
    items: [
        { type: 'floppy', x: 400, y: 230, width: 50, height: 50 },
        { type: 'speed-boost', x: 1780, y: 480, width: 50, height: 50 },
        { type: 'cartridge', x: 1800, y: GAME_HEIGHT - 110, width: 50, height: 50 },
        // New section
        { type: 'joystick', x: 3100, y: 230, width: 50, height: 50 },
    ],
    enemies: [
        { type: 'jumper', x: 900, y: 460, width: 50, height: 50, originalX: 900, originalY: 460 },
        { type: 'jumper', x: 1400, y: 210, width: 50, height: 50, originalX: 1400, originalY: 210 },
        { type: 'base', x: 1750, y: 510, width: 50, height: 50, originalX: 1750, originalY: 510 },
        { type: 'flyer', x: 600, y: 700, width: 60, height: 40, originalX: 600, originalY: 700 },
        // New section
        { type: 'flyer', x: 2500, y: 200, width: 60, height: 40, originalX: 2500, originalY: 200 },
    ],
  },
  // Level 10: Chaos Castle (Expanded)
  {
    playerStart: { x: 935, y: 100 },
    platforms: [
        { x: 860, y: 200, width: 200, height: 30 },
        { x: 500, y: 350, width: 150, height: 30 },
        { x: 1250, y: 350, width: 150, height: 30 },
        { x: 0, y: 500, width: 300, height: 30 },
        { x: GAME_WIDTH - 300, y: 500, width: 300, height: 30 },
        { x: 400, y: 650, width: 1120, height: 30 },
        { x: 0, y: GAME_HEIGHT - 40, width: 600, height: 40 },
        { x: GAME_WIDTH - 600, y: GAME_HEIGHT - 40, width: 1200, height: 40 }, // Extended floor
        { x: 150, y: GAME_HEIGHT - 250, width: 150, height: 30 },
        { x: GAME_WIDTH - 300, y: GAME_HEIGHT - 250, width: 150, height: 30 },
        // New Section
        { x: 2400, y: GAME_HEIGHT - 200, width: 300, height: 30 },
        { x: 2800, y: GAME_HEIGHT - 350, width: 300, height: 30 },
        { x: 2300, y: GAME_HEIGHT - 500, width: 150, height: 30 },
    ],
    items: [
        { type: 'joystick', x: 150, y: 430, width: 50, height: 50 },
        { type: 'floppy', x: GAME_WIDTH - 200, y: 430, width: 50, height: 50 },
        { type: 'shield', x: 935, y: 600, width: 50, height: 50 },
        { type: 'super-throw', x: 200, y: GAME_HEIGHT - 320, width: 50, height: 50 },
        { type: 'cartridge', x: GAME_WIDTH-250, y: GAME_HEIGHT - 320, width: 50, height: 50 },
        // New Section
        { type: 'joystick', x: 2900, y: GAME_HEIGHT - 420, width: 50, height: 50 },
    ],
    enemies: [
        { type: 'base', x: 550, y: 310, width: 50, height: 50, originalX: 550, originalY: 310 },
        { type: 'base', x: 1300, y: 310, width: 50, height: 50, originalX: 1300, originalY: 310 },
        { type: 'flyer', x: 960, y: 450, width: 60, height: 40, originalX: 960, originalY: 450 },
        { type: 'jumper', x: 100, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 100, originalY: GAME_HEIGHT - 80 },
        { type: 'jumper', x: 300, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 300, originalY: GAME_HEIGHT - 80 },
        { type: 'jumper', x: GAME_WIDTH - 150, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: GAME_WIDTH - 150, originalY: GAME_HEIGHT - 80 },
        { type: 'jumper', x: GAME_WIDTH - 350, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: GAME_WIDTH - 350, originalY: GAME_HEIGHT - 80 },
        { type: 'base', x: 800, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 800, originalY: GAME_HEIGHT - 80 },
        { type: 'base', x: 1020, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 1020, originalY: GAME_HEIGHT - 80 },
        // New section
        { type: 'jumper', x: 2500, y: GAME_HEIGHT - 240, width: 50, height: 50, originalX: 2500, originalY: GAME_HEIGHT - 240 },
        { type: 'base', x: 2600, y: GAME_HEIGHT - 80, width: 50, height: 50, originalX: 2600, originalY: GAME_HEIGHT - 80 },
        { type: 'flyer', x: 2800, y: 200, width: 60, height: 40, originalX: 2800, originalY: 200 },
    ],
  },
];