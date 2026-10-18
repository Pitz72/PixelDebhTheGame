# Strumenti di sviluppo (usati nelle sessioni di lavoro)

Scritti per Windows 11 + PowerShell + WSL2 Ubuntu. Alcuni script contengono ancora percorsi della cartella temporanea della sessione in cui sono nati (variabile `$scr` / `OUT`): adattali prima di usarli.

- `cdp2.mjs` / `cdp_frames.mjs`: leggono console, `window.__pdPerf` e `window.__pdPlayer` dall'app Tauri avviata con `--remote-debugging-port`, e catturano strisce di fotogrammi che seguono Debh.
- `copy_exe.mjs`: copia l'exe di release in `exe/PixelDebh-<versione>.exe` (cartella nella root, ignorata da git), pronto da mandare a qualcuno. Si usa con `npm run exe` (compila e copia).
- `shot.ps1`, `crop.ps1`, `strip.ps1`: screenshot di una finestra (anche WSLg con `-ProcName msrdc`), ritaglio, striscia di fotogrammi.
- `wsl_setup.sh`, `wsl_update_build.sh`, `wsl_quick.sh`, `wsl_launch2.sh`: preparare Rust/Node in WSL, ricostruire i pacchetti Linux e avviare l'app con WSLg e xdotool.

## Scorciatoie e sonda di prova (non sono nel README di proposito)

- **Tasti di sviluppo**, solo con `npm run dev` (nelle build di rilascio non esistono: il codice e' tolto in compilazione): `0` God Mode, `L` salta il livello, `9` salta al boss finale; la pausa elenca i tre tasti. Una partita con il God Mode non assegna trofei.
- **La sonda `window.__pdGame`** (`load(livello)`, `god(true)`, `warp(x, y)`, `bossHp(n)`, `state()`, `items()`, `goal()`, `movers()`, `springs()`, `stats()`, `trophies()`) serve agli script in questa cartella contro la build di rilascio. Dalla 1.18.2 **nella build di rilascio non c'e' piu' a meno che la pagina non sia stata sbloccata** (`services/devAccess.ts`): prima di avviare la partita, dalla console o con CDP (`Runtime.evaluate`), `window.__pdUnlock = 'debh-sonda-retro-2026'`. Nella build di sviluppo c'e' sempre. Non e' una serratura (il codice e' aperto): serve a non averla a portata di console di un giocatore qualsiasi. Nel bundle resta solo l'impronta (FNV-1a) della frase.
- Le sonde che **misurano soltanto** (`__pdPerf`, `__pdPlayer`, `__pdLoadMs`, `__pdRenderError`, `__pdAudio`) restano sempre attive: non cambiano il gioco.
- L'app Tauri di rilascio non ha gli strumenti per sviluppatori del browser (la funzione `devtools` di Tauri non e' attiva in `Cargo.toml`) e il menu del tasto destro e' bloccato (`index.tsx`).

## Audio (`tools/audio/`)

- `export-sfx.ts`: scrive ogni effetto in WAV e stampa le misure. Si lancia con esbuild + node: `npx esbuild tools/audio/export-sfx.ts --bundle --platform=node --format=esm --outfile=<tmp>/export-sfx.mjs` poi `node <tmp>/export-sfx.mjs <cartella-uscita>`.
- `prepare_music.py`: prepara i brani generati (loop, loudness, OGG, manifest). Vedi `docs/MUSIC_BRIEF.md`.
- Nell'app avviata con `--remote-debugging-port` la sonda `window.__pdAudio` (`state()`, `time()`, `voices()`, `music()`, `level()`) mostra cosa fa il motore audio. Con `--autoplay-policy=no-user-gesture-required` in `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS` il contesto parte anche senza un clic vero. I tasti sintetici vanno inviati a `document.body`, non a `window` (altrimenti non passano dalla fase di cattura come quelli reali).

## Labirinto

- `maze_walk.ts`: guida Debh nel labirinto dell'app in esecuzione (build di release con porta di debug): salta al livello 13 con `window.__pdGame.load(12)`, segue il percorso migliore con eventi di tastiera, raccoglie tutto ed esce, e stampa fps e CPU da `window.__pdPerf`. Si compila con esbuild come `export-sfx.ts` (vedi il commento in testa al file). `window.__pdGame` offre anche `god(true)` e `state()` (livello, vite, oggetti, tempo, posizione, zoom).

