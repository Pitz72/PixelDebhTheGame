# Prompt per la prossima sessione (copia e incolla)

```
Riprendiamo il lavoro su PixelDebh: Retro-Rescue! (repo C:\Users\Utente\Documents\GitHub\PIXELDEBH, branch main, remoto Pitz72/PixelDebhTheGame).
Leggi prima: docs/NEXT_SESSION.md, docs/AUDIT.md, docs/MUSIC_BRIEF.md, README.md, log/1.3.0.md e la memoria del progetto.

Stato: Fasi 1-4 pubblicate su main (v1.2.0); Fase 5 audio (v1.3.0); livello mancante e riordino (v1.4.0); labirinto vero con zoom (v1.5.0); sei nuovi collezionabili (v1.6.0). Fase 5 (audio) fatta e pubblicata su main (v1.3.0, commit 442fc1b): motore audio, 24 effetti sintetici, pannello `O`, caricamento musica da file con loop e crossfade, strumento tools/audio/prepare_music.py. Musica: 8 brani di Lyria inseriti (title, 3 mondi, 3 boss, highscore; nessuno ascoltato da Claude). Vittoria e game over usano i jingle sintetici di audio/sfx.ts: i pezzi da 59 s di Lyria sono stati scartati dall'utente.
- Fase 1: motore di gioco puro in engine/ (timestep fisso 60 Hz) + bug gravissimi/gravi corretti + 76 test (npm test).
- Fase 2: app desktop Tauri v2 (src-tauri/), sempre a schermo intero, salvataggi in save.json, installatore Windows NSIS, pacchetti Linux (deb/rpm/AppImage) verificati in WSL2.
- Fase 3: renderer PixiJS/WebGL (renderer/) con luci dinamiche, bloom, particelle, parallasse, interpolazione; il vecchio DOM resta come ripiego.
- Fase 4: Debh vettoriale HD fedele al logo (characters/debh/), alta 122 px, hitbox 54x90, animazioni procedurali complete.

Richieste fisse dell'utente: gioco desktop Windows+Linux che parte SEMPRE a schermo intero; stile vettoriale HD (niente pixel art); musiche e suoni retrogaming; trovare e correggere criticita' (gravissime/gravi/medie/lievi).

Da fare ora, in ordine (decisioni dell'utente del 2026-10-17, piano completo nella memoria del progetto):
1. Boss ridisegnati. FATTO IL CONCEPT, in attesa dell'approvazione dell'utente: `components/bosses/FrogArt.tsx` (Rana Ciclope: sfera lucida = occhio ciclope con pupilla a fessura e una rana pallida dentro, bordo che sfuma sul rosso, braccine esili e zampette palmate; due varianti: A arti verdi con giunture rosse, B piu' rossa con arti rosso mattone), `components/bosses/ChickenEyeArt.tsx` (occhio con iride a fibre, la gallina che passeggia nella pupilla, lente d'ingrandimento, palpebra per il battito) e la pagina di prova `boss-sheet.html` (con `npm run dev`; per un'immagine a piena risoluzione: `msedge --headless=new --window-size=1500,960 --screenshot=out.png http://localhost:3000/boss-sheet.html?size=230`). Resta da fare dopo l'approvazione: scegliere la variante, cuocere le parti (corpo, 2 braccia, 2 gambe; occhio, gallina) in texture, un `BossView` a parti con animazione procedurale (braccia e gambe che oscillano con la velocita' del boss, la gallina che cammina avanti e indietro nella pupilla girandosi), sostituire i vecchi `FrogBoss.tsx` e `ChickenEyeBoss.tsx` (usati anche dal ripiego DOM) tenendo hitbox 320x320 e 300x300. CapocciaNelBuio NON si tocca.
2. I tre boss anche dentro il labirinto, in stanze chiuse (idea: ognuno custodisce un collezionabile necessario al portale); il motore oggi gestisce un boss solo.
3. Sistema di trofei: almeno 15, tra normali, rari, difficili e di completamento.
4. Il resto: Fase 6 meccaniche (guida collezionabili, combo, telegrafi nemici, boss a fasi, molle, piattaforme mobili), nemici e sfondi HD, verifiche in gioco (capriola, gravita' zero, danno, pollice alzato, 4K/144 Hz, Linux nativo, classifica in Tauri), rifinitura (gamepad/rimappa tasti, localizzazione, firma installatore, npm audit, audit M4,M7,M8,L4,L8,L9,L10).
Audio ancora da far ascoltare all'utente (log/1.3.0.md e memoria del progetto: loop dei 4 brani con dissolvenza lunga, bilanciamento, Orbital_Lockdown non assegnato, licenza).

Regole di lavoro: testa SEMPRE l'exe di release (la CSP stretta nasconde problemi che `tauri dev` non mostra); strumenti di test in tools/dev/ (CDP, screenshot, strisce di fotogrammi, script WSL); regola fissa dell'utente: ogni fase si chiude con commit E push su main (nessuna conferma da chiedere), con tutte le verifiche fatte prima; merge di altri rami e force push solo se l'utente lo chiede; dichiara cio' che non hai potuto verificare (audio, FPS su hardware diverso).
```

## Comandi utili

```bash
npm install
npm run dev            # Vite
npm run desktop        # app Tauri in finestra (dev), hot reload
npm test               # 76 test (motore, input, dati livelli)
npm run typecheck
npx tauri build --no-bundle        # exe di release (Windows)
npx tauri build --bundles nsis     # installatore Windows
```

- Pagina delle pose: `npm run dev` poi `/character-sheet.html` (`?big=0,3,17` ingrandisce).
- Tasti di gioco: `F`/`F11`/`Alt+Enter` finestra, `M` muto, `Q` qualita', `F3` prestazioni. Tasti debug solo in dev: `0` god mode, `L` salta livello, `9` boss finale.
- Test con debug remoto WebView2: avviare l'app con `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9333`, poi `node tools/dev/cdp2.mjs 9333 "<js>" 3` (console, `window.__pdPerf`, `window.__pdPlayer`).

## Dove sta cosa

- `engine/` simulazione pura; `renderer/` PixiJS; `characters/debh/` personaggio; `components/` HUD e schermate React; `services/` audio, salvataggi, piattaforma; `src-tauri/` guscio desktop; `tests/` e `engine/*.test.ts`.
- Audio attuale (da sostituire in Fase 5): `services/soundService.ts` (oscillatori con `setTimeout`, melodie di 6-10 note).
