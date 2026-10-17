# PixelDebh: Retro-Rescue! - Un'Avventura Nata dalla Collaborazione tra Uomo e AI

Benvenuti nella pagina di presentazione di **PixelDebh: Retro-Rescue!**, il videogioco ufficiale del canale YouTube di PixelDebh: un platform 2D in grafica vettoriale HD, per Windows e Linux, che parte sempre a schermo intero. Nasce da un dialogo creativo: quello tra la visione di un autore e le capacita' di un modello di intelligenza artificiale. Questo documento racconta il gioco, come e' stato fatto e che cosa c'e' dentro.

*Di Simone Pizzi - Runtime Multimedia.*

---

## Un Progetto Speciale: Creativita' Umana, Realizzazione AI

Lo sviluppo di "PixelDebh" non segue un percorso tradizionale. Nasce da una collaborazione:

-   **La Visione Umana:** l'autore mette l'idea, la direzione creativa, le scelte di progetto e il giudizio su cio' che funziona e cio' che no. Decide come deve essere il gioco, come deve sembrare e come deve sentirsi.
-   **L'Esecuzione AI:** il codice, la grafica vettoriale e l'intro animata sono stati scritti con l'aiuto dei modelli **Claude (Anthropic)**; le musiche sono state generate con **Lyria (Google)**, e scelte e dirette dall'autore; gli effetti sonori sono sintetizzati dal motore audio del gioco. L'IA e' stata lo strumento. L'ingegno e' dell'autore.

Questo "sviluppo conversazionale" permette di provare, correggere e rifinire le idee in tempo reale. Ogni versione ha il suo log di sviluppo (cartella `log/`): dice che cosa e' stato fatto, che cosa e' stato verificato e, con la stessa franchezza, che cosa **non** e' stato verificato.

---

## Il Mondo di PixelDebh

### Grafica vettoriale HD
Niente pixel art: tutto e' disegnato in vettoriale e mostrato con luci dinamiche, bagliore e particelle (PixiJS, WebGL), nitido anche su uno schermo 4K. **Debh** e' fedele al logo del canale, alta 122 px sullo schermo, con animazioni complete: riposo, corsa, salto, capriola, cattura, lancio, mira, danno ed esultanza con il pollice alzato.

### Quattordici livelli e tre mondi
L'avventura e' fatta di tre mondi da tre livelli e un boss ciascuno, poi un labirinto e uno scontro finale:

-   **Il mondo al neon** (livelli 1-3): la citta' ai margini, con le montagne e il sole retro.
-   **La raffineria** (livelli 5-7): torri di raffreddamento, ciminiere, gru e forni accesi nello smog.
-   **Il regno etereo** (livelli 9-11): isole che galleggiano su un mare di nuvole, cristalli che brillano, un'aurora e un pianeta con gli anelli.
-   **I boss** (livelli 4, 8, 12): una cittadella in rovina sotto una luna rossa crepata.
-   **Il labirinto** (livello 13): corridoi stretti, camera che segue Debh da vicino, tutti gli oggetti da raccogliere prima che scada il tempo, nello spirito dell'Atari 2600.
-   **Il caveau del collezionista** (livello 14): una sala-museo piena di console giganti, dove i **tre boss** aspettano Debh **tutti insieme**.

### Suono
Un brano per ciascun mondo, uno per ognuno dei tre boss, e uno per il titolo e per la classifica; gli effetti sono sintetizzati in tempo reale dal motore audio (canali pulse, triangolo e rumore, come nelle console di una volta).

---

## Gameplay: Semplice da Imparare, Appassionante da Padroneggiare

### La meccanica "Cattura e Lancia"
Il cuore del gioco e' l'abilita' di Debh: catturare i nemici e usarli come proiettili. Ci si avvicina, si cattura, si lancia contro gli altri: un lancio ben fatto abbatte piu' nemici insieme. Si salta due volte (e al secondo salto Debh fa una capriola), e battendo la testa contro una piattaforma si stordiscono i nemici che ci camminano sopra.

### Catene di K.O. e segnali
I K.O. a catena alzano il moltiplicatore dei punti (fino a x5). Ogni nemico **avvisa** prima di attaccare (Hoppy si accuccia, Bomby si gonfia, la rana e l'occhio si illuminano), cosi' ogni colpo si puo' leggere e schivare.

### Un bestiario vario
-   **Globby:** lo slime di gelatina, prevedibile ma tenace.
-   **Hoppy:** il droide a molla che salta a sorpresa.
-   **Flappy:** il pipistrello-drone che pattuglia i cieli.
-   **Bomby:** il carro mortaio che lancia bombe a parabola e vi obbliga a muovervi.
-   **Ghosty:** lo spettro che vi segue attraversando muri e piattaforme.

### Gli oggetti da collezione e i potenziamenti
Per aprire il portale d'uscita bisogna raccogliere tutti gli oggetti retro del livello: joystick, floppy, cartucce, cassette, il gettone, un Atari 2600, un Amiga 500, la TV a tubo, il CD-ROM, un NES e un Mega Drive, che arrivano a poco a poco, livello dopo livello (Debh e' una collezionista). Quando ne restano pochi e sono lontani, una freccia indica la strada. Lungo il cammino ci sono potenziamenti facoltativi:
-   **Scudo:** vi protegge da un colpo.
-   **Turbo:** aumenta la velocita'.
-   **Super lancio:** trasforma il nemico lanciato in una bomba che ne abbatte molti.

### Molle e piattaforme mobili
Molle verdi che lanciano molto in alto, ascensori e traghetti nel cielo: portano a mensole facoltative con un potenziamento in cima.

### Boss a fasi
-   **Rana Ciclope:** una sfera verde con la pupilla a fessura, braccia e gambe che si muovono, che lancia CD-ROM rotanti.
-   **LeGallineNellOcchi:** un occhio gigante con una gallina che ci passeggia dentro, e le sue uova a ventaglio.
-   **CapocciaNelBuio:** il boss finale, nel buio, a gravita' zero: il gioco diventa uno sparatutto in cui Debh si muove libera in ogni direzione.

Ogni boss, sotto meta' e sotto un quarto della vita, attacca e si muove piu' in fretta. Contro i boss Debh spara; nel caveau, tutti e tre insieme.

---

## Pensato per tutti i giocatori

-   **Comandi:** tastiera e **gamepad**, con **tasti rimappabili**.
-   **Lingue:** italiano e inglese in ogni schermata.
-   **Difficolta':** facile, normale e difficile; a ogni giro successivo (LOOP) i nemici sono piu' veloci.
-   **Continua** dall'ultimo livello e **selezione del livello** per allenarsi.
-   **22 trofei** in quattro categorie (normali, rari, difficili e di completamento), e una **classifica** in stile arcade con le iniziali.
-   **Accessibilita':** scuotimento, lampi, pausa sui colpi e movimento nelle intro si possono ridurre o spegnere.
-   **Schermi:** si adatta a ogni dimensione e densita' di pixel (fino al 4K) e funziona a qualsiasi frequenza dello schermo, anche 144 Hz: la simulazione gira sempre a 60 passi al secondo e l'immagine viene interpolata.

---

## Sotto il cofano

Il motore del gioco e' TypeScript puro con un passo fisso a 60 Hz, separato dal disegno e dal suono; il disegno e' PixiJS (WebGL); l'app desktop e' Tauri 2, con aggiornamento automatico per chi usa l'installatore. Ci sono oltre 580 test automatici (motore, livelli raggiungibili con un robot che li gioca, meccaniche, audio, caricamento delle schermate) e ogni versione e' provata nell'eseguibile vero prima di essere pubblicata.

---

## Dove siamo

"PixelDebh: Retro-Rescue!" e' completo in tutte le sue parti e sara' gratuito. Restano da fare, con calma, la **messa a punto giocando** (difficolta', forza delle molle, tempi di ascensori e traghetti, durata delle catene di K.O.), la prima pubblicazione dei programmi di installazione e, forse, una classifica online.

Grazie per aver dedicato del tempo a scoprire il progetto. Speriamo che l'impegno e la passione messi in "PixelDebh: Retro-Rescue!" si vedano in ogni livello e si sentano in ogni nota.
