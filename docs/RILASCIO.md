# Come si pubblica una versione

Il gioco si costruisce e si pubblica **solo quando lo decidi tu**. Nessun push e nessun tag fa partire niente: la build parte dal pulsante «Run workflow» nella scheda **Actions** del repository (workflow **Build and release**, file `.github/workflows/release.yml`).

## Che cosa produce

| Dove | File | Si aggiorna da solo? |
|---|---|---|
| Windows | l'installatore (`...-setup.exe`) | **Si**: all'avvio il gioco cerca una versione nuova e, con il tasto `U`, la scarica, la installa e si riavvia |
| Windows | `PixelDebh-<versione>-portable.exe` (nessuna installazione) | **No, ma avvisa**: mostra «nuova versione disponibile» e con `U` apre la pagina di download |
| Linux | `.AppImage` | **Si**, come l'installatore |
| Linux | `.deb`, `.rpm` | No: avvisa e rimanda alla pagina (l'aggiornamento di un pacchetto spetta al gestore dei pacchetti) |

Gli aggiornamenti arrivano dalle **Release di GitHub**: il gioco legge `latest.json` dall'ultima release **pubblicata** (`https://github.com/Pitz72/PixelDebhTheGame/releases/latest/download/latest.json`) e controlla la firma con la chiave pubblica scritta in `src-tauri/tauri.conf.json`. Un pacchetto non firmato da te non si installa.

## La prima volta: i due segreti

La build firma i pacchetti dell'aggiornamento con una chiave privata. Le chiavi sono state create in `C:\Users\Utente\.pixeldebh-signing\` (fuori da ogni repository; leggi `LEGGIMI.txt` lì dentro). Nel repository GitHub devono esserci due segreti (**Settings > Secrets and variables > Actions > New repository secret**):

-   `TAURI_SIGNING_PRIVATE_KEY`: il contenuto del file `pixeldebh.key`
-   `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: il contenuto del file `password.txt`

Oppure da riga di comando (con `gh` gia' collegato):

```bash
gh secret set TAURI_SIGNING_PRIVATE_KEY < C:/Users/Utente/.pixeldebh-signing/pixeldebh.key
gh secret set TAURI_SIGNING_PRIVATE_KEY_PASSWORD < C:/Users/Utente/.pixeldebh-signing/password.txt
```

**Fai una copia sicura della cartella delle chiavi.** Se la chiave privata si perde non si possono piu' pubblicare aggiornamenti che i giochi gia' installati accettino: bisognerebbe far reinstallare tutti a mano, con una chiave nuova.

## Pubblicare una versione, passo per passo

1.  **Il numero di versione**: cambialo nei tre posti che devono coincidere, `package.json`, `src-tauri/tauri.conf.json` e `src-tauri/Cargo.toml` (e i lock: `npm install` e una build di Cargo li aggiornano). Il workflow controlla che siano uguali.
2.  **Il log**: scrivi `log/<versione>.md` (il workflow non pubblica una release senza). E' la pagina che la release indica come «Novita'».
3.  **Commit e push su `main`.** Non parte nessuna build.
4.  **Una prova (facoltativa)**: Actions > Build and release > Run workflow > `mode = build-only`. Costruisce Windows e Linux e lascia i file come allegati della corsa, senza pubblicare niente.
5.  **La bozza**: `mode = draft` (e' il valore predefinito). Costruisce, firma e crea la release **in bozza** `v<versione>` con tutti i file e `latest.json`. Una bozza **non e' visibile** a nessuno, ne' ai giocatori ne' ai giochi che cercano aggiornamenti.
6.  **Pubblicare**: apri la bozza su GitHub (Releases), controlla i file e le note, premi **Publish release**. Da quel momento diventa la «Latest» e i giochi installati la offrono. (Oppure lancia direttamente `mode = publish`.)
7.  **La landing del gioco nel catalogo Ecosystem**: nel repo `C:\Users\Utente\Documents\GitHub\SITI-WEB\ECOSYSTEM` aggiorna la scheda `pixeldebh-retro-rescue` in `src/data/products.json` (versione, nomi dei file nei link di download, riga «Versione» della scheda tecnica), poi `npm run build`, la voce nel CHANGELOG del sito e il deploy. I link puntano a una versione precisa: se non li aggiorni, il sito offre la release vecchia.

Da riga di comando: `gh workflow run release.yml -f mode=draft` e poi `gh run watch`.

## Dopo la pubblicazione

-   Chi ha l'installatore (o l'AppImage) vede in alto nella schermata del titolo **«Nuova versione X disponibile»** e preme `U`: scarica, installa e riavvia da solo.
-   Chi usa la versione portable (o i pacchetti Linux) vede lo stesso avviso e con `U` si apre la pagina della release.
-   Il controllo avviene una volta per avvio, solo nelle schermate del titolo (mai durante una partita); se non c'e' rete o non c'e' ancora una release, tace.

## Cosa non e' ancora provato

-   La build su GitHub (Windows e Linux) **e' collaudata**: la prima corsa vera e' stata il 2026-10-17 (servirono tre corse: un test che dipendeva dalla lingua del PC e un pacchetto di sistema di Ubuntu 22.04 in conflitto, vedi `docs/NEXT_SESSION.md`). Le release 1.18.0 e 1.18.1 sono state costruite e pubblicate cosi'.
-   L'aggiornamento automatico e' **provato**: 1.18.0 installata con il setup si e' aggiornata da sola alla 1.18.1.
-   L'installatore **non e' firmato con un certificato di firma del codice, ed e' una scelta** (2026-10-17): **Windows SmartScreen** mostra un avviso la prima volta («Ulteriori informazioni» > «Esegui comunque»), e smette da solo quando il file ha abbastanza scaricamenti. SignPath Foundation, il servizio gratuito per l'open source, non e' possibile: chiede una licenza approvata OSI per tutti i componenti, e il gioco ha contenuti CC BY-NC-SA e loghi a diritti riservati (vedi `LICENZE.md`). L'avviso va spiegato nella pagina di download.
