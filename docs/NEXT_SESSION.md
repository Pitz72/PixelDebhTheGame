# Prompt per la prossima sessione (copia e incolla)

```
Riprendiamo il lavoro su PixelDebh: Retro-Rescue! (repo C:\Users\Utente\Documents\GitHub\PIXELDEBH, branch main, remoto Pitz72/PixelDebhTheGame).
Leggi prima: docs/NEXT_SESSION.md, log/1.8.0.md, log/1.7.0.md, log/1.6.0.md, log/1.5.0.md, log/1.4.0.md, log/1.3.0.md, README.md e la memoria del progetto (project_pixeldebh_todo.md, project_pixeldebh_game_tauri.md).

Stato (v1.8.0, tutto pubblicato su main):
- v1.2.0 Fasi 1-4: motore puro a 60 Hz, app Tauri a schermo intero, renderer PixiJS, Debh vettoriale.
- v1.3.0 Fase 5 audio: motore audio, 24 effetti sintetici, pannello `O`, 8 brani di Lyria (vittoria e game over = jingle sintetici).
- v1.4.0: livello mancante "Level 11: The Phantom Reach" e riordino: tre mondi da tre livelli e un boss, poi il labirinto (13 livelli).
- v1.5.0: labirinto vero (mazeGen.ts, 36x22 celle, zoom 1,6, movimento secco, tutti gli oggetti da raccogliere, timer 16:00).
- v1.6.0: sei nuovi collezionabili (cassetta, gettone, TV a tubo, webcam, microfono, ring light; gli ultimi tre sostituiti in 1.8.0), debutti progressivi.
- Concept dei due boss ridisegnati (components/bosses/, boss-sheet.html), NON ancora nel gioco, in attesa di approvazione.
- v1.7.0: problema dello sprite di Debh in gravita' zero RISOLTO (vedi log/1.7.0.md): "gravita' zero" = movimento libero, non volo, quindi niente posa di volo (Debh cammina con i soliti cicli, anche su e giu', di profilo, niente animazioni nuove su/giu'); nel labirinto e' all'80% con un'impronta di collisione 44x56 ai piedi, zoom 1,3, margine di raccolta di 14 px. Nel labirinto un nemico al centro del corridoio orizzontale non si poteva superare (2 px di sovrapposizione): ora restano circa 30 px.
- v1.8.0: gli oggetti da raccogliere sono solo retrogaming (Debh e' collezionista): webcam, microfono e ring light sostituiti da Atari 2600, Amiga 500 e CD-ROM (stessi livelli di debutto 5, 6, 9), piu' NES (debutto livello 10) e Sega Mega Drive (livello 11): 11 tipi, il labirinto ne ha 2 di ciascuno + 6 power-up = 28 oggetti e un timer di 17:00. Sprite vettoriali nostri, senza loghi (vedi log/1.8.0.md).
- 353 test (npm test). Provato su exe di release: il labirinto con un robot (tools/dev/maze_walk.ts) a 60 fps.

DA PROVARE A MANO (nessuno l'ha giocato): sensazione dei comandi nel labirinto con Debh piccola e zoom 1,3, se 30 px di margine bastano, nemici e oggetti a 50 px (ora relativamente piu' grandi di Debh), i cinque sprite nuovi alla dimensione di gioco. Tutti i valori sono costanti in constants.ts (MAZE_ZOOM, MAZE_PLAYER_SCALE, MAZE_PLAYER_WIDTH/HEIGHT, MAZE_PICKUP_MARGIN).

DA DEFINIRE CON L'UTENTE (nell'ordine in cui servono):
 1. (fatto in 1.7.0: sprite di Debh in gravita' zero, zoom e impronta nel labirinto.)
 2. Boss ridisegnati: quale variante della Rana Ciclope (A arti verdi, B piu' rossa, o una via di mezzo), la gallina di LeGallineNellOcchi e' abbastanza grande?, la lente d'ingrandimento (richiamo a Sherlock) resta?; poi integrazione con animazione (braccia e gambe della rana che oscillano con la velocita', la gallina che cammina nella pupilla). CapocciaNelBuio NON si tocca.
 3. Il labirinto provato a mano: sensazione dei comandi, velocita' di Debh e dei nemici, zoom 1,3 e Debh all'80% (da 1.7.0: da regolare giocando), larghezza dei corridoi, timer 17:00 (stimato a numeri), musica (il vecchio log lo voleva silenzioso, oggi suona "etereo"), labirinto fisso o nuovo a ogni LOOP.
 4. I tre boss dentro il labirinto, in stanze chiuse a quattro pareti: ognuno custodisce un collezionabile necessario al portale? boss indeboliti? timer sospeso nelle stanze? Il motore oggi gestisce un boss solo, va generalizzato.
 5. Sistema di trofei: almeno 15 tra normali, rari, difficili e di completamento. Da decidere: elenco dei trofei (Claude ne propone una lista), dove si vedono (schermata nel menu? notifica in gioco?), salvataggio in save.json.
 6. Livello 11 giocato a mano (difficolta' e ritmo non tarati) e i nuovi collezionabili guardati alla dimensione di gioco.
 7. Audio da far ascoltare: i 4 loop con dissolvenza lunga (world-adventure, boss-frog, boss-shadow-head, boss-chicken-eye), bilanciamento musica/effetti dal pannello `O`, `Orbital_Lockdown.mp3` non assegnato, licenza dei brani Lyria prima di distribuire.

POI, il resto del piano: Fase 6 meccaniche (guida ai collezionabili, combo, telegrafi dei nemici, boss a fasi, molle, piattaforme mobili), nemici e sfondi potenziati in vettoriale HD, verifiche in gioco ancora mancanti (capriola, gravita' zero, danno, pollice alzato, 4K/144 Hz, Linux nativo con GPU e audio, classifica da interfaccia in Tauri), rifinitura (opzioni/gamepad/rimappa tasti, localizzazione IT/EN, firma dell'installatore, npm audit, audit M4, M7, M8, L4, L8, L9, L10).

Richieste fisse dell'utente: gioco desktop Windows+Linux che parte SEMPRE a schermo intero; stile vettoriale HD (niente pixel art); musiche e suoni retrogaming; trovare e correggere criticita'.

Regole di lavoro: testa SEMPRE l'exe di release (la CSP stretta nasconde problemi che `tauri dev` non mostra); regola fissa dell'utente: ogni fase si chiude con commit E push su main (nessuna conferma da chiedere), con tutte le verifiche fatte prima; merge di altri rami e force push solo se l'utente lo chiede; dichiara cio' che non hai potuto verificare (audio, sensazione dei comandi, difficolta', FPS su altro hardware); non toccare docs/MUSIC_BRIEF.md (l'utente ha chiesto di lasciarlo com'e').
```

## Comandi utili

```bash
npm install
npm run dev            # Vite
npm run desktop        # app Tauri in finestra (dev), hot reload
npm test               # 353 test (motore, input, livelli, raggiungibilita', labirinto, audio, oggetti)
npm run typecheck
npx tauri build --no-bundle        # exe di release (Windows), circa 1-3 minuti
npx tauri build --bundles nsis     # installatore Windows
```

- Pagine di prova (con `npm run dev`): `/character-sheet.html` (pose di Debh, `?big=0,3,17` ingrandisce), `/items-sheet.html` (tutti gli oggetti, `?size=80`), `/boss-sheet.html` (concept dei boss, `?size=230`). Immagine a piena risoluzione senza aprire un browser: `msedge --headless=new --disable-gpu --window-size=1500,960 --virtual-time-budget=4000 --screenshot=out.png <url>`.
- Tasti di gioco: `F`/`F11`/`Alt+Enter` finestra, `M` muto, `O` pannello audio, `Q` qualita', `F3` prestazioni. Tasti debug solo in dev: `0` god mode, `L` salta livello (i boss 1 e 2 "prestano" vite: saltarli lascia molte vite), `9` boss finale.
- Test sull'app vera con debug remoto WebView2: avviare l'exe con `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS='--remote-debugging-port=9333 --autoplay-policy=no-user-gesture-required'`. Sonde nella pagina: `window.__pdPerf` (fps, cpu), `window.__pdPlayer`, `window.__pdAudio` (stato audio, brano, livello d'uscita), `window.__pdGame` (`load(i)`, `warp(x,y)`, `god(on)`, `state()`). Script: `tools/dev/cdp2.mjs`, `tools/dev/maze_walk.ts` (guida Debh nel labirinto; si compila con esbuild, vedi il commento in testa), `tools/audio/` (effetti in WAV, preparazione dei brani). I tasti sintetici vanno inviati a `document.body`, non a `window`.

## Dove sta cosa

- `engine/` simulazione pura (`mazeGrid.ts` griglia del labirinto); `renderer/` PixiJS; `characters/debh/` personaggio; `components/` HUD, schermate e `components/bosses/` (concept dei nuovi boss); `services/` audio, salvataggi, piattaforma, `assetService.tsx` (sprite degli oggetti); `audio/` sintetizzatore e effetti; `mazeGen.ts` generatore del labirinto; `levels.ts` livelli; `src-tauri/` guscio desktop; `tests/` e `engine/*.test.ts`; `public/audio/music/` brani e manifest.
- Un file di log per versione in `log/` (1.3.0-1.8.0 per questa tornata) con cosa e' stato fatto, verificato e non verificato.
