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
| 2 | Stato del torneo all'avvio, invio firmato a fine partita, coda senza rete, «Cancella i miei dati», CSP (punti 3-8) | **Fatta il 6 novembre 2026** |
| 3 | Prova vera contro il sito (punto 10): fatta sul runtime isolato del sito, non sul database di sviluppo della 8123 | **Fatta il 6 novembre 2026** |
| 4 | Segreto di GitHub, `release.yml`, versione 1.19.0 (punti 7 e 11) | **Preparata il 6 novembre**: `release.yml` passa la chiave alla build e non crea release senza; versione 1.19.0, `log/1.19.0.md`, README. Il segreto `VITE_PIXELDEBH_TORNEO_CHIAVE` **c'è dal 6 novembre** (preso dal database del sito vero, scaricato in sola lettura con `aggiorna_prod.py copia` in `_SEGRETI/copie-sito/2026-11-06-chiave-torneo/`, e passato a `gh secret set` senza mostrarlo). **Manca**: la bozza, la prova dell'exe della bozza, l'OK per pubblicare, la landing Ecosystem |

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
`&torneo=on` (acceso come DEB), `/ui-sheet.html?screen=tournament` (la schermata del consenso). Con `&torneo=on`, anche
`&stato=aperto` o `&stato=in_arrivo` (una risposta del sito inventata: l'avviso sul titolo) e `&avviso=good|info|bad` (il
messaggio dopo una partita).

**Fase 2, dove sta:** `services/tournamentApi.ts` (stato, invio, coda, cancellazione; le regole sulle partite in
`whyNotCounted`), `services/hmac.ts` (HMAC-SHA256 scritto in TypeScript: `crypto.subtle` c'è solo in un contesto sicuro, e su
Linux la pagina dell'app è `tauri://localhost`), `components/TournamentBanner.tsx` (in basso a destra nel titolo: «Torneo aperto
fino al …» o «Torneo dal …», più la sigla, o in rosa «vale solo la difficoltà normale» / «aggiorna il gioco»),
`components/TournamentToast.tsx` (la risposta del sito per 6 secondi, in alto a destra, sopra ogni schermata), la riga «Cancella i
miei dati dal torneo» nelle Opzioni (compare quando la copia ha un codice; chiede una seconda pressione), `connect-src` con
`https://www.pixeldebh.it` in `src-tauri/tauri.conf.json`, le prove in `tests/tournamentApi.test.ts`. Scelte fatte qui:

- **Quando si manda:** a ogni fine partita che passa da `finishRun` in `App.tsx`: game over, punteggio messo in banca alla
  vittoria e anche «esci al titolo» dalla pausa (anche quella è la fine della partita; finisce pure nella classifica locale).
  Prima dell'invio il gioco richiede lo stato (il torneo può essersi chiuso o aperto mentre si giocava). Non si mandano le
  partite che non valgono (il gioco le scarta da sé, con un avviso se la colpa è della difficoltà o del «Continua»), né quelle
  a zero punti.
- **La durata** è l'orologio del motore (`w.elapsed`, fermo in pausa), sommato sui LOOP; il LOOP è `loopCount`; il livello è
  quello in cui si era (14 dopo una vittoria messa in banca).
- **I trucchi:** oltre al God Mode (`stats.tainted`), segnano la partita anche la sonda di prova `window.__pdGame` (`load`,
  `god`, `warp`, `bossHp`) e i tasti di sviluppo `9`, `L`, `0`: chi sblocca la sonda in una build di rilascio non può
  saltare livelli e mandare il punteggio.
- **L'orologio:** gli orari `giocata` e `inviata` si correggono con l'`ora` del sito (lo scarto si misura a ogni `stato`).
- **La coda** (`pixelDebhTournamentQueue` in `save.json`): senza rete, con 429 o 503; al massimo 10 voci, restano le migliori;
  all'avvio parte solo quella del torneo aperto adesso e della copia attuale, le altre si buttano.
- **Cancellare:** solo se il sito risponde sì il gioco dimentica il codice e spegne l'interruttore (senza rete non cambia
  niente: i dati resterebbero sul sito senza più modo di raggiungerli). Il codice nuovo nasce alla prossima accensione.
- **I messaggi:** in italiano quello del sito (`messaggio`), in inglese il nostro tradotto dal codice `errore`.

**Provato il 6 novembre** nell'exe di release (costruita con una chiave finta, `save.json` copiato prima e rimesso dopo, hash
uguale): la pagina raggiunge `www.pixeldebh.it` (CSP e CORS a posto, `stato` 200 con `torneo: null`), un altro sito resta
bloccato dalla CSP, l'interruttore compare, la schermata del consenso lo accende e subito dopo il gioco chiede lo stato. Con
`curl`: il preflight del POST risponde 204 con le intestazioni giuste. **Non provato:** un invio vero e una cancellazione vera
(sul sito di sviluppo, fase 3).

**Fase 3, com'è andata (6 novembre).** Invece del database di sviluppo della 8123 (che è di Simone) si è usato il
**runtime isolato** del sito, quello dei collaudi: lo stesso codice PHP servito con `PIXELDEBH_PROVA_DIR` puntato su una
cartella usa e getta, con un SQLite suo e una chiave del torneo sua. Il progetto del sito non è cambiato (`git status` pulito,
database di sviluppo intatto). Due prove, entrambe verdi:

1. **Il client del gioco contro il sito** (`tools/dev/torneo/sito.test.ts`, 9 controlli): stato e orologio; una partita che
   vale → «Punteggio registrato: sei al posto 1.»; una più bassa → il record resta (frase del sito in italiano, la nostra in
   inglese); **l'orologio del PC avanti di due ore**: con la correzione la partita passa, senza il sito risponde `chiuso`; le
   partite che non valgono tornano indietro con `regole` e `numeri` (e `versione`), una chiave sbagliata con `firma`; la coda
   parte al riavvio; la classifica pubblica mostra DEB; la cancellazione svuota tutto.
2. **Una partita vera nell'exe di release** (exe di prova con l'indirizzo del runtime isolato, la sua chiave e la CSP allargata
   solo per quella build; `save.json` copiato prima e rimesso dopo, hash uguale): origine `http://tauri.localhost`, interruttore
   acceso dalle Opzioni, nel titolo «TORNEO APERTO FINO AL 8 NOVEMBRE ALLE ORE 14:39 · PARTECIPI COME AAA», Nuova partita
   giocata con i tasti (13 secondi, 250 punti, nessuna sonda), «esci al titolo» → il gioco chiede lo stato, fa il preflight
   (204), manda (200) e mostra «Punteggio registrato: sei al posto 1.». Il sito ha salvato AAA, 250 punti, livello 1, LOOP 1,
   17 secondi, versione 1.18.2, valida. Poi Opzioni → «Cancella i miei dati dal torneo» due volte → preflight 204, POST 200,
   «Fatto: il sito non ha più nessun dato di questa copia del gioco.», interruttore spento, classifica vuota.

Imparato: il sito frena a **30 scritture ogni 10 minuti per rete** (risponde 429): il gioco mette da parte e riprova, come
deve; per le prove `prepara.php apri` azzera i contatori del solo runtime isolato. **Non provato:** la coda nell'exe con la
rete staccata davvero (la logica è la stessa provata in Node e nei test), Linux.

**Come si rifà** (Windows, PHP di MAMP; `<dir>` è una cartella vuota con dentro `.data`, `.cache` e `uploads`):

```bash
# 1. il server del sito, isolato (dalla cartella del progetto del sito)
PIXELDEBH_PROVA_DIR=<dir> C:/MAMP/bin/php/php8.2.14/php.exe -d extension=gd -d extension=intl -d extension=fileinfo -S 127.0.0.1:8125 -t public public/dev-router.php
# 2. schema, freni azzerati e un torneo aperto (dalla cartella del gioco)
PIXELDEBH_PROVA_DIR=<dir> TORNEO_VERSIONE_MINIMA=1.18.2 C:/MAMP/bin/php/php8.2.14/php.exe tools/dev/torneo/prepara.php apri > <dir>/stato.json
# 3. il client contro il sito
TORNEO_PROVA_STATO=<dir>/stato.json npx vitest run --config tools/dev/torneo/vitest.config.ts
# 4. (facoltativo) un exe di prova: la chiave è "chiave" in stato.json; la CSP con http://127.0.0.1:8125 in un file JSON
#    {"app":{"security":{"csp":"…connect-src 'self' ipc: http://ipc.localhost https://www.pixeldebh.it http://127.0.0.1:8125; …"}}}
VITE_PIXELDEBH_TORNEO_URL=http://127.0.0.1:8125/api/torneo.php VITE_PIXELDEBH_TORNEO_CHIAVE=<chiave> npx tauri build --no-bundle --config <csp.json>
```

L'exe di prova usa lo stesso `save.json` del gioco installato (`%APPDATA%\com.pixeldebh.retrorescue\save.json`): copiarlo prima
e rimetterlo dopo. Finita la prova, ricompilare l'exe normale (`npx tauri build --no-bundle`) perché non resti in giro una build
che punta al server di prova. Da `npm run dev` o `tauri dev` non si prova: l'origine `http://localhost:3000` non è fra quelle a
cui il sito risponde (`TORNEO_ORIGINI`).

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
