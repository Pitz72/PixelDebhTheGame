# Strumenti di sviluppo (usati nelle sessioni di lavoro)

Scritti per Windows 11 + PowerShell + WSL2 Ubuntu. Alcuni script contengono ancora percorsi della cartella temporanea della sessione in cui sono nati (variabile `$scr` / `OUT`): adattali prima di usarli.

- `cdp2.mjs` / `cdp_frames.mjs`: leggono console, `window.__pdPerf` e `window.__pdPlayer` dall'app Tauri avviata con `--remote-debugging-port`, e catturano strisce di fotogrammi che seguono Debh.
- `shot.ps1`, `crop.ps1`, `strip.ps1`: screenshot di una finestra (anche WSLg con `-ProcName msrdc`), ritaglio, striscia di fotogrammi.
- `wsl_setup.sh`, `wsl_update_build.sh`, `wsl_quick.sh`, `wsl_launch2.sh`: preparare Rust/Node in WSL, ricostruire i pacchetti Linux e avviare l'app con WSLg e xdotool.
