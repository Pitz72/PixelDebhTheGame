
# PixelDebh: Retro-Rescue!

![Gameplay Screenshot](gameplay.png) <!-- I can't add an image, but this is a good placeholder -->

A 2D retro platformer adventure where you control PixelDebh to capture and launch enemies, collect retro items, and clear challenging levels. This game is built with React, TypeScript, and TailwindCSS, running in a browser environment with a sharp, pixel-perfect aesthetic.

## Gameplay

The core mechanic of **PixelDebh: Retro-Rescue!** is the ability to capture enemies. Once an enemy is captured, you can launch it as a projectile to defeat other enemies.

-   **Capture:** Get close to an enemy and press the capture button.
-   **Launch:** While holding a captured enemy, press the button again to launch it in the direction you're facing.
-   **Double Jump:** Press jump again in mid-air to reach higher platforms!
-   **Stun Enemies:** Jump and hit a platform from below to stun any enemies walking on top of it, giving you a strategic advantage!
-   **Goal:** To complete a level, you must first collect all the retro-themed items (joysticks, floppy disks, cartridges). Once all items are collected, a goal door at the far right of the level becomes active. Reach the door to advance!
-   **Boss Battles:**
    -   **Cyclops Frog (Level 4):** Face off against a mighty floating frog! It moves unpredictably and launches spinning CD-ROMs. Use your special shooting ability (`Left Shift`) to win this dynamic encounter. You can aim in 8 directions by holding the movement keys.
    -   **LeGallineNellOcchi (Level 8):** A surreal giant eye with a chicken for a pupil. It moves in a hypnotic figure-8 pattern and unleashes bursts of egg projectiles. Timing and precision are key to avoiding the spread attacks.
    -   **CapocciaNelBuio (Level 12):** The ultimate challenge. Gravity is disabled, turning the game into a space shooter. This giant boss fades in and out of the darkness, teleporting around the arena and launching rapid-fireballs.

## Features

-   **New: Standalone & Optimized:** The game engine has been refactored for maximum performance and is now completely standalone, with no external API dependencies.
-   **Custom Pixel Art Intro:** A unique, animated intro sequence featuring a custom pixel-art avatar of the protagonist surrounded by orbiting gaming gear (webcam, cat, phone), set against a synthwave grid horizon.
-   **Structured Game Progression:** A full adventure across 13 levels, with a carefully designed difficulty curve. Each standard level is progressively longer than the last, mixing horizontal and vertical platforming challenges.
-   **Gradual Enemy Introduction:** New enemy types are introduced gradually, giving players time to learn their patterns:
    -   **Globby (Base):** The standard ground enemy.
    -   **Hoppy (Jumper):** An unpredictable jumping foe.
    -   **Flappy (Flyer):** Adds an aerial threat to the mix.
    -   **Bomby (Bomber):** A static enemy that lobs arcing bombs, controlling areas and forcing the player to stay mobile.
    -   **Ghosty (Phaser):** A persistent threat that slowly follows the player, passing through walls and platforms.
-   **Arcade High Score Leaderboard:** Compete for the top score! If you make it into the top 5, the game features a fully immersive highscore entry screen where you select your initials by scrolling through the alphabet, just like on a real arcade cabinet. The leaderboard is pre-filled with default scores.
-   **Arcade-Style Attract Mode:** The title screen simulates a classic arcade cabinet, automatically and seamlessly alternating between the "Character Parade" intro and the high score leaderboard. The player can press Enter on either screen to start the game. The chiptune theme plays continuously throughout, creating a fluid attract mode experience.
-   **Dynamic Background Music:** Three distinct musical themes (Adventure, Industrial, Ethereal) that change as you progress through the world, plus tense boss themes.
-   **Dynamic Arcade-Style Intro:** A vibrant, animated intro sequence to welcome players.
-   **Unique Boss Encounters:** Multiple bosses with distinct AI behaviors (Random Float vs Figure-8 vs Teleport/Fade) and attack patterns.
-   Classic 2D platforming action with a consistent pixel-perfect look
-   Vast, horizontally scrolling levels with a dynamic camera system
-   Immersive parallax background for a sense of depth
-   Special power-ups: Speed Boost, Shield, and the powerful Super Throw!
-   Programmatically generated chiptune sound effects, jingles, and music
-   Enhanced visual feedback (screen flash, fade-to-black transitions, particle effects)
-   Dynamic extra life system that rewards high scores (up to a maximum of 3 lives)
-   Score tracking and a lives system
-   Enlarged HUD with level names for better readability

## Controls

-   **Move Left:** `A` or `Left Arrow`
-   **Move Right:** `D` or `Right Arrow`
-   **Jump:** `Spacebar` (Press twice for Double Jump)
-   **Capture / Launch:** `C` or `X`
-   **Shoot (Boss Battles Only):** `Left Shift` (Hold movement keys to aim in 8 directions)
-   **Pause:** `ESC`

## Developer Features

-   **God Mode:** Press `0` on the number pad to toggle invincibility for testing purposes. An indicator will appear on the HUD.
-   **Boss Skip:** Press `9` to jump directly to the final boss encounter for testing.

## Built With

-   **React:** For the component-based UI and game structure.
-   **TypeScript:** For strong typing and code quality.
-   **TailwindCSS:** For styling the UI components.

---
*This project is a demonstration of building a simple game using web technologies.*