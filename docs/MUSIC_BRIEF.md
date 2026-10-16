# Brief musica per Lyria

Il gioco ha bisogno di **10 brani**. Gli effetti sonori sono già sintetizzati dal codice (`audio/sfx.ts`); la musica si genera fuori e si inserisce con uno strumento che trova da solo il punto di loop, porta tutto allo stesso volume e codifica in OGG.

## File da produrre

Nomi esatti (estensione `.mp3`, `.wav`, `.flac`, `.ogg` o `.m4a`):

| File | Dove suona | Tipo | Durata che serve |
|---|---|---|---|
| `title` | schermata iniziale e classifica che scorre | loop | 60-90 s |
| `world-adventure` | livelli 1, 2, 3 | loop | 60-90 s |
| `world-industrial` | livelli 5, 6, 8 | loop | 60-90 s |
| `world-ethereal` | livelli 9, 10, 12 | loop | 60-90 s |
| `boss-frog` | Rana Ciclope (livello 4) | loop | 60-90 s |
| `boss-chicken-eye` | LeGallineNellOcchi (livello 7) | loop | 60-90 s |
| `boss-shadow-head` | CapocciaNelBuio (livello 11, gravità zero) | loop | 60-90 s |
| `highscore` | inserimento delle iniziali | loop | 30-60 s |
| `victory` | fine del gioco | una volta sola | 6-12 s |
| `gameover` | game over | una volta sola | 4-8 s |

Se Lyria dà clip da 30 s per i loop va bene lo stesso: il loop sarà più corto ma funziona. Se una clip è più lunga di quanto serve per `victory` e `gameover`, si taglia.

## Regole valide per ogni prompt

Scrivi i prompt in inglese, funzionano meglio. Ripeti sempre questa base e aggiungi la riga del brano:

> Original 8-bit chiptune for a retro arcade platformer, NES style: two pulse-wave lead channels, a triangle-wave bass, noise-channel percussion. Instrumental only, no vocals, no samples. Steady tempo with no tempo changes. Seamless loop: it starts and ends at the same energy, no fade-in, no fade-out, no final cadence, no silence at the beginning or the end.

Evita nei prompt nomi di giochi, di compositori o di brani esistenti ("alla Super Mario", "stile Mega Man"): meglio descrivere il carattere con le parole.

Per i due brani una-tantum (`victory`, `gameover`) togli le parole su loop, fade e cadenza e chiedi invece una frase breve che finisce su una nota lunga con decadimento naturale.

## Brani

**title**: invito all'avventura, allegro e un po' eroico. 120-130 BPM, tonalità maggiore.
> …Heroic and playful title-screen theme, an invitation to adventure, memorable lead melody, 125 BPM, major key.

**world-adventure**: neon arcade solare, saltellante. Deve reggere dieci minuti senza stancare: energia media, un motivo breve che torna con piccole variazioni. 135-145 BPM, maggiore.
> …Bouncy, sunny neon-arcade adventure theme, catchy short motif that repeats with small variations, medium energy so it never gets tiring, 140 BPM, major key.

**world-industrial**: fabbrica, macchine, ritmo teso. 115-125 BPM, minore.
> …Driving factory-and-machines theme, tense minor key, syncopated bass line, metallic noise hits on the offbeats, 120 BPM.

**world-ethereal**: sognante, sospeso, spaziale. 95-105 BPM.
> …Dreamy floating space theme, slow shimmering pulse-wave arpeggios with echo, airy and mysterious, 100 BPM, minor-ish with open harmonies.

**boss-frog**: minaccia buffa ma pericolosa, palude. 145-155 BPM, minore.
> …Bouncy menace boss battle against a giant cyclops frog, comic but dangerous, wobbling swampy bass, minor key, 150 BPM.

**boss-chicken-eye**: frenetico, caotico, staccato. 160-170 BPM.
> …Frantic, chaotic boss battle, quirky staccato lead like clucking, relentless drums, threatening but a little absurd, 165 BPM.

**boss-shadow-head**: l'ultimo, il più buio, in gravità zero. 135-145 BPM, minore, tensione che sale.
> …Dark epic final boss battle in zero gravity, heavy half-time feel, dramatic minor arpeggios, rising tension, 140 BPM.

**highscore**: sala d'onore dell'arcade, festoso, breve. 115-125 BPM, maggiore.
> …Triumphant arcade hall-of-fame jingle loop, celebratory, bright major key, 120 BPM.

**victory**: fanfara.
> Original 8-bit chiptune victory fanfare, NES style, major key, joyful, about 8 seconds, ends on a final sustained chord with a natural decay.

**gameover**: frase discendente e triste.
> Original 8-bit chiptune game-over jingle, NES style, short sad descending phrase in a minor key, about 5 seconds, ends on one long final note.

## Consiglio pratico

Genera **tre varianti per brano** e scegli ascoltando: la musica generata varia molto da una versione all'altra, e la differenza tra una buona e una mediocre si sente subito. Per il loop contano di più un tempo costante e un'energia uniforme lungo tutto il brano.

## Inserimento nel gioco

1. Metti i file scelti in una cartella, con i nomi della tabella (anche solo quelli che hai, non servono tutti insieme).
2. Lancia lo strumento (serve Python con numpy e scipy, e ffmpeg):

   ```bash
   python tools/audio/prepare_music.py --src C:/percorso/della/cartella
   ```

   Per i soli brani che vuoi rifare: `--only title,boss-frog`.
3. Per ogni loop lo strumento stampa tempo, punti di loop e due controlli sulla giuntura (`seam rank` e `click`). Se vede un problema scrive `WARNING`.
4. Escono `public/audio/music/<brano>.ogg` e `manifest.json`: vanno inclusi nel commit.
5. Un brano senza file usa il loop sostitutivo integrato, quindi il gioco non resta mai muto.

**Cosa lo strumento non può fare**: ascoltare. Verifica numericamente che il loop cada sul battito, che non ci sia uno scatto e che il volume sia uniforme (-18 LUFS), ma se il passaggio dalla fine all'inizio suona bene lo decide chi ascolta. Per controllare, apri il gioco, lascia girare il livello e ascolta un paio di giri completi. I secondi del punto di loop sono nel manifest.

Un limite noto: lo strumento assume un tempo costante in 4/4. Se un brano generato rallenta o accelera, il rilevamento del battito sbaglia e il loop può cadere male; in quel caso rigenera il brano.

## Licenza e crediti

Prima di distribuire il gioco con questi brani leggi i termini d'uso Google dell'account con cui li generi: il modello aggiunge sempre una filigrana (SynthID) e le regole sull'uso commerciale dipendono dal piano. Per ogni brano tieni nota di data, modello, prompt e account in questa tabella, così la provenienza resta documentata:

| Brano | Data | Modello | Prompt (breve) | Account/piano |
|---|---|---|---|---|
| | | | | |
