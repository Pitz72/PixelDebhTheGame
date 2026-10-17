
# PixelDebh: Retro-Rescue!

![Gameplay Screenshot](gameplay.png) <!-- I can't add an image, but this is a good placeholder -->

A 2D retro platformer adventure where you control PixelDebh to capture and launch enemies, collect retro items, and clear challenging levels. Built with React and TypeScript.

## Gameplay

The core mechanic of **PixelDebh: Retro-Rescue!** is the ability to capture enemies. Once an enemy is captured, you can launch it as a projectile to defeat other enemies.

-   **Capture:** Get close to an enemy and press the capture button.
-   **Launch:** While holding a captured enemy, press the button again to launch it in the direction you're facing.
-   **Double Jump:** Press jump again in mid-air to reach higher platforms!
-   **Stun Enemies:** Jump and hit a platform from below to stun any enemies walking on top of it, giving you a strategic advantage!
-   **Goal:** To complete a level, you must first collect all the retro-gaming items (joysticks, floppy disks and cartridges, then cassettes, arcade tokens, an Atari 2600, an Amiga 500, CRT televisions, CD-ROMs, an NES pad and a Mega Drive console, which arrive a few at a time as the game goes on). Once all items are collected, a goal door at the far right of the level becomes active. Reach the door to advance!
-   **Boss Battles:**
    -   **Cyclops Frog (Level 4):** Face off against a mighty floating frog! It moves unpredictably and launches spinning CD-ROMs. Use your special shooting ability (`Left Shift`) to win this dynamic encounter. You can aim in 8 directions by holding the movement keys.
    -   **LeGallineNellOcchi (Level 7):** A surreal giant eye with a chicken for a pupil. It moves in a hypnotic figure-8 pattern and unleashes bursts of egg projectiles. Timing and precision are key to avoiding the spread attacks. **Note:** For this endurance battle, you borrow extra lives equal to half the boss's health; they are handed back when the boss falls.
    -   **CapocciaNelBuio (Level 11):** The ultimate boss. Gravity is disabled, turning the game into a space shooter. This giant boss fades in and out of the darkness, teleporting around the arena and launching rapid-fireballs. Activate **Rapid Fire** mode during this battle!

## Features

-   **Infinite Loop (New Game+):** Beat the game to enter the next Loop! Each loop increases enemy and projectile speed by 20%. Your score and lives carry over; on the victory screen press `Enter` for the next loop or `Esc` to bank your score on the leaderboard.
-   **Vertical Scrolling (v0.3.5):** The camera system now fully supports vertical scrolling, essential for the massive new Zero-G Labyrinth level.
-   **The Labyrinth:** The last level before the final stage is a real maze in the spirit of the Atari 2600: corridors on a grid, dead ends and loops, built from a fixed seed (`mazeGen.ts`). The camera is zoomed in (1.3x) on the player so you never see the whole map. Move in four directions with no inertia, collect **every** item on the map to open the exit, avoid the enemies that patrol the corridors, and beat the countdown (17 minutes at first). The labyrinth is always the same, but every LOOP brings a fifth more walkers and a minute less on the clock. Its exit leads to the final stage.
-   **The Collector's Vault (final stage):** Behind the labyrinth's exit the three bosses wait for Debh **together**, in a museum hall whose shelves are full of giant retro consoles, each with a quarter of the life it has in its own level. Debh moves freely and arrives with all her lives and a shield; the game is won when all three have fallen.
-   **Zero-G Mechanics:** The labyrinth, the last boss's arena and the final stage feature gravity-free movement: Debh walks in every direction, up and down included.
-   **Revamped Level Design:** Advanced levels (The Gauntlet, The Ascent, The Drop) have been audited and redesigned to provide a fair, populated, and challenging experience.
-   **New: Standalone & Optimized:** The game engine has been refactored for maximum performance and is now completely standalone, with no external API dependencies.
-   **Custom Pixel Art Intro:** A unique, animated intro sequence featuring a custom pixel-art avatar of the protagonist surrounded by orbiting gaming gear (webcam, cat, phone), set against a synthwave grid horizon.
-   **Structured Game Progression:** A full adventure across 14 levels: three worlds of three levels and a boss each, then the labyrinth and the final stage with the three bosses together, with a carefully designed difficulty curve. Each standard level is progressively longer than the last, mixing horizontal and vertical platforming challenges.
-   **Gradual Enemy Introduction:** New enemy types are introduced gradually, giving players time to learn their patterns:
    -   **Globby (Base):** The standard ground enemy.
    -   **Hoppy (Jumper):** An unpredictable jumping foe.
    -   **Flappy (Flyer):** Adds an aerial threat to the mix.
    -   **Bomby (Bomber):** A static enemy that lobs arcing bombs, controlling areas and forcing the player to stay mobile.
    -   **Ghosty (Phaser):** A persistent threat that slowly follows the player, passing through walls and platforms.
-   **Arcade High Score Leaderboard:** Compete for the top score! If you make it into the top 5, the game features a fully immersive highscore entry screen where you select your initials by scrolling through the alphabet, just like on a real arcade cabinet. The leaderboard is pre-filled with default scores.
-   **Arcade-Style Attract Mode:** The title screen simulates a classic arcade cabinet, automatically and seamlessly alternating between the "Character Parade" intro and the high score leaderboard. The player can press Enter on either screen to start the game. The chiptune theme plays continuously throughout, creating a fluid attract mode experience.
-   **Dynamic Background Music:** A track for each world (Adventure, Industrial, Ethereal), one for each of the three bosses, and one each for the title screen, the leaderboard, victory and game over. The music is loaded from `public/audio/music/` (see `docs/MUSIC_BRIEF.md`); a track without a file falls back to a short built-in loop, so the game is never silent.
-   **Continue, level select and difficulty:** the game saves where you were at the start of each level ("Continue" in the title menu takes it up again, trophy counts included); the levels you have reached can be started again from the level select (practice: no leaderboard, no trophies); Easy (5 lives, slower enemies, weaker bosses), Normal and Hard (2 lives, faster enemies, tougher bosses) are chosen in Options > Game.
-   **English and Italian:** the whole interface is in both (the arcade shouts, level and boss names and the HUD labels stay in English); the language follows the system until you choose one in Options.
-   **Trophies:** 22 trophies in four kinds (normal, rare, hard and completion), from clearing level 1 to beating the final stage without losing a life. A banner with a jingle announces each one in the game; `T` opens the full list on the title screen and in the pause menu. They are saved with the other settings (`save.json` in the desktop app). A run played with the developer's god mode earns none.
-   **Chain of K.O.s:** defeats that follow each other within four seconds build a chain: every third one raises the multiplier of the points (x2, x3, x4, up to x5). A COMBO pill in the HUD shows the chain and the time left on it; a hit breaks it.
-   **Boss phases:** below half of its life a boss attacks and moves faster, and faster again below a quarter; a "PHASE n!" banner says so.
-   **Enemy tells:** Hoppy crouches before it jumps, Bomby swells before it lobs a bomb, the frog and the eye light up before they fire, so every attack can be read.
-   **Guide arrow:** when only three collectibles are left and the nearest is far, an arrow at the edge of the screen points the way (Options > Game, can be turned off).
-   **Springs and moving platforms:** green spring pads throw Debh about 650 px up (twice a jump) and lifts and ferries carry her across the sky. They only lead to optional shelves with a power-up (levels 3, 5, 7 and 9), never to something the level needs.
-   **Dynamic Arcade-Style Intro:** A vibrant, animated intro sequence to welcome players.
-   **Unique Boss Encounters:** Multiple bosses with distinct AI behaviors (Random Float vs Figure-8 vs Teleport/Fade) and attack patterns.
-   Classic 2D platforming action with a consistent pixel-perfect look
-   Vast, horizontally scrolling levels with a dynamic camera system
-   Immersive parallax background for a sense of depth
-   Special power-ups: Speed Boost, Shield, and the powerful Super Throw!
-   Chiptune sound effects and jingles synthesised by the code itself (pulse, triangle and noise channels, `audio/`), with an audio settings panel (`O`: master, music and effects volume, mute)
-   Enhanced visual feedback (screen flash, fade-to-black transitions, particle effects)
-   Dynamic extra life system that rewards high scores (up to a maximum of 3 lives)
-   Score tracking and a lives system
-   Enlarged HUD with level names for better readability

## Controls

The keys below are the defaults; every control can be given other keys (two each) in **Options > Controls**.

-   **Move Left:** `A` or `Left Arrow`
-   **Move Right:** `D` or `Right Arrow`
-   **Jump:** `Spacebar` (Press twice for Double Jump)
-   **Capture / Launch:** `C` or `X`
-   **Shoot (Boss Battles / Zero-G):** `Left Shift` (Hold movement keys to aim in 8 directions)
-   **Pause:** `ESC` (the game also pauses by itself when the window loses focus)
-   **Mute:** `M`
-   **Options (audio, graphics, controls, language, accessibility):** `O` on the title screen and in the pause menu, or from the menus

**Gamepad** (the standard layout: Xbox, PlayStation and most modern pads; it works in the menus too): `A` jump (and confirm), `X` or `Y` capture / launch, `B`, `RB`, `RT` or `LT` shoot, D-pad or left stick move and aim, `Start` pause, `B` back.
-   **Trophies:** `T` on the title screen and in the pause menu (also in the menus)
-   **Update:** `U` on the title screen when a new version is announced (updates an installed copy, opens the download page for a portable one)
-   **Fullscreen / window:** `F`, `F11` or `Alt+Enter`
-   **Graphics quality:** `Q` switches between High (dynamic lights, bloom) and Low; the game drops to Low by itself if it cannot hold 40 fps
-   **Performance overlay:** `F3` (renderer, fps, quality, particle count)

## Start-up

The game opens on half a second of black, then the animated logo of **Runtime Multimedia** (a TV that turns on and writes the mark; code and score imported from *Il Relitto Silente*, `intro/`), half a second of black, the animated intro of the Pixel Debh channel (`public/intro/pixeldebh-intro.webm`, 28 s, rendered from the Remotion project), a note on how the game was made (the work of the author, with AI as a tool) and then the game's own title. Esc, Enter, Space or a click skip each of them. The title screens carry the credit **By Simone Pizzi - Runtime Multimedia**.

## Developer Features

Available only when running `npm run dev` (they are compiled out of release builds):

-   **God Mode:** Press `0` to toggle invincibility.
-   **Boss Skip:** Press `9` to jump directly to the last boss (Level 12).
-   **Level Skip:** Press `L` to skip the current level instantly.

## Development

```bash
npm install
npm run dev        # Vite dev server
npm test           # engine, input and level-data tests (Vitest)
npm run typecheck  # tsc --noEmit
npm run build      # production bundle (everything is bundled locally, no CDN, works offline)
```

### Desktop app (Tauri v2, Windows and Linux)

The game also ships as a native desktop app (`src-tauri/`). It needs [Rust](https://rustup.rs) and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS (on Windows: Visual Studio Build Tools with the C++ workload and WebView2; on Linux: `libwebkit2gtk-4.1-dev` and friends).

```bash
npm run desktop                       # run the app in dev mode (hot reload)
npx tauri build --bundles nsis        # Windows installer  -> src-tauri/target/release/bundle/nsis
npx tauri build --bundles deb,appimage  # Linux packages (build this on Linux)
```

- High scores and settings (mute and volumes) are saved in `save.json` in the app data folder (`%APPDATA%\com.pixeldebh.retrorescue` on Windows, `~/.local/share/com.pixeldebh.retrorescue` on Linux). In a browser they fall back to `localStorage`.
- Linux packages: `.deb`, `.rpm` and an `.AppImage`. The AppImage bundles GStreamer, which WebKitGTK needs for Web Audio; the `.deb` depends on the GStreamer base and good plugins.
- Linux status: build, tests, launch (fullscreen), keyboard input and save file were checked on Ubuntu 24.04 (WSL2 with WSLg); the WebGL renderer runs on WebKitGTK there, but WSLg has no GPU acceleration (software GL, about 23 fps at 1080p, so the game switched itself to Low quality). It has not been tried yet on a native desktop with a real GPU, and audio has not been listened to. If the window comes up blank (seen with some NVIDIA/Wayland setups on WebKitGTK), the usual workaround is to start it with `WEBKIT_DISABLE_DMABUF_RENDERER=1`; that was not needed in the checks above.
- The app always starts **fullscreen**, as a console-style desktop game should. `F`, `F11` or `Alt+Enter` drop to a 16:9 window (and back) for the current session only; it is not remembered. `npm run desktop` (dev mode) starts windowed so it does not take over your screen while you work.
- **Releases and updates.** The `Build and release` GitHub workflow (`.github/workflows/release.yml`) never runs by itself: it starts only when you run it from the Actions tab, and builds the Windows installer and portable exe and the Linux `.deb`, `.rpm` and AppImage (a draft release by default). The installed game (and the AppImage) look for a newer release on GitHub when the title screen first shows and update themselves with `U`; the portable exe and the Linux packages only show a notice with the link. How to publish a version, and the signing key it needs: `docs/RILASCIO.md`.

Rendering is done by PixiJS (WebGL) in `renderer/`: parallax backdrops per world, dynamic 2D lights (an ambient light map multiplied over the scene, with soft lights on the player, items, enemies, projectiles, bosses and explosions), bloom, GPU particles, and interpolation between simulation steps so motion stays smooth on 144 Hz screens. The existing SVG art is rasterised into textures at start-up. If WebGL is not available the game falls back to the original DOM renderer (`components/DomScene.tsx`) and says so on screen for a few seconds (F3 shows the reason); adding `?dom` to the URL forces it for testing. The desktop app runs with a strict Content-Security-Policy, so Pixi is loaded with its CSP-safe build (`pixi.js/unsafe-eval`, no `eval` needed).

### The character

Debh is a 2D skeleton (`characters/debh/`): the head is the one vectorised from the channel logo (headphones, brown bob, the face drawn by hand on top so it can wink, grin and wince), the body is the profile rig from the animated intro. Her parts are baked from SVG into textures at start-up (~90 ms) and assembled by `DebhRig` in PixiJS; `DebhAnimator` poses her procedurally from what she is doing, so every move blends smoothly at any frame rate: idle with her gamepad and an occasional wink, a speed-driven run cycle, jump / apex / fall / landing crouch, a somersault on the double jump, carrying a captured enemy, the throw, aiming the gamepad like a blaster in 8 directions (shots leave from the pad), a hurt reaction, and a thumbs-up at the end of a level. In the zero-G stages (the last boss arena and the labyrinth) "zero gravity" means free movement in every direction, not flight: she keeps the same upright idle and run strides, whichever way she goes. She is 122 px tall on screen (was 74), with a 54x90 hitbox; level spawns are shifted so her feet stay where the levels put them. In the labyrinth she is drawn at 80% and collides with a low 44x56 footprint at her feet (the sprite may overhang the walls above her), so there is room to dodge walkers in a 200 px corridor. `npm run dev` and then `/character-sheet.html` shows every pose (add `?big=0,3,17` to enlarge some).

The game simulation lives in `engine/` as plain TypeScript with a fixed 60 Hz timestep and no DOM or audio access: it emits events (sounds, music, game over) that `GameScreen.tsx` forwards to the UI and to `services/soundService.ts`. That is what the automated tests exercise.

## Built With

-   **React:** For the component-based UI and game structure.
-   **TypeScript:** For strong typing and code quality.
-   **TailwindCSS (v3, compiled locally):** For styling the UI components.
-   **Vitest:** For the engine tests.

---
*This project is a demonstration of building a simple game using web technologies.*
