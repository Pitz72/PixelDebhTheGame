# Strumenti di sviluppo (usati nelle sessioni di lavoro)

Scritti per Windows 11 + PowerShell + WSL2 Ubuntu. Alcuni script contengono ancora percorsi della cartella temporanea della sessione in cui sono nati (variabile `$scr` / `OUT`): adattali prima di usarli.

- `cdp2.mjs` / `cdp_frames.mjs`: leggono console, `window.__pdPerf` e `window.__pdPlayer` dall'app Tauri avviata con `--remote-debugging-port`, e catturano strisce di fotogrammi che seguono Debh.
- `shot.ps1`, `crop.ps1`, `strip.ps1`: screenshot di una finestra (anche WSLg con `-ProcName msrdc`), ritaglio, striscia di fotogrammi.
- `wsl_setup.sh`, `wsl_update_build.sh`, `wsl_quick.sh`, `wsl_launch2.sh`: preparare Rust/Node in WSL, ricostruire i pacchetti Linux e avviare l'app con WSLg e xdotool.

## Audio (`tools/audio/`)

- `export-sfx.ts`: scrive ogni effetto in WAV e stampa le misure. Si lancia con esbuild + node: `npx esbuild tools/audio/export-sfx.ts --bundle --platform=node --format=esm --outfile=<tmp>/export-sfx.mjs` poi `node <tmp>/export-sfx.mjs <cartella-uscita>`.
- `prepare_music.py`: prepara i brani generati (loop, loudness, OGG, manifest). Vedi `docs/MUSIC_BRIEF.md`.
- Nell'app avviata con `--remote-debugging-port` la sonda `window.__pdAudio` (`state()`, `time()`, `voices()`, `music()`, `level()`) mostra cosa fa il motore audio. Con `--autoplay-policy=no-user-gesture-required` in `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS` il contesto parte anche senza un clic vero. I tasti sintetici vanno inviati a `document.body`, non a `window` (altrimenti non passano dalla fase di cattura come quelli reali).

## Labirinto

- `maze_walk.ts`: guida Debh nel labirinto dell'app in esecuzione (build di release con porta di debug): salta al livello 13 con `window.__pdGame.load(12)`, segue il percorso migliore con eventi di tastiera, raccoglie tutto ed esce, e stampa fps e CPU da `window.__pdPerf`. Si compila con esbuild come `export-sfx.ts` (vedi il commento in testa al file). `window.__pdGame` offre anche `god(true)` e `state()` (livello, vite, oggetti, tempo, posizione, zoom).

