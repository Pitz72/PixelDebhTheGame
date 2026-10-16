# PixelDebh: Retro-Rescue! — Audit tecnico e piano Tauri

Repo analizzato: `C:\Users\Utente\Documents\GitHub\PIXELDEBH` (branch `main`, commit `0e3f889`, nessuna modifica fatta).
Data: 2026-10-16. Stack attuale: React 19 + Vite 6 + TypeScript, rendering DOM/SVG, audio Web Audio procedurale.

## Come leggere le etichette

- **[VERIFICATO]** visto girare nel gioco o riprodotto con una simulazione.
- **[CODICE]** letto nel codice, la logica non lascia dubbi, non l'ho eseguita.
- **[NON MISURATO]** sospetto fondato, serve un test su hardware reale.

Limiti dell'audit: non ho potuto misurare gli FPS (il browser integrato non eseguiva `requestAnimationFrame`, ho dovuto sostituirlo con un timer per vedere il gioco muoversi) e non posso ascoltare l'audio, solo leggerlo nel codice.

## Cosa funziona già bene

- `tsc --noEmit` passa senza errori.
- Analisi automatica dei 12 livelli (piattaforme raggiungibili con salto + doppio salto, labirinto a flood-fill): nessun soft-lock trovato. Tutti i collezionabili e le porte risultano raggiungibili. Il labirinto si completa in circa 160 s contro un limite di 600 s. È una stima ottimistica (salto perfetto), ma non emerge nulla di impossibile.
- Coyote time, jump buffer, salto variabile, frustum culling e camera con lerp sono già fatti bene.
- Nessuna chiave API nel bundle `dist/` e nessun file `.env`.

---

## GRAVISSIME (bloccano il rilascio o rompono il gioco)

| # | Problema | Dove | Prova |
|---|---|---|---|
| G1 | **Dipendenze da internet a runtime.** Tailwind caricato da `cdn.tailwindcss.com` (compilatore JIT nel browser, sconsigliato in produzione) e font da Google Fonts. In un'app desktop offline: niente stile, font di ripiego, la UI si rompe. Con una CSP Tauri restrittiva non carica proprio. | `index.html:13-16` | [CODICE] |
| G2 | **I nemici a terra non pattugliano.** La condizione `enemy.vy === 0` è sempre falsa perché la gravità viene sommata prima del controllo. Conseguenze: nessuna inversione ai bordi (cadono da ogni piattaforma), i Hoppy non saltano mai. Poi tutti marciano a destra finché non sono a 2200 px dal giocatore e lì si congelano. | `GameScreen.tsx:1263`, `:1280`, `:1286`, `:1213-1215` | [VERIFICATO] un nemico è passato da y=530 (piattaforma) a y=990 (pavimento); tre nemici impilati e fermi a x≈2301 |
| G3 | **Bomby è innocuo.** La bomba parte con `vx = dx * 0.09` e `vy = -15`: percorre 2,6 volte la distanza al giocatore e passa 100+ px sopra la testa. Non c'è collisione col terreno. | `GameScreen.tsx:1239-1245`, `constants.ts:44-47` | [VERIFICATO] simulazione: distanza minima 117-130 px per dx da 150 a 900, zero colpi |
| G4 | **Tasti di debug attivi nel gioco finale.** `9` salta al boss 3, `L` salta livello, `0` è god mode, e la schermata di pausa li elenca. Permettono di arrivare in classifica barando. | `GameScreen.tsx:493-512`, `:1892-1898` | [CODICE] |
| G5 | **Chiave API incorporabile nel binario.** `vite.config.ts` inietta `GEMINI_API_KEY` nel bundle, `aiService.ts` e `@google/genai` sono ancora nel progetto anche se il log 0.3.0 dice che l'integrazione è stata rimossa. Oggi non c'è nessuna chiave, ma basta un `.env` perché finisca in un eseguibile distribuito. | `vite.config.ts:13-16`, `services/aiService.ts`, `package.json:14` | [CODICE] |

## GRAVI

| # | Problema | Dove | Prova |
|---|---|---|---|
| H1 | **Tenere premuto Spazio o C ripete l'azione.** Nessun filtro `e.repeat`: dopo ~0,5 s di pressione il personaggio fa un doppio salto da solo e poi rimbalza; C cattura e rilancia il nemico da solo. | `GameScreen.tsx:525`, `:551` | [CODICE] |
| H2 | **Tasti bloccati dopo alt-tab.** Nessun gestore di `blur`: se il focus si perde con un tasto premuto, il `keyup` non arriva e Debh corre da sola. Il gioco non va in pausa da solo quando la finestra perde il focus. | `GameScreen.tsx:480-634` | [CODICE] |
| H3 | **Finire il gioco non salva il punteggio e il loop azzera tutto.** `handleGameCompleted` ignora il punteggio. Il "New Game+" rimonta `GameScreen` con score 0 e vite 3. Solo chi muore può entrare in classifica. | `App.tsx:64-68`, `:80-83`, `GameScreen.tsx:165` | [CODICE] |
| H4 | **Boss 2 regala 23 vite e le tiene per tutto il resto del gioco** (`ceil(maxHp/2)`). Il livello 8 e seguenti perdono ogni tensione. | `GameScreen.tsx:409-411` | [CODICE] |
| H5 | **Architettura di rendering non scala.** Ogni frame esegue ~15 `setState` e ricrea gli array di nemici, particelle, onde d'urto e testi. Ogni particella e ogni onda d'urto ha `box-shadow` con alone, ogni nemico un `drop-shadow`. Con luci dinamiche, particelle e bagliore l'approccio DOM si blocca, specie su WebKitGTK (Linux). | `GameScreen.tsx:1579-1604`, `:1815-1852` | [NON MISURATO] 446 nodi DOM a riposo, 15 con `box-shadow` (misurato) |
| H6 | **Scudo e baratro.** Lo scudo viene consumato dalla caduta ma il giocatore non respawna: al frame dopo cade ancora e perde comunque una vita. In god mode il giocatore cade all'infinito con suono e lampo rosso a ogni frame. | `GameScreen.tsx:649-659`, `:957-959` | [CODICE] |
| H7 | **Dopo lo stordimento Bomby cammina.** Alla fine dello stordimento tutti i nemici ricevono `vx = ±ENEMY_SPEED`, Bomby (e un Phaser) compresi. Bomby si mette a camminare in aria senza gravità. | `GameScreen.tsx:1205-1207` | [CODICE] |

## MEDIE

| # | Problema | Dove | Prova |
|---|---|---|---|
| M1 | **ID SVG duplicati.** `slime-body` ×5, `heart-grad` ×3, `joy-ball` ×2 nel DOM. Il gradiente "catturato" (viola) e quello normale hanno lo stesso id: catturando un nemico possono diventare viola tutti, o nessuno. | `assetService.tsx` (es. `:455`) | [VERIFICATO] duplicati; effetto visivo [CODICE] |
| M2 | **Il boss muore in un fermo immagine.** Con `gameState = 'level-cleared'` il loop esce subito: particelle e onde d'urto dell'esplosione restano congelate 2,6 s. Idem per STAGE CLEARED. | `GameScreen.tsx:721`, `:1447-1468` | [CODICE] |
| M3 | **La pausa non ferma la musica**, non esiste un tasto muto né un volume. | `soundService.ts` | [CODICE] |
| M4 | **Musica a timer JavaScript.** Il sequencer usa `setTimeout` a catena: deriva, balbetta con la finestra in secondo piano, nessun controllo sul tempo reale. Una sola voce monofonica, nessun basso né batteria. | `soundService.ts:200-247` | [CODICE] |
| M5 | **Nemico lanciato senza portata.** Un nemico lanciato viaggia a 38 px/frame fino a uscire dal livello (anche 66.000 px) e non si ferma contro muri né piattaforme. Con lag può attraversare altri nemici (passo fino a 114 px contro hitbox da 50). | `GameScreen.tsx:1292-1302`, `:1389-1395` | [CODICE] |
| M6 | **Danno doppio nello stesso frame.** `handlePlayerDamage` sostituisce `s.player`, ma il resto del frame continua con il vecchio oggetto `p` (ancora non invincibile). Baratro + proiettile = due vite perse. `onGameOver` può partire due volte. | `GameScreen.tsx:692`, `:744` | [CODICE] |
| M7 | **Raccolta senza guida.** Per aprire la porta servono tutti i collezionabili; in un livello da 66.400 px, se ne salti uno devi tornare indietro senza indicazioni (c'è solo il conteggio). | `GameScreen.tsx:1550-1555` | [CODICE] |
| M8 | **Piattaforme semi-solide incoerenti.** Si attraversano dai lati e si colpiscono con la testa dal basso: non si può salire attraverso una piattaforma. Va deciso se è una scelta di design. | `GameScreen.tsx:884-948` | [CODICE] |
| M9 | **Timeout non annullati.** I `setTimeout` di fine livello (2000/2600 ms) e del lampo di danno non vengono puliti allo smontaggio; con `L` durante il banner si saltano due livelli. | `GameScreen.tsx:641`, `:1462`, `:1568` | [CODICE] |
| M10 | **Salvataggi in `localStorage` della WebView.** Funziona, ma in Tauri è meglio un file nella cartella dati dell'app (sopravvive a reset del profilo WebView). | `highscoreService.ts` | [CODICE] |

## LIEVI

- L1. Il personaggio è 54×74 px su 1920×1080 (circa il 7% dell'altezza): i dettagli del viso (occhi, sorriso, cuffie) non si leggono. Non assomiglia alla Debh del logo (carré castano, cuffie arancioni, canotta arancione, gamepad).
- L2. Un solo Phaser/Flappy a livello 6 nasce dentro una piattaforma (`flyer@900,920`).
- L3. `README` non allineato: dice timer di 5 minuti (nel codice sono 600 s), 13 livelli (sono 12), boss 2 al livello 8 e boss 3 al 12 (sono 7 e 11), Tailwind "integrato" (è solo da CDN). `PRESENTAZIONE.md` parla di tre nemici (sono cinque).
- L4. Interfaccia mista italiano/inglese ("PREMI ESC PER CONTINUARE" accanto a "SCORE", "PRESS ENTER TO START").
- L5. `Esc` mette in pausa ma in fullscreen del browser esce anche dal fullscreen. In Tauri va gestito con le API della finestra. Ogni click richiede il fullscreen (`App.tsx:156`).
- L6. `EnterHighscoreScreen` blocca `preventDefault` su tutti i tasti (F11, F12 compresi).
- L7. Nome pacchetto non valido per npm: `official-pixeldebh:-retro-rescue!`.
- L8. Nessun supporto gamepad, nessuna rimappatura tasti, nessun menu opzioni, nessun tutorial in gioco.
- L9. `useGameScale` scala con `transform: scale()` un albero DOM con filtri: testo sfocato a scale non intere.
- L10. Il giocatore lampeggia con `Date.now()` nel render (`Player.tsx:57`): non deterministico.

---

## Stato dopo la Fase 1 (branch `v2-tauri`, commit `11d97eb`, non pubblicato)

**Corretti:** G1, G2, G3, G4, G5, H1, H2, H3, H4, H6, H7, M1, M2 (gli effetti continuano e il boss esplode a più riprese), M3 (pausa e muto), M5, M6, M9, L2, L3, L6, L7.
**Ancora aperti:** H5 (renderer, Fase 3), M4 (sequencer musicale, Fase 5), M7 (guida ai collezionabili), M8 (scelta di design), M10 e L5 (Tauri, Fase 2), L1 (personaggio, Fase 4), L4, L8, L9, L10.

Correzione a H5: i `setState` per frame sono già raggruppati da React in un solo render. Il costo vero è ricreare e ridisegnare l'intero albero a ogni frame con ombre e aloni CSS, non il numero di chiamate.

Verifiche: `tsc` pulito, 72 test passano, build senza riferimenti a CDN o chiavi. Nel gioco in esecuzione i nemici ora restano sulle piattaforme e i Hoppy saltano (prima cadevano e si ammassavano). Per verificare che i test non siano vuoti ho reintrodotto due vecchi errori: i test falliscono come previsto.

Non verificato: i font nel gioco avviato dal vero (il browser integrato è stato pilotato con un timer al posto di `requestAnimationFrame`, quindi ho controllato la build ma non il rendering finale), gli FPS, e l'audio (pausa e muto sono nel codice, non li ho ascoltati).

## Stato dopo la Fase 2 (guscio Tauri v2)

Aggiunto `src-tauri/` (Tauri 2, plugin store), icone ricavate dal logo, CSP stretta in produzione, finestra 16:9 ridimensionabile (1280x720, minimo 960x540), schermo intero nativo con `F`, `F11` o `Alt+Enter` (scelta ricordata), salvataggi (classifica, muto, schermo intero) in `save.json` nella cartella dati dell'app con ripiego su `localStorage` nel browser, menu contestuale della WebView disattivato nelle build finali, workflow GitHub `desktop.yml` per installatore Windows e pacchetti Linux. Chiusi M10 e L5.

Verificato su Windows con l'app compilata (commit `5688999`): si avvia (35 MB di memoria al picco), titolo e icona corretti, font locali caricati, `F11` va a schermo intero e la scelta torna al riavvio, `save.json` creato nella cartella dati con muto e schermo intero, nessun messaggio di errore in console con la CSP attiva, `AudioContext` in stato `running`. L'installatore NSIS (1,92 MiB) è stato creato ma non installato né firmato (Windows SmartScreen mostrerà un avviso).

**Linux verificato** su Ubuntu 24.04 in WSL2 (commit `dbf6d62`): `npm ci`, `tsc` e 72 test passano, `tauri build` produce `.deb` (2,25 MiB), `.rpm` (2,26 MiB) e `.AppImage` (110 MiB, include GStreamer). L'app si avvia (finestra 1280x720), mostra gioco e HUD, risponde ai tasti, `F11` va a 1920x1080 e `save.json` viene scritto in `~/.local/share/com.pixeldebh.retrorescue`. Unici avvisi: `libEGL DRI3`, specifici di WSL.

**Non verificato:** un desktop Linux nativo con GPU (prestazioni di WebKitGTK), la scrittura della classifica dall'interfaccia (stesso percorso di `save.json`, ma non l'ho esercitato fino in fondo), l'audio all'orecchio.

## Stato dopo la Fase 3 (renderer PixiJS)

Il gioco parte sempre a schermo intero (richiesta esplicita dell'utente: gioco desktop per Windows e Linux; `F`/`F11`/`Alt+Enter` lo portano in finestra solo per la sessione). Il DOM è sostituito da un renderer WebGL con luci dinamiche, bloom, particelle su GPU, parallasse per mondo, interpolazione a refresh alto, hit-stop e slow-motion; chiuso H5. Il vecchio DOM resta come ripiego automatico.

Verificato sull'app compilata (commit `83c7183`): Windows, 1920x1080, qualità Alta, 60 fps costanti e circa 0,3 ms di CPU per frame in livello 1, livello 10, labirinto e boss finale, nessun errore in console. Linux (WSL2/WSLg): il renderer WebGL parte su WebKitGTK ma senza accelerazione GPU gira a circa 23 fps e passa da solo a Bassa.

Bug trovato lungo la strada: la CSP stretta delle build finali impediva a Pixi di partire e il gioco ricadeva in silenzio sul DOM (le build di sviluppo non hanno CSP e lo nascondevano). Corretto con `pixi.js/unsafe-eval` e con un avviso a schermo quando scatta il ripiego.

**Non verificato:** 144 Hz (il mio monitor è a 60), un desktop Linux nativo con GPU, l'audio.

## Stato dopo la Fase 4 (Debh)

Stile scelto dall'utente: restare sul vettoriale HD. Debh e' ora un personaggio fedele al logo (testa vettorizzata del logo, corpo di profilo dell'intro), alto 122 px invece di 74, con hitbox 54x90, e animazioni complete e procedurali (riposo, corsa, salto, capriola, caduta, atterraggio, cattura, lancio, mira a 8 direzioni, danno, esultanza, gravita' zero). Chiuso L1.

Verificato nel gioco (app di sviluppo su Windows e exe di release a 1920x1080): le pose principali viste in sequenze di fotogrammi (corsa, salto, doppio salto, cattura, mira nel boss), 60 fps, 0,75 ms di CPU per frame, caricamento texture 88 ms; Debh si vede correttamente anche su Linux (WebKitGTK in WSLg, senza GPU: 13-23 fps). Livelli: spazio libero minimo sotto le piattaforme 130 px, la nuova altezza (90) ci sta. Test: 76 passano.

Non verificato: capriola e posa a gravita' zero in gioco (viste solo nella tavola delle pose), reazione al danno e pollice alzato in gioco, aspetto su schermi 4K.

## Piano proposto

Principio: non riscrivere due volte. Prima si estrae la logica in un modulo puro e si correggono i bug lì, poi si cambia il renderer senza toccare la logica.

1. **Stabilizzare (G1-G5, H1-H4, H6-H7, M5, M6, M9).** Nuovo branch `v2-tauri`. Estrarre il motore (`engine/`) in TypeScript puro con timestep fisso a 60 Hz e test automatici per ogni bug di questo elenco. Tailwind e font in locale, tasti debug dietro `import.meta.env.DEV`, rimozione `@google/genai`.
2. **Guscio Tauri v2.** Finestra 16:9, icone dal logo, fullscreen via API finestra, salvataggi in cartella dati, CSP stretta. Build Windows (NSIS/MSI) in locale. Linux (.deb/AppImage) da WSL2 Ubuntu (già presente) o con GitHub Actions (matrice windows + ubuntu).
3. **Nuovo renderer.** PixiJS (WebGL) al posto del DOM: luci dinamiche 2D, bagliore, particelle a migliaia, parallasse a strati, camera shake e hit-stop, sequenza di morte dei boss, HUD sopra.
4. **Personaggio, nemici, sfondi.** Debh ridisegnata dal logo (pipeline di vettorizzazione già usata per l'intro), sprite grande abbastanza da leggersi, animazioni complete (idle, corsa, salto, cattura, danno, vittoria). Nemici e sfondi per ciascuno dei tre mondi.
5. **Audio.** Sequencer con scheduling preciso, 4 canali stile NES (due pulse, triangolo, rumore), tracce originali per titolo, 3 mondi, 3 boss, vittoria, game over. Effetti con canale rumore. Musica adattiva (più strati sotto pressione, tempo più veloce con poco tempo). Volume e muto. Verifica con rendering offline (picchi, loudness), il giudizio timbrico resta a te.
6. **Meccaniche e bilanciamento.** Segnalatore dei collezionabili mancanti, catena di combo, telegrafi dei nemici, boss a fasi, eventuali pericoli nuovi (molle, piattaforme mobili).
7. **Rifinitura e rilascio.** Gamepad, opzioni, localizzazione, installatori, CI.

## Decisioni che servono da te (non bloccano il punto 1)

- **Stile grafico** (serve prima del punto 4): pixel art "HD-2D" con luci vere, coerente con il nome e con la musica chiptune (consigliato), oppure vettoriale HD attuale potenziato.
- **Carattere**: ho letto "più aderente a quello presente nel gioco" come "nel logo". Se intendevi altro, dimmelo.
- **Dove lavorare**: nuovo branch nel repo `Pitz72/PixelDebhTheGame` (consigliato) oppure una copia separata.
