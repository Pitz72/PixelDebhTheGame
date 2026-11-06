# Il torneo di pixeldebh.it: la parte del gioco (fase 3)

> **Stato: DA FARE, è il prossimo lavoro del gioco** (scritto il 6 novembre 2026 dalla sessione del sito di PixelDebh).
> La classifica online (D4 in `docs/NEXT_SESSION.md`, `docs/CLASSIFICA_ONLINE.md`), sospesa il 18 ottobre per la privacy,
> **è ripresa**: Simone l'ha voluta come **torneo** sul sito ufficiale del canale, **www.pixeldebh.it**, che sta in Italia
> (Aruba) e ha già informativa e registro dei trattamenti. Il sito è pronto (sua versione 0.6.0); manca il gioco che manda
> i punteggi. Si fa una cosa per volta, con commit e push a fine fase, come sempre.

## A che punto siamo

| Fase | Che cosa | Stato |
|---|---|---|
| 1 | Interruttore nelle Opzioni (scheda GIOCO), schermata dei 14 anni e della sigla, link all'informativa, codice della copia in `save.json` (punti 1, 2 e 9 qui sotto) | **Fatta il 6 novembre 2026** |
| 2 | Stato del torneo all'avvio, invio firmato a fine partita, coda senza rete, «Cancella i miei dati», CSP (punti 3-8) | Da fare |
| 3 | Prova vera contro il sito di sviluppo (server locale 8123 nel progetto del sito) (punto 10) | Da fare |
| 4 | Segreto di GitHub, `release.yml`, versione 1.19.0 (punti 7 e 11) | Da fare |

**Fase 1, dove sta:** `services/tournament.ts` (stato salvato sotto `pixelDebhTournament`: `enabled`, `initials`, `copy`,
`consentAt`; acceso solo con sigla, codice e consenso validi; spegnerlo tiene sigla e codice), `components/TournamentConsent.tsx`
(la schermata: «Ho almeno 14 anni» parte da NO e va confermato ogni volta, sigla proposta, informativa, PARTECIPA/ANNULLA; la
sigla si scrive con le lettere o, col pad, INVIO e poi ↑↓), le due righe in `components/OptionsScreen.tsx`, i testi in
`locales/` (chiavi `options.game.tournament*`, `options.game.privacy*`, `tournament.*`), le prove in `tests/tournament.test.ts`.
`addHighscore` ora ricorda l'ultima sigla scritta (`pixelDebhLastInitials`): è quella che il torneo propone se non ne ha una sua.
`openPage` è passato da `updateService.ts` a `platform.ts`.

**Come si prova senza la chiave vera:** l'interruttore compare solo se la build ha `VITE_PIXELDEBH_TORNEO_CHIAVE`. Per lo
sviluppo basta un file `.env.local` nella radice con `VITE_PIXELDEBH_TORNEO_CHIAVE=<la chiave del sito di sviluppo>` (git lo
ignora: `*.local`). Per guardare le schermate: `/ui-sheet.html?screen=options&tab=3&torneo=1` (interruttore spento),
`&torneo=on` (acceso come DEB), `/ui-sheet.html?screen=tournament` (la schermata del consenso). Con la fase 1 il gioco non manda
ancora niente, neanche con l'interruttore acceso.

## Da dove viene

Nel progetto del sito (`C:\Users\Utente\Documents\GitHub\SITI-WEB\PIXELDEBH-Sito`) ci sono i due documenti che contano:

- **`docs/TORNEO-API.md`** — il contratto fra gioco e sito: **vale lui** se questa nota dice qualcosa di diverso;
- `docs/ANALISI-GIOCO-E-TORNEO.md` — l'analisi di fattibilità e, in cima, le decisioni di Simone.

Sul sito il torneo ha date di inizio e fine scelte da Deborah nel pannello; la classifica sta sotto la card del gioco in
`https://www.pixeldebh.it/gioco` e si aggiorna in tempo reale; a torneo finito Deborah proclama il vincitore.

## Le decisioni di Simone (6 novembre 2026)

1. **Il giocatore è la sigla di tre lettere** della classifica del gioco (A-Z): niente account, email o nome.
2. **I dati li manda solo il gioco**, firmati. Nessun punteggio scritto a mano.
3. **Vale solo la difficoltà normale.**
4. **Il LOOP vale, il «Continua» no**: una partita dall'inizio (Nuova partita), senza interruzioni. La pratica dalla scelta dei
   livelli e le partite con i trucchi di prova non valgono.
5. **La verifica per rigiocata** (`docs/CLASSIFICA_ONLINE.md`, livello 3) **più avanti**: per ora firma, controlli e moderazione.
6. **Una riga per copia del gioco**: la copia ha un codice casuale suo, mai mostrato.
7. **Nessun premio dichiarato.**
8. Sul sito il torneo compare sotto la card, aperto e in tempo reale; finito, con chi ha vinto.

## Che cosa va fatto nel gioco

1. **Opzioni → «Partecipa ai tornei di PixelDebh»** (EN «Take part in PixelDebh tournaments»), **spento di partenza**.
   Accenderlo chiede in una schermata: la conferma «Ho almeno 14 anni» e la sigla (proposta l'ultima usata nella classifica).
   Accanto, il link all'informativa `https://www.pixeldebh.it/privacy` (sezione «Il torneo del videogioco»). Spento: il gioco
   non manda niente.
2. **Il codice della copia**: alla prima accensione 16 byte da `crypto.getRandomValues`, salvati in `save.json` come 32
   caratteri esadecimali minuscoli (`services/storage.ts`, `services/settings.ts`).
3. **All'avvio**, con l'interruttore acceso: `GET https://www.pixeldebh.it/api/torneo.php?azione=stato`; nella schermata del
   titolo «Torneo aperto fino al …» (o «Torneo dal …» se è in arrivo).
4. **A fine partita** (`finishRun` e `handleGameCompleted` in `App.tsx`: game over o punteggio messo in banca alla vittoria), se il
   torneo è aperto: `POST …?azione=invia` con sigla, punteggio, livello raggiunto (1-14), LOOP come lo mostra l'HUD (1 = primo giro,
   `loopCount`), secondi di gioco senza le pause, versione, difficoltà, e i tre segnali `continuata` (la partita è nata da
   «Continua», `handleContinue`), `pratica` (`run.practice`), `trucchi` (`stats.tainted` di `engine/stats.ts`). Il sito li
   controlla tutti e rifiuta quello che non vale: il gioco li manda veri.
5. **Senza rete** la richiesta si mette da parte e si riprova all'avvio, solo finché il torneo è aperto.
6. **Opzioni → «Cancella i miei dati dal torneo»**: `POST …?azione=cancella`, poi codice nuovo e interruttore spento.
7. **La firma**: intestazione `X-Pixeldebh-Firma` = HMAC-SHA256 del corpo esattamente come viene spedito, in esadecimale minuscolo.
   **La chiave non entra nel repository** (è pubblico): la copia l'amministrazione dal pannello del sito (Il gioco → «La chiave
   per il gioco»), Simone la mette come **segreto di GitHub** (per esempio `VITE_PIXELDEBH_TORNEO_CHIAVE`: per Vite le variabili
   lette dal codice del gioco devono cominciare con `VITE_`), e `release.yml` la passa alla build come fa con le chiavi di firma.
   Senza chiave (build di sviluppo) l'interruttore non compare.
8. **La CSP dell'app** (`src-tauri/tauri.conf.json`, riga del `csp`): aggiungere `https://www.pixeldebh.it` a `connect-src`. Il
   sito risponde con le intestazioni CORS alle origini dell'app (`http://tauri.localhost`, `https://tauri.localhost`,
   `tauri://localhost`); in alternativa il plugin HTTP di Tauri, che non passa dal CORS.
9. **Testi** in `locales/it.ts` e `locales/en.ts`, anche le risposte del sito da mostrare (il sito manda `messaggio` in italiano;
   per l'inglese il gioco traduce dal codice `errore`).
10. **Prove**: il calcolo della firma contro un esempio fisso; la partita che vale e quelle che non valgono; la coda senza rete;
    una prova vera contro il sito di sviluppo (nel progetto del sito, server locale 8123) prima di pubblicare.
11. **Pubblicazione** di una versione nuova (per esempio la **1.19.0**): chi ha l'installatore o l'AppImage la riceve da sola;
    nel torneo Deborah può chiedere come versione minima proprio quella.

## Il contratto in breve (il dettaglio è in `TORNEO-API.md` del sito)

`POST https://www.pixeldebh.it/api/torneo.php?azione=invia`, `Content-Type: application/json`, `X-Pixeldebh-Firma: <hmac>`:

```json
{ "torneo": 3, "copia": "9f86d081884c7d659a2feaa0c55ad015", "sigla": "DEB", "punteggio": 123450, "livello": 9, "loop": 1,
  "durata": 1834, "versione": "1.19.0", "difficolta": "normal", "continuata": false, "pratica": false, "trucchi": false,
  "consenso": true, "giocata": 1762431834, "inviata": 1762431840 }
```

Tutti i numeri sono interi; `giocata` e `inviata` sono secondi Unix. Risposta buona: `{ "ok": true, "migliorato": true,
"migliore": 123450, "posizione": 4, "messaggio": "…" }`. Errori: 400 `dati`/`numeri`, 403 `firma` (chiave sbagliata:
«aggiorna il gioco»), 404 `torneo`, 409 `chiuso`/`regole`/`versione`/`consenso`, 429 troppe richieste, 503 `servizio`.

Il sito scarta anche i numeri impossibili: livelli completati in meno di 20 secondi l'uno, più di `30.000 + durata × 2.500`
punti. Se il bilanciamento del gioco cambia (punti dei nemici, della catena, dei boss), quelle soglie vanno riviste nel sito
(`public/lib/torneo.php`, costanti `TORNEO_*`).
