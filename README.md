# PixelDebh: Retro-Rescue!

![Gameplay Screenshot](gameplay.png) <!-- I can't add an image, but this is a good placeholder -->

A 2D retro platformer adventure where you control PixelDebh to capture and launch enemies, collect retro items, and clear challenging levels. This game is built with React, TypeScript, and TailwindCSS, running in a browser environment with a sharp, pixel-perfect aesthetic.

## Gameplay

The core mechanic of **PixelDebh: Retro-Rescue!** is the ability to capture enemies. Once an enemy is captured, you can launch it as a projectile to defeat other enemies.

-   **Capture:** Get close to an enemy and press the capture button.
-   **Launch:** While holding a captured enemy, press the button again to launch it in the direction you're facing.
-   **Stun Enemies:** Jump and hit a platform from below to stun any enemies walking on top of it, giving you a strategic advantage!
-   **Goal:** Collect all the retro-themed items (joysticks, floppy disks, cartridges) in each level to advance to the next.
-   **Boss Battle:** Face off against the mighty Cyclops Frog! In an epic showdown, the boss now floats with unpredictable movement and attacks by launching spinning CD-ROMs at you. Use your special shooting ability (Left Shift) to win this dynamic encounter.

## Features

-   **Game Progression:** A full adventure across 13 levels, including multiple boss battles and a final challenge.
-   **Arcade High Score Leaderboard:** Compete for the top score! At the end of the game, enter your initials if you make it into the top 5, just like the old arcade classics. The leaderboard is pre-filled with default scores.
-   **Arcade-Style Attract Mode:** The title screen simulates a classic arcade cabinet, automatically and seamlessly alternating between the "Character Parade" intro and the high score leaderboard. The player can press Enter on either screen to start the game. The chiptune theme plays continuously throughout, creating a fluid attract mode experience.
-   **Dynamic Background Music:** Each level features a dynamic chiptune soundtrack. A pleasant, upbeat theme accompanies standard levels, while a tense, ominous track plays during boss battles to heighten the drama.
-   **Dynamic Arcade-Style Intro:** A vibrant, animated intro sequence to welcome players.
-   **Epic Boss Battles:** Reworked boss battles with a floating, unpredictable boss that throws targeted projectiles.
-   Classic 2D platforming action with a consistent pixel-perfect look
-   Vast, horizontally scrolling levels with a dynamic camera system
-   Immersive parallax background for a sense of depth
-   Three unique enemy types: Globby, Hoppy (jumper), and Flappy (flyer)
-   Special power-ups: Speed Boost, Shield, and the powerful Super Throw!
-   Programmatically generated chiptune sound effects, jingles, and music
-   Enhanced visual feedback (screen flash, fade-to-black transitions)
-   Dynamic extra life system that rewards high scores (up to a maximum of 3 lives)
-   Score tracking and a lives system
-   Enlarged HUD with level names for better readability

## Controls

-   **Move Left:** `A` or `Left Arrow`
-   **Move Right:** `D` or `Right Arrow`
-   **Jump:** `W`, `Up Arrow`, or `Spacebar`
-   **Capture / Launch:** `C` or `X`
-   **Shoot (Boss Battle Only):** `Left Shift`

## Developer Features

-   **God Mode:** Press `0` on the number pad to toggle invincibility for testing purposes. An indicator will appear on the HUD.

## Built With

-   **React:** For the component-based UI and game structure.
-   **TypeScript:** For strong typing and code quality.
-   **TailwindCSS:** For styling the UI components.
-   **Gemini API:** To assist in development and asset creation.

---
*This project is a demonstration of building a simple game using web technologies.*