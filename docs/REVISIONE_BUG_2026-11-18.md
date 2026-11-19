# Revisione dei bug, 18 novembre 2026 (v1.19.1) — PARZIALE

Interrotta su richiesta di Simone per risparmiare credito.

**Fatto:** schermate e flusso dell'app; servizi, salvataggi, torneo, aggiornamento, audio; guscio Tauri, rilascio, dipendenze.
**NON fatto:** motore di gioco (`engine/`, `levels.ts`, `mazeGen.ts`, `trophies.ts`) e grafica (`renderer/`, `characters/`,
`components/bosses/`, `services/assetService.tsx`, ripiego DOM). Le due letture erano in corso e sono state fermate: da loro non
c'è nessun risultato. Il 19 novembre Simone ha detto che queste due parti non gli interessano: il problema vero è
l'installazione (sezione in fondo).

Stato di partenza: `tsc --noEmit` pulito, 852 test verdi, nessun segreto nel repository, testi IT/EN allineati (243 chiavi).
Niente è stato modificato nel codice.

**Corretti nella 1.19.2 (19 novembre, preparata):** G1, G2 (solo Windows), M1, M6, M9, M10, M11, M12, più il problema
dell'installatore (sezione in fondo). Dettagli in `log/1.19.2.md`. **Ancora aperti:** G3, M2, M3, M4, M5, M7, M8, M13, M14 e
i lievi.

Etichette: **[CODICE]** letto e seguito nel codice fino in fondo; **[NON PROVATO]** il meccanismo è nel codice ma non l'ho visto
succedere nel gioco avviato.

## Gravissimi

Nessuno trovato nelle parti lette (nessun crash, nessuna schermata senza uscita).

## Gravi

| # | Problema | Dove | Prova |
|---|---|---|---|
| G1 | **La pratica cancella la partita salvata.** Una partita di pratica (selezione livelli) che finisce in game over o in vittoria chiama `clearRun()`: «Continua» sparisce con punteggio, vite e giro. Il salvataggio è protetto da `!w.practice`, la cancellazione no. | `GameScreen.tsx:550-557` | [CODICE] |
| G2 | **Due copie del gioco aperte insieme: quella chiusa per ultima riscrive `save.json` con i dati vecchi.** Non c'è il blocco «una sola istanza»; il plugin store riscrive tutto il file alla chiusura dalla sua copia in memoria. Si perde una sessione intera (classifica, trofei, progressi, codice del torneo). Effetto collaterale: due musiche insieme. | `src-tauri/Cargo.toml`, `src-tauri/src/lib.rs:38-53`, `services/storage.ts:47-54` | [NON PROVATO] |
| G3 | **Un `save.json` danneggiato viene trattato come vuoto e poi sovrascritto.** Il plugin ignora l'errore di lettura; la scrittura non è atomica e non c'è copia di riserva. Dopo uno spegnimento brusco durante una scrittura il giocatore perde tutto. | `services/storage.ts:24-36` | [NON PROVATO] |

## Medi

| # | Problema | Dove | Prova |
|---|---|---|---|
| M1 | «Riprova» dopo un game over in pratica fa partire una partita vera dal livello 1 (e ne salva l'inizio). | `App.tsx:368`, `App.tsx:151-157` | [CODICE] |
| M2 | Sulla schermata VICTORY il punteggio esiste solo in memoria: chiudere il gioco lì perde partita, classifica e torneo. | `GameScreen.tsx:554-556`, `App.tsx:228-232` | [CODICE] |
| M3 | Gamepad: START non fa riprendere dalla pausa (riprende e rimette in pausa nello stesso fotogramma). A e B funzionano. | `GameScreen.tsx:566-570`, `services/gamepadService.ts:37-45` | [NON PROVATO] con un pad vero |
| M4 | Classifica automatica dopo 20 s di attesa: solo Invio, Spazio e clic riportano al menu; ogni altro tasto la tiene su altri 10 s. Il commento nel codice dice «qualsiasi tasto». | `App.tsx:249-283`, `components/HighscoreScreen.tsx:29-42` | [CODICE] |
| M5 | GAME OVER e VICTORY non hanno un attimo di attesa: lo Spazio premuto per saltare sceglie subito «Riprova» o il giro successivo. | `components/GameoverScreen.tsx:21-30`, `components/CompletedScreen.tsx:13-26` | [CODICE] |
| M6 | F5 e Ctrl+R ricaricano tutto il gioco nell'exe di Windows (anche Ctrl+P stampa, Ctrl+F cerca): la partita in corso si perde. | `index.tsx:15-18` (wry lascia attivi i tasti del browser) | [NON PROVATO] sull'exe |
| M7 | Opzioni > Comandi: mentre si aspetta un tasto, la croce del gamepad viene presa come tasto e scambia i comandi senza avviso. | `components/OptionsScreen.tsx:223-246` | [CODICE] |
| M8 | Il video d'apertura non ha un tempo massimo: se si blocca senza errore resta lo schermo nero (si esce con Esc, ma la scritta è minuscola). | `components/DebhIntroVideo.tsx:31-75` | [CODICE] |
| M9 | Aggiornamento con U: il gioco resta giocabile mentre scarica e poi si chiude da solo a metà partita; U funziona anche sotto Opzioni, Crediti ecc. senza che si veda nulla; uno scaricamento interrotto resta «in corso» per sempre. | `App.tsx:96-109`, `App.tsx:132-133`, `services/updateService.ts:95-99` | [CODICE] |
| M10 | Torneo: se il sito non risponde né all'avvio né a fine partita, il punteggio viene scartato senza avviso e non va in coda (le note della 1.19.0 promettono che aspetta). | `services/tournamentApi.ts:392-398` | [CODICE] |
| M11 | Torneo: un punteggio in coda viene ritentato solo al prossimo avvio del gioco, e buttato via se nel frattempo il torneo è chiuso. | `services/tournamentApi.ts:346-352`, `:378-386` | [CODICE] |
| M12 | Trofei: ogni «Continua» somma di nuovo ai totali di sempre gli oggetti e i nemici della partita salvata (i trofei «100 oggetti» e «100 nemici» arrivano prima del dovuto). | `services/trophyService.ts:57`, `:71-79` | [CODICE] |
| M13 | Menu: Tab sposta il riquadro del browser ma Invio agisce sulla riga evidenziata dal gioco (può partire «Nuova partita»); i lettori di schermo non ricevono la riga scelta. | `components/MenuList.tsx:60-121` | [CODICE], non provato con un lettore di schermo |
| M14 | Gamepad: viene letto solo il primo dispositivo e senza controllare la disposizione dei tasti (volante o pad virtuale possono muovere menu e personaggio). | `services/gamepadService.ts:16-24` | Sospetto, senza hardware |

## Lievi

Segnalati dalla lettura; non li ho riverificati uno per uno, tranne dove indicato.

- I caratteri: `'Orbitron'` non è mai caricato, esiste solo `'Orbitron Variable'` (verificato): titoli dell'avviso IA, dell'intro e la scritta «salta» del video usano un carattere di ripiego. `components/AiNotice.tsx:70`, `PixelArcadeIntro.tsx:122`, `DebhIntroVideo.tsx:81`, `services/assetService.tsx:836,847`.
- `<html lang="it">` non cambia con la lingua (verificato): l'inglese viene letto con la voce italiana. `index.html:2`.
- Trofei guadagnati col colpo finale: l'avviso viene tagliato o non compare (il trofeo è salvato). `GameScreen.tsx:183,266-273`.
- Invio tenuto premuto sulla terza sigla salta la classifica. `components/HighscoreScreen.tsx:32-38`.
- L'interruttore «ho almeno 14 anni» può cambiare da solo con la freccia tenuta premuta. `components/TournamentConsent.tsx:103,124`.
- Le lettere O, T, U, Q, H restano attive sotto le schermate aperte sopra. `App.tsx:122-133`, `GameScreen.tsx:427-446`.
- Dopo «cancella i miei dati» nessuna riga è evidenziata. `components/OptionsScreen.tsx:171,205`.
- Backspace è scritto «CANC» in italiano (che è il tasto Canc). `locales/it.ts:32`.
- «Hai tre vite» in Come si gioca è sbagliato in Facile (5) e Difficile (2). `locales/it.ts:124`, `locales/en.ts:112`.
- Sigla del record: non si torna indietro su una lettera confermata. `components/EnterHighscoreScreen.tsx:46-67`.
- La musica del titolo continua con la finestra in secondo piano. `App.tsx:313-328`.
- Classifica locale letta senza controlli e nessun «error boundary»: una voce rovinata può dare schermo nero (verificato che il controllo manca). `services/highscoreService.ts:15-32`.
- Torneo: a una copia squalificata viene detto «sei in posizione 0»; una risposta non JSON scarta il punteggio; la scritta «torneo dal…» può restare con una data passata. `services/tournamentApi.ts:291-306`, `components/TournamentBanner.tsx:25-31`.
- Musica decodificata tenuta in memoria per tutta la sessione (circa 277 MB dopo una partita completa). `services/soundService.ts:192`.
- Ripiego DOM: ignora l'opzione «scuotimento schermo». `components/DomScene.tsx:41-42`.
- Sicurezza delle librerie (verificato con `cargo audit` e `npm audit`): nuovi avvisi su `rustls-webpki` 0.103.15, `webpki-root-certs` 1.0.9 e altri tre su `zip` 4.6.1, tutti solo attraverso l'aggiornamento automatico (gli aggiornamenti sono firmati, quindi rischio basso; `cargo update -p rustls-webpki -p webpki-root-certs` li chiude tranne `zip`). `npm audit`: 0 avvisi nel gioco, 5 «high» negli strumenti di sviluppo (vite, vitest).
- `release.yml`: le chiavi di firma sono visibili a tutti i passi del lavoro (anche a `npm ci`) e le azioni esterne non sono fissate a un commit. Irrobustimento, non un bug di oggi.
- `tsconfig.json` senza `strict`; attivandolo esce un solo punto (`components/Player.tsx:14`, ripiego DOM).

## Controllato e pulito

Avvio del salvataggio prima della prima schermata, contratto del torneo (campi, firma, orologio, versione), nessun dato personale
in URL o log, codice della copia, tasti di sviluppo esclusi dalle build finali, audio (nessun valore non valido, pulizia dei nodi,
ripiego se un file manca), aggiornamento offerto solo se più nuovo, testi IT/EN.

## Installazione: il problema segnalato dai giocatori (19 novembre)

Simone: più persone hanno difficoltà sia con l'aggiornamento automatico sia installando da zero la 1.19.1. Motore e grafica non
interessano più: la revisione di quelle due parti è annullata.

Una schermata (installazione a mano della 1.19.1): «Errore nell'apertura del file in scrittura
`C:\Program Files (x86)\PixelDebh Retro-Rescue\pixeldebh.exe`», con la riga «Cartella destinazione:
`C:\Program Files (x86)\\PixelDebh Retro-Rescue`» (doppia barra: percorso scritto a mano).

- **[CODICE]** L'installatore gira senza permessi di amministratore (`RequestExecutionLevel user`, modo `currentUser`) e propone
  `%LOCALAPPDATA%\PixelDebh Retro-Rescue`, ma la pagina della cartella lascia scegliere qualsiasi percorso. In `Program Files`
  non può scrivere: fallisce sul primo file con quel messaggio. Modello: `src-tauri/target/release/nsis/x64/installer.nsi`
  righe 105-106, 409-410, 526-545, 677-687.
- **[CODICE]** Con «Ignora» l'installazione prosegue senza l'exe e salva la cartella sbagliata nel registro (riga 702): da lì
  ogni installazione e ogni aggiornamento automatico ripropongono quella cartella e falliscono allo stesso modo (righe 896-900).
- Sul PC di Simone il gioco è nella cartella giusta (`AppData\Local`, 1.19.1): la schermata viene da un altro PC.
- **Non so** cosa vedono le altre persone: il giocatore della schermata non ha dato altri dettagli.
- **Corretto nella 1.19.2 (preparata il 19 novembre, non pubblicata):** l'installatore prova a scrivere nella cartella prima
  di copiare; se non può lo dice e propone la cartella consigliata, e non ricorda più una cartella sbagliata. Vedi
  `log/1.19.2.md`.

## Da fare alla ripresa

1. Chiudere la 1.19.2: bozza, prove sulla bozza, pubblicazione su OK di Simone.
2. Sulla bozza provare: doppia apertura (G2), F5 (M6), aggiornamento con la schermata intera (M9), pratica fino al game
   over (G1).
3. Le voci ancora aperte, una per volta, quando Simone lo decide (G3 e M3 per prime).
