# Una classifica online per tutti: relazione di fattibilita'

> **Stato: SOSPESA (2026-10-18).** L'autore ha deciso di non farla per ora: rendere l'invio dei punteggi compatibile con le regole legali, la privacy e il GDPR gli sembra troppo complicato. L'idea resta per il futuro prossimo. Questa relazione copre la parte tecnica; **manca ancora la valutazione GDPR** (base giuridica, informativa, tempi di conservazione, diritto di cancellazione, dove stanno i dati: un server in UE o Cloudflare). Va fatta prima di scrivere codice. Nel frattempo il gioco ha solo la classifica locale, che non invia nulla.

**In breve.** Si puo' fare, costa zero (o quasi) e si puo' costruire in due tempi. Il punto difficile non e' mostrare la classifica a tutti: e' farla **vera**, cioe' impedire che chiunque scriva "999.999.999" con due righe di codice. Questo e' un gioco gratuito che gira sul computer del giocatore, quindi di suo non c'e' modo di fidarsi di un punteggio che arriva da fuori. Si risolve a strati: controlli semplici subito, e poi una verifica vera, resa possibile da una cosa che il gioco ha gia': **il motore e' puro e deterministico**.

## 1. Che cosa serve, in generale

1. **Un posto centrale** dove i punteggi si salvano e da cui tutti li leggono (un piccolo server, o un servizio gia' pronto).
2. **Il gioco che manda il punteggio** a fine partita e **legge la classifica** per mostrarla (oggi c'e' solo la "Hall of Fame" locale, in `save.json`).
3. **Regole contro i trucchi** e contro lo spam.
4. **Un piano per quando non c'e' rete** (il gioco deve restare giocabile offline, come oggi).

## 2. Le strade possibili

| Strada | Come funziona | Pro | Contro |
|---|---|---|---|
| **A. Servizio gia' pronto** (Supabase, Firebase) | Il gioco scrive in un database ospitato; si legge con una chiamata | Veloce da avviare, nessun codice server | Le regole di sicurezza sono scomode per "scrivi ma non barare"; alcuni piani gratuiti si addormentano se nessuno li usa (Supabase) |
| **B. Una piccola API serverless** (Cloudflare Workers + D1, oppure Deno Deploy, Vercel) | Due indirizzi: `GET` per leggere, `POST` per mandare un punteggio; il codice controlla tutto prima di salvare | Gratuito per il nostro volume, non si addormenta, tutto nostro e controllabile, **puo' eseguire lo stesso TypeScript del motore** | Un po' di codice da scrivere e da tenere |
| **C. Appoggiarsi a GitHub** (Issues, Gist, un file JSON aggiornato da una Action) | Si scrive "in repository" | Niente account nuovi | **Non va**: servirebbe una chiave di scrittura dentro il gioco (chiunque la estrae), limiti di richieste, lentezza |
| **D. Piattaforme** (Steam, itch.io) | Classifiche fornite dalla piattaforma | Gia' fatto | Steam costa e vincola; itch.io non ha classifiche per giochi scaricati |

**Consiglio: la strada B, su Cloudflare** (Workers per il codice, D1 per i dati: gratuito fino a molte migliaia di richieste al giorno, nessun "sonno", un indirizzo `workers.dev` gratuito). E' anche l'unica che permette la verifica vera descritta sotto.

## 3. Il problema vero: i trucchi

Un gioco offline manda al server un numero e il server non ha modo di sapere se e' onesto. Tre livelli di difesa, dal piu' semplice al piu' forte:

**Livello 1 - controlli di buon senso (subito).**
-   Limiti: un punteggio non puo' superare cio' che la partita permette in quel tempo (punti massimi per livello, durata minima di una partita). Si scartano i numeri impossibili.
-   Velocita': un massimo di richieste per dispositivo e per indirizzo (l'indirizzo si tiene solo come impronta, mai in chiaro).
-   Un filtro sulle sigle (lista di parole vietate) e un modo per **cancellare una voce a mano** (un comando di amministrazione protetto da una chiave che sta solo da noi).
-   Costo: poche ore. Ferma i trucchi pigri e lo spam, **non** chi ha voglia di studiare il gioco.

**Livello 2 - invio firmato (poco costo, poca forza).**
-   Il gioco firma ogni invio con una chiave contenuta nell'eseguibile. Chi sa smontare l'eseguibile la trova: alza solo l'asticella. Utile contro chi scrive a mano alle API.

**Livello 3 - verifica per rigiocata (la soluzione vera).**
-   Il motore del gioco (`engine/`) e' una simulazione **pura a 60 passi fissi** e accetta un generatore casuale con seme. Quindi una partita e' interamente determinata da: il seme e **i tasti premuti a ogni passo**.
-   Il gioco registra i tasti (si comprimono benissimo: cambiano di rado; una partita intera sta in poche decine di KB) e li manda insieme al punteggio.
-   Un verificatore (lo stesso TypeScript del motore, in Node o in un worker) **rigioca la partita** e controlla che il punteggio finale sia davvero quello. Se non torna, la voce non entra.
-   Il costo e' di calcolo: una partita lunga sono circa 100.000 passi. Sui Workers gratuiti il tempo per richiesta e' troppo corto, quindi la verifica si fa **dopo**, in modo asincrono (una coda, o una GitHub Action a orari, o un piccolo processo): la voce compare subito come "non verificata" e diventa "verificata" quando la rigiocata combacia. La classifica ufficiale puo' mostrare solo le verificate.
-   Cosa richiede: rendere deterministico anche cio' che oggi usa `Math.random` e il tempo di gioco (il motore gia' accetta un `rng` iniettato; resta da fissare il seme e registrare gli ingressi), e un test che rigiochi una partita registrata e ottenga lo stesso punteggio.
-   E' la strada che rende la classifica "vera" davvero: con il solo segnale del punteggio non si puo' barare, bisogna giocare **quella** partita con quei tasti, e allora e' un'impresa vera (o un robot, e anche i robot si possono segnalare).

## 4. Come si presenta al giocatore

-   La schermata della Hall of Fame ha due schede: **MONDIALE** e **LOCALE**. La locale c'e' gia' e resta (funziona offline).
-   Fra le viste: "Sempre", "Questo mese", "Questa settimana" (le classifiche periodiche tengono viva la gara anche quando i primi posti sono irraggiungibili).
-   Dopo una partita buona: "Punteggio inviato" oppure "In attesa di rete" (si salva in un elenco locale e si riprova all'avvio dopo).
-   **Sigle di tre lettere come oggi** (niente nomi, niente dati personali), oltre a un identificativo anonimo del dispositivo per riconoscere "le tue voci".
-   Un interruttore nelle opzioni: **"Invia i miei punteggi online"** (si sceglie al primo punteggio). Con l'interruttore spento tutto resta locale.

## 5. Privacy e regole

-   Si raccolgono solo: sigla, punteggio, livello raggiunto, LOOP, durata, versione del gioco, identificativo anonimo, (con la verifica) la registrazione dei tasti. **Nessun dato personale.** L'indirizzo di rete serve solo a limitare le richieste e si conserva come impronta (hash con sale) per poco tempo.
-   Va scritta una nota in chiaro nella schermata dei crediti ("cosa viene inviato e perche'"), nel registro delle novita' e nel README.
-   Serve un modo per chiedere la cancellazione di una voce (anche solo una email o una issue su GitHub).

## 6. Costi e dipendenze

-   **Costi:** zero con i piani gratuiti di Cloudflare (migliaia di richieste al giorno, 5 GB di dati). Un dominio proprio e' facoltativo (`workers.dev` basta).
-   **Cosa serve da te:** un account Cloudflare gratuito (lo crei tu: io non posso creare account), e fare una volta il login con lo strumento `wrangler`, oppure darmi un token da mettere nei Secrets di GitHub (lo fai tu) perche' il rilascio possa pubblicare l'API in automatico.
-   **Cosa decidiamo insieme:** se la classifica ufficiale mostra solo i punteggi verificati; se vogliamo le classifiche settimanali/mensili; chi modera.

## 7. Piano di lavoro proposto

1.  **Fase 1 - base (circa una sessione):** l'API (`server/`, Cloudflare Worker + D1), gli invii con controlli di buon senso e firma, la lettura, il codice nel gioco (schede Mondiale/Locale, coda di invio offline, interruttore), i test, la pubblicazione dell'API da una Action quando vuoi tu.
2.  **Fase 2 - verifica (due o tre sessioni):** partita deterministica con seme, registratore degli ingressi, rigiocata nel verificatore, test "partita registrata = stesso punteggio", marchio "verificata", coda di verifica.
3.  **Fase 3 - rifiniture:** classifiche settimanali/mensili, strumenti di moderazione, segnalazione dei robot.

## 8. I rischi, detti chiaramente

-   **Senza la verifica per rigiocata la classifica non e' "vera"**, e' una classifica "di fiducia". Con spam, trucchi evidenti e moderazione si regge bene per un gioco di nicchia, ma non e' a prova di chi vuole barare.
-   Un servizio online va **tenuto**: se un giorno il piano gratuito cambia o l'API si rompe, il gioco continua a funzionare (locale), ma la classifica mondiale resta ferma. Per questo l'offline resta la base.
-   Una classifica pubblica attira anche abusi (sigle offensive): serve il filtro e la possibilita' di cancellare.

## 9. Raccomandazione

Partire dalla **Fase 1 su Cloudflare** appena pubblichiamo la prima release (e' piccola e rende gia' visibile la gara), e pianificare la **Fase 2** subito dopo: il fatto che il motore sia gia' puro e deterministico e' un vantaggio raro, e rende la classifica davvero affidabile senza dover sorvegliare nessuno.
