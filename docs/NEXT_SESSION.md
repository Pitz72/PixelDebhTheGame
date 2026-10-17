# Decisioni e cose da fare per arrivare al 100% (stato al 2026-10-17, v1.18.0)

Il gioco e' finito: tutte le 7 fasi della roadmap e tutto l'audit sono chiusi (`docs/AUDIT.md`), `npm audit` e' a zero, 582 test verdi, tutto pubblicato su `main`. Quello che manca e' la **pubblicazione**, qualche **decisione** e le **prove che solo l'utente puo' fare**. Verificato su GitHub il 2026-10-17: repo `Pitz72/PixelDebhTheGame` **pubblico**, **nessun segreto** impostato, **nessuna esecuzione** del workflow, **nessuna release**. La licenza e' stata scelta e scritta lo stesso giorno (D1 e A1 qui sotto).

## Decisioni dell'utente (da prendere per prime)

| # | Decisione | Perche' serve | Consiglio |
|---|---|---|---|
| D1 | **Licenza** del repo (codice, grafica, musiche Lyria) e file `LICENSE` | **FATTA il 2026-10-17** sul modello di Il Relitto Silente e Il Viaggiatore: codice MIT; musiche, grafica vettoriale e testi di presentazione CC BY-NC-SA 4.0; nomi, loghi, icone e animazioni d'apertura (intro PixelDebh e logo Runtime) tutti i diritti riservati. Dettagli in `LICENZE.md` | Niente da fare |
| D2 | OK a impostare i **2 segreti GitHub** (`TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`) | **FATTA il 2026-10-17**: copia delle chiavi in `F:\Backup\PixelDebh-chiavi-firma-2026-10-17` (4 file, confronto SHA-256 identico), poi i due segreti impostati sul repo | Tenere la copia su F: e una seconda altrove (gestore di password): se la chiave si perde non si aggiornano piu' i giochi gia' installati |
| D3 | **Firma del codice** (SmartScreen di Windows) | Senza, i giocatori vedono "Esegui comunque" | SignPath Foundation: gratuita per l'open source, richiede una domanda. Si puo' rimandare a dopo la prima release |
| D4 | **Classifica online** per tutti (`docs/CLASSIFICA_ONLINE.md`) | E' la richiesta 11: va deciso se e quando farla | Fase 1 su Cloudflare, poi la verifica per rigiocata contro i trucchi |
| D5 | **Dove e come si scarica** il gioco gratuito (solo GitHub Releases? un sito? itch.io?) | Per ora c'e' solo la pagina Release | Dirlo all'inizio della sessione: le pagine di download e il README si scrivono di conseguenza |

## Azioni dell'assistente (dopo le decisioni)

| # | Azione | Quando |
|---|---|---|
| A1 | `LICENSE`, `LICENZE.md`, sezione License nel README, campo `license` in `package.json` e `Cargo.toml` | **Fatta** (dopo D1) |
| A2 | Impostare i segreti con `gh secret set` (comandi in `docs/RILASCIO.md`) | **Fatta** (dopo D2) |
| A3 | Prima build di prova `build-only` (Windows e Linux) con `gh workflow run release.yml -f mode=build-only`, guardare i log e correggere | Dopo A2 (mai partita: e' la prova vera) |
| A4 | Bozza di release `mode=draft` con `latest.json` e `log/<versione>.md`; **l'utente preme "Publish release"** | Dopo A3 |
| A5 | **Prova dell'aggiornamento automatico**: servono due release pubblicate in fila (per esempio 1.18.0 e 1.18.1) e un installatore vero. Provare anche l'avviso della portable | Dopo A4 |
| A6 | Domanda a SignPath e firma nella build | Dopo D3 |
| A7 | Classifica online (fase 1) | Dopo D4 |
| A8 | `cargo audit` (installare lo strumento, circa 5 minuti) | Quando si vuole |
| A9 | Ripiego DOM (`?dom`): ha ancora il vecchio Debh e il vecchio sfondo; aggiornarlo oppure dichiararlo non supportato | Bassa priorita' |

## Prove che solo l'utente puo' fare

-   Giocare a mano e **regolare i numeri**: forza delle molle (`SPRING_FORCE`), periodi di ascensore (L5, 6 s) e traghetto (L9, 7 s) in `levels.ts`, finestra della catena (`COMBO_WINDOW_MS`), fasi dei boss (`BOSS_PHASE_RATE`/`BOSS_PHASE_SPEED`), difficolta' facile/normale/difficile, labirinto (zoom 1,3, Debh all'80%, timer 17:00), stage finale a tre boss, livelli 10 e 11, soglie dei trofei.
-   **Ascoltare l'audio**: i 4 loop con dissolvenza lunga (world-adventure, boss-frog, boss-shadow-head, boss-chicken-eye), il bilanciamento dal pannello `O`, il jingle del trofeo; `Orbital_Lockdown.mp3` non e' assegnato.
-   **Rileggere `PRESENTAZIONE.md`** (riscritta dall'assistente il 2026-10-17, commit 712232f).
-   Dove possibile: provare su un **Linux vero** con GPU e audio, e su un monitor a **144 Hz o 4K** (qui il monitor e' a 60 Hz e il 4K e' emulato).
-   A gusto: gli archi del mondo boss sembrano ganci, l'astro del mondo industriale ricorda un pianeta a bande.

## Il percorso piu' corto

D1 + D2 -> A1 + A2 -> A3 (build di prova) -> A4 (bozza, l'utente pubblica) -> A5 (due release, prova dell'aggiornamento). D3, D4, D5 e le prove a mano corrono in parallelo.

---

# Prompt per la prossima sessione (copia e incolla)

```
Riprendiamo il lavoro su PixelDebh: Retro-Rescue! (repo C:\Users\Utente\Documents\GitHub\PIXELDEBH, branch main, remoto Pitz72/PixelDebhTheGame).
Leggi prima: docs/NEXT_SESSION.md, log/1.18.0.md, log/1.17.0.md, log/1.16.0.md, log/1.15.0.md, log/1.14.0.md, log/1.13.0.md, log/1.12.0.md, log/1.11.0.md, log/1.10.0.md, log/1.9.0.md, log/1.8.0.md, log/1.7.0.md, log/1.6.0.md, log/1.5.0.md, log/1.4.0.md, log/1.3.0.md, README.md e la memoria del progetto (project_pixeldebh_todo.md, project_pixeldebh_game_tauri.md).

Stato (v1.18.0, tutto pubblicato su main):
- v1.2.0 Fasi 1-4: motore puro a 60 Hz, app Tauri a schermo intero, renderer PixiJS, Debh vettoriale.
- v1.3.0 Fase 5 audio: motore audio, 24 effetti sintetici, pannello `O`, 8 brani di Lyria (vittoria e game over = jingle sintetici).
- v1.4.0: livello mancante "Level 11: The Phantom Reach" e riordino: tre mondi da tre livelli e un boss, poi il labirinto (13 livelli; in 1.10.0 diventano 14, vedi sotto).
- v1.5.0: labirinto vero (mazeGen.ts, 36x22 celle, zoom 1,6, movimento secco, tutti gli oggetti da raccogliere, timer 16:00).
- v1.6.0: sei nuovi collezionabili (cassetta, gettone, TV a tubo, webcam, microfono, ring light; gli ultimi tre sostituiti in 1.8.0), debutti progressivi.
- v1.7.0: problema dello sprite di Debh in gravita' zero RISOLTO (vedi log/1.7.0.md): "gravita' zero" = movimento libero, non volo, quindi niente posa di volo (Debh cammina con i soliti cicli, anche su e giu', di profilo, niente animazioni nuove su/giu'); nel labirinto e' all'80% con un'impronta di collisione 44x56 ai piedi, zoom 1,3, margine di raccolta di 14 px. Nel labirinto un nemico al centro del corridoio orizzontale non si poteva superare (2 px di sovrapposizione): ora restano circa 30 px.
- v1.8.0: gli oggetti da raccogliere sono solo retrogaming (Debh e' collezionista): webcam, microfono e ring light sostituiti da Atari 2600, Amiga 500 e CD-ROM (stessi livelli di debutto 5, 6, 9), piu' NES (debutto livello 10) e Sega Mega Drive (livello 11): 11 tipi, il labirinto ne ha 2 di ciascuno + 6 power-up = 28 oggetti e un timer di 17:00. Sprite vettoriali nostri, senza loghi (vedi log/1.8.0.md).
- v1.9.0: i due boss ridisegnati sono nel gioco e si muovono (rana 'via di mezzo' con braccia e gambe che oscillano, LeGallineNellOcchi con la gallina che passeggia nella pupilla, lente e gallina come nel concept; vedi log/1.9.0.md). CapocciaNelBuio non toccato.
- v1.10.0: STAGE FINALE, livello 14 'The Collector's Vault' dietro l'uscita del labirinto: i tre boss tutti insieme (rana, occhio, CapocciaNelBuio) con il 25% della vita (8, 12, 14), ciascuno nella sua parte di sala (`Boss.arena`); sala-museo con scaffali di console giganti, movimento libero, Debh entra con vite al massimo e scudo; si vince quando cadono tutti e tre. Motore a piu' boss (`World.bosses`, `World.boss` resta alias del primo), tre barre di vita nell'HUD. In piu': il labirinto resta lo stesso ma a ogni LOOP ha un quinto di nemici in piu' e un minuto in meno (mai sotto `timeFloor`, circa 9:00). Vedi log/1.10.0.md.
- v1.11.0: TROFEI e musica del caveau. 21 trofei (6 normali, 7 rari, 5 difficili, 3 di completamento: elenco e condizioni in `trophies.ts`, soglie in costanti), contati dal motore (`engine/stats.ts`, `World.stats`) e salvati in `save.json` (`services/trophyService.ts`); notifica in gioco con jingle (`components/TrophyToast.tsx`) e schermata col tasto `T` nel titolo e in pausa (`components/TrophyScreen.tsx`); una partita con il God Mode non assegna nulla. Il livello 14 suona `world-adventure`, la traccia dei livelli 1-3. Vedi log/1.11.0.md.
- v1.12.0: L'AVVIO E IL RILASCIO. All'avvio: mezzo secondo di nero, logo animato di Runtime Multimedia (codice importato da *Il Relitto Silente*, `intro/`), mezzo secondo di nero, intro animata di PixelDebh (WebM da 8 MB, `public/intro/`), cartello sull'IA nello stile del gioco (`components/AiNotice.tsx`, testi in `locales/` IT/EN), poi il titolo; la dicitura «By Simone Pizzi - Runtime Multimedia» sulle schermate del titolo e nei dati dell'installatore. Rilascio: `.github/workflows/release.yml` ("Build and release") parte SOLO a mano (`mode`: build-only, draft, publish) e costruisce Windows (installatore + exe portable) e Linux (deb, rpm, AppImage); aggiornamento automatico (`services/updateService.ts`, tasto `U` nel titolo): chi ha l'installatore o l'AppImage si aggiorna da solo, chi ha il portable o i pacchetti riceve l'avviso con il link. Guida: `docs/RILASCIO.md`. Relazione sulla classifica online: `docs/CLASSIFICA_ONLINE.md`. DA FARE A MANO dall'utente: mettere i due segreti nel repository (`TAURI_SIGNING_PRIVATE_KEY` e la password; le chiavi sono in `C:\Users\Utente\.pixeldebh-signing\`) e lanciare la prima build.
- v1.13.0: GAMEPAD (non c'era), TASTI RIMAPPABILI, MENU E OPZIONI. `engine/gamepad.ts` (layout standard: A salta/conferma, X o Y cattura, B/RB/RT/LT sparano, croce e levetta muovono, Start pausa, B indietro) e `services/gamepadService.ts` (nei menu il pad diventa i tasti che le schermate gia' capiscono); `engine/input.ts` con la tabella dei tasti (`Bindings`) e `services/settings.ts` (qualita', lampi, scuotimento, pausa sui colpi, movimento ridotto, tasti); `components/OptionsScreen.tsx` a schede (audio, grafica, comandi, lingua, accessibilita'); menu del titolo (nuova partita, classifica, trofei, opzioni, come si gioca, crediti, esci) e della pausa (con "esci al titolo"), game over con menu, `CreditsScreen`, `HowToPlayScreen`, `MenuList`. Vedi log/1.13.0.md.
- v1.14.0: TUTTO IN DUE LINGUE (italiano e inglese; restano in inglese le grida arcade, l'HUD e i nomi propri), CONTINUA (`services/progress.ts`: partita salvata a ogni inizio livello con le statistiche dei trofei), SELEZIONE DEL LIVELLO (allenamento: niente classifica ne' trofei), DIFFICOLTA' (facile/normale/difficile, `DIFFICULTY` in constants.ts, scheda GIOCO nelle Opzioni), `@types/react` aggiunti (prima `tsc` non controllava i componenti). Vedi log/1.14.0.md.
- v1.15.0: FASE 6, PARTE 1. Catena di K.O. con moltiplicatore fino a x5 (pillola COMBO nell'HUD, 22° trofeo "Catena Infinita"), boss a fasi (sotto meta' e sotto un quarto di vita: attacchi e movimento piu' rapidi, annuncio PHASE n!), segnali dei nemici prima dell'attacco (Hoppy si accuccia, Bomby si gonfia, rana e occhio si illuminano), freccia verso gli ultimi 3 oggetti (spegnibile in Opzioni > GIOCO), MOLLE (lanciano a ~650 px: livelli 3 e 7) e PIATTAFORME MOBILI (ascensore al livello 5, traghetto al 9) sempre su percorsi facoltativi con un potenziamento in cima. Motore: `Spring`, `Platform.move`, `movingPlatformSpot` (`engine/world.ts`), `updateSprings`/`updateMovingPlatforms` (`engine/step.ts`); renderer: `SpringView`, interpolazione delle mobili in `syncPlatforms`. Un robot nei test (`tests/reachability.test.ts`) percorre le quattro vie sul motore vero. Vedi log/1.15.0.md.
- v1.16.0: FASE 6, PARTE 2. I cinque nemici ridisegnati in vettoriale HD (`services/enemyArt.tsx`, stessa sagoma e stesso riquadro; tre stati leggibili: normale, viola da catturato, occhi storditi) e **un paesaggio per ogni mondo** (`renderer/worldArt.ts`): citta' al neon (avventura), raffineria nello smog (industriale), isole fluttuanti con cristalli, aurora e pianeta ad anelli (etereo), cittadella in rovina sotto una luna rossa crepata (boss). Strisce disegnate a 2x e mostrate a meta' (`ART_SCALE`), mondi disegnati su richiesta (`renderer/textures.tsx`), pagine di prova `/enemy-sheet.html` e `/backdrop-sheet.html?theme=...&cam=...`. Vedi log/1.16.0.md.
- v1.17.0: DEBH NUOVA NELLA PARATA (mezzo busto in un riquadro di 72 px come i nemici, `characters/debh/paradeFrames.ts`, cotta durante le intro) e LE VERIFICHE: capriola, danno, gravita' zero e pollice alzato provati nell'exe; un DIFETTO TROVATO E CORRETTO (la risoluzione del canvas non seguiva un ridimensionamento della finestra: ora l'evento `resize` riadatta, 4K = 2880x1620 interni); il loop a passo fisso e' una funzione pura con test a 30-240 Hz (`engine/clock.ts`). Vedi log/1.17.0.md.
- v1.18.0: RIFINITURA. `npm audit` a ZERO (Tailwind 3 -> 4, con il look identico: `theme-v3-colors.css` tiene la tavolozza di prima, i gradienti restano in sRGB, il padding delle celle della tabella e' scritto a mano; verificato su 19 schermate con la pagina `/ui-sheet.html`, per pixel e per geometria), il codice morto tolto, `noUnusedLocals`/`noUnusedParameters` accesi, un difetto scovato dello strumento di migrazione (riscriveva la stringa `'blur'` di un `removeEventListener`; ora un test controlla che ogni listener si tolga con lo stesso nome con cui e' stato messo), le voci rimaste dell'audit chiuse o motivate (`docs/AUDIT.md`). Vedi log/1.18.0.md.
- 582 test (npm test). Provato su exe di release: boss colpiti, labirinto con un robot (tools/dev/maze_walk.ts) a 60 fps, l'intero stage finale giocato fino alla schermata di vittoria, e (1.11.0) un livello 1 vero con due trofei sbloccati e ancora presenti dopo il riavvio dell'app.

DA PROVARE A MANO (nessuno l'ha giocato): lo stage finale con tre boss insieme (difficolta' con il 25% della vita e senza fuoco rapido, tre boss in 2688 px: costante `FINAL_BOSS_HP_SHARE` e arene in levels.ts), i giri successivi del labirinto; sensazione dei comandi nel labirinto con Debh piccola e zoom 1,3, se 30 px di margine bastano, nemici e oggetti a 50 px (ora relativamente piu' grandi di Debh), i cinque sprite nuovi alla dimensione di gioco. Tutti i valori sono costanti in constants.ts (MAZE_ZOOM, MAZE_PLAYER_SCALE, MAZE_PLAYER_WIDTH/HEIGHT, MAZE_PICKUP_MARGIN). Dal 1.15.0 anche: le molle dei livelli 3 e 7 (`SPRING_FORCE`), l'ascensore del 5 e il traghetto del 9 (`move.range`/`move.period` in levels.ts: e' facile salirci?), la finestra della catena di K.O. (`COMBO_WINDOW_MS`), le fasi dei boss (`BOSS_PHASE_RATE`/`BOSS_PHASE_SPEED`) e la freccia guida (`GUIDE_MAX_LEFT`, `GUIDE_MIN_DISTANCE`).

DA DEFINIRE CON L'UTENTE (nell'ordine in cui servono):
 1. (fatto in 1.7.0: sprite di Debh in gravita' zero, zoom e impronta nel labirinto.)
 2. (fatto in 1.9.0: boss ridisegnati nel gioco con le scelte dell'utente.)
 3. Il labirinto provato a mano: sensazione dei comandi, velocita' di Debh e dei nemici, zoom 1,3 e Debh all'80% (da regolare giocando), larghezza dei corridoi, timer 17:00 (stimato a numeri), musica (il vecchio log lo voleva silenzioso, oggi suona "etereo"). (Fatto in 1.10.0: stesso labirinto a ogni LOOP, piu' nemici e meno tempo a ogni giro.)
 4. (fatto in 1.10.0: i tre boss insieme nello stage finale. Fatto in 1.11.0: musica del livello 14 = `world-adventure`.) Da decidere: eventuale breve scena o banner d'ingresso nel caveau; `Orbital_Lockdown.mp3` resta libera e non ascoltata.
 5. (fatto in 1.11.0: 21 trofei con notifica, schermata `T` e salvataggio.) Da regolare giocando: le soglie (100 oggetti, 100 nemici, 100.000 punti, 6 minuti nel labirinto, 5 doppi K.O., LOOP 3).
 6. Livello 11 giocato a mano (difficolta' e ritmo non tarati) e i nuovi collezionabili guardati alla dimensione di gioco.
 7. Audio da far ascoltare: i 4 loop con dissolvenza lunga (world-adventure, boss-frog, boss-shadow-head, boss-chicken-eye), bilanciamento musica/effetti dal pannello `O`, il jingle del trofeo. (Licenza dei brani Lyria: risolta, l'utente li ha fatti con il suo account Pro e si possono usare. Il gioco sara' GRATUITO: i dettagli della distribuzione li spieghera' l'utente.)

IL PIANO CONCORDATO (l'utente, 2026-10-17: «facciamo tutto quello che resta e i tuoi suggerimenti tutti»). Nell'ordine:
 A. (fatto, 1.12.0) Avvio con intro, cartello sull'IA, dicitura dell'autore, parata dei personaggi verificata.
 B. (fatto, 1.12.0) Build manuali su GitHub, release, aggiornamento automatico, avviso per la versione portable. Relazione sulla classifica online (docs/CLASSIFICA_ONLINE.md): da decidere con l'utente se e quando farla (Fase 1 su Cloudflare, poi la verifica per rigiocata).
 C. (fatto, 1.13.0) Gamepad, rimappa tasti, menu del titolo e di pausa, Opzioni a schede, Crediti, Come si gioca. Resta: la scheda della difficolta' nelle Opzioni (con la fase E), la rimappa dei pulsanti del pad (oggi layout fisso), la prova con un pad vero.
 D. (fatto, 1.14.0) Localizzazione IT/EN. Era: la base c'e' (`locales/it.ts` e `en.ts` con `t(key)`, `useLanguage()`; un test controlla che ogni `t('...')` del codice esista); tradotti cartello, avvisi di aggiornamento, menu, opzioni, crediti, come si gioca; DA FARE: HUD, schermata di vittoria, inserimento iniziali, titoli e descrizioni dei trofei, avvisi in partita (le "grida" arcade come STAGE CLEARED/OUCH! restano in inglese in entrambe le lingue), banner di compatibilita'.
 E. (fatto, 1.13.0-1.14.0) Salvataggio del progresso, selezione del livello, difficolta', accessibilita' (scuotimento, lampi, pausa sui colpi, movimento ridotto nelle intro). Resta: ripresa dall'ultimo checkpoint (oggi dall'inizio del livello), difficolta' provate a mano.
 F. (fatto in 1.15.0: guida ai collezionabili, combo, telegrafi dei nemici, boss a fasi, molle, piattaforme mobili; da regolare giocando: forza della molla, periodi di ascensore e traghetto, finestra della catena, fasi dei boss. Fatto in 1.16.0: nemici e sfondi potenziati.) RESTA: (parata col Debh nuovo e verifiche di capriola, gravita' zero, danno, pollice alzato, 4K e 144 Hz: FATTE in 1.17.0; manca solo Linux nativo con GPU e audio e un monitor vero a 144 Hz/4K), rifinitura (firma dell'installatore, magari con SignPath Foundation, npm audit: 7 avvisi tutti nella catena di sviluppo di Tailwind 3, audit M4, M7, M8, L4, L8, L9, L10).

Richieste fisse dell'utente: gioco desktop Windows+Linux che parte SEMPRE a schermo intero; stile vettoriale HD (niente pixel art); musiche e suoni retrogaming; trovare e correggere criticita'.

Regole di lavoro: testa SEMPRE l'exe di release (la CSP stretta nasconde problemi che `tauri dev` non mostra); regola fissa dell'utente: ogni fase si chiude con commit E push su main (nessuna conferma da chiedere), con tutte le verifiche fatte prima; merge di altri rami e force push solo se l'utente lo chiede; dichiara cio' che non hai potuto verificare (audio, sensazione dei comandi, difficolta', FPS su altro hardware); non toccare docs/MUSIC_BRIEF.md (l'utente ha chiesto di lasciarlo com'e').
```

## Comandi utili

```bash
npm install
npm run dev            # Vite
npm run desktop        # app Tauri in finestra (dev), hot reload
npm test               # 582 test (motore, input, livelli, raggiungibilita' con robot, meccaniche, labirinto, audio, oggetti)
npm run typecheck
npx tauri build --no-bundle        # exe di release (Windows), circa 1-3 minuti
npm run exe                        # come sopra, poi copia l'exe in exe/PixelDebh-<versione>.exe (cartella nella root, fuori da git)
npx tauri build --bundles nsis     # installatore Windows
```

- Pagine di prova (con `npm run dev`): `/ui-sheet.html?screen=howto` (le schermate HTML a 1920x1080, dati fissi e niente animazioni, per confrontare gli stili prima e dopo una modifica: schermate start, howto, credits, trophies, options&tab=0..5, highscore, gameover, completed, enterscore, levels, update, hud, hudboss, notice), `/enemy-sheet.html`, `/backdrop-sheet.html`, `/character-sheet.html` (pose di Debh, `?big=0,3,17` ingrandisce), `/items-sheet.html` (tutti gli oggetti, `?size=80`), `/boss-sheet.html` (i due boss ridisegnati nelle pose, `?size=230`). Immagine a piena risoluzione senza aprire un browser: `msedge --headless=new --disable-gpu --window-size=1500,960 --virtual-time-budget=4000 --screenshot=out.png <url>`.
- Tasti di gioco: `F`/`F11`/`Alt+Enter` finestra, `M` muto, `O` pannello audio, `Q` qualita', `F3` prestazioni. Tasti debug solo in dev: `0` god mode, `L` salta livello (i boss 1 e 2 "prestano" vite: saltarli lascia molte vite), `9` boss finale.
- Test sull'app vera con debug remoto WebView2: avviare l'exe con `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS='--remote-debugging-port=9333 --autoplay-policy=no-user-gesture-required'`. Sonde nella pagina: `window.__pdPerf` (fps, cpu), `window.__pdPlayer`, `window.__pdAudio` (stato audio, brano, livello d'uscita), `window.__pdGame` (`load(i)`, `warp(x,y)`, `god(on)`, `state()`). Script: `tools/dev/cdp2.mjs`, `tools/dev/maze_walk.ts` (guida Debh nel labirinto; si compila con esbuild, vedi il commento in testa), `tools/audio/` (effetti in WAV, preparazione dei brani). I tasti sintetici vanno inviati a `document.body`, non a `window`.

## Dove sta cosa

- `engine/` simulazione pura (`mazeGrid.ts` griglia del labirinto); `renderer/` PixiJS (`bossRigs.ts` monta i boss, `vaultArt.ts` disegna il caveau); `characters/debh/` personaggio; `components/` HUD, schermate e `components/bosses/` (disegni, pose e cottura dei due boss ridisegnati; `renderer/bossRigs.ts` li monta); `services/` audio, salvataggi, piattaforma, `assetService.tsx` (sprite degli oggetti); `audio/` sintetizzatore e effetti; `mazeGen.ts` generatore del labirinto; `levels.ts` livelli; `src-tauri/` guscio desktop; `tests/` e `engine/*.test.ts`; `public/audio/music/` brani e manifest.
- Un file di log per versione in `log/` (1.3.0-1.11.0 per questa tornata) con cosa e' stato fatto, verificato e non verificato.
