# Come è licenziato «PixelDebh: Retro-Rescue!»

Copyright © 2026 Simone Pizzi (Pitz72). Il repository ha **tre regimi**: una licenza per il codice, una per il contenuto creativo e i **diritti riservati** per nomi, loghi e animazioni d'apertura. La scelta è dell'autore ed è stata fatta il 17 ottobre 2026, sul modello di [Il Relitto Silente](https://github.com/Pitz72/il-relitto-silente-opensource) e di [Il Viaggiatore](https://github.com/Pitz72/il-viaggiatore-favella).

## In breve

| Che cosa | Licenza | Che cosa puoi fare |
|---|---|---|
| **Il codice** | [MIT](LICENSE) | tutto, anche venderlo, tenendo l'avviso di copyright |
| **Le musiche, la grafica vettoriale, i testi di presentazione** | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.it) | usarli, adattarli e condividerli **citando l'autore**, **senza scopo commerciale**, e **alle stesse condizioni** |
| **Nomi, loghi, icone, animazioni d'apertura** | **Tutti i diritti riservati** | solo il gioco com'è, senza modifiche. Un'opera derivata deve toglierli o sostituirli |

Per citare l'autore: «© 2026 Simone Pizzi — PixelDebh: Retro-Rescue!», con un link a questo repository, la licenza e l'indicazione di eventuali modifiche.

## Che cosa sta sotto quale licenza

**MIT (il codice):**

- `engine/` (il motore a 60 Hz), `hooks/`, `locales/` (le stringhe dell'interfaccia seguono il codice)
- `audio/`: il motore audio e gli effetti sonori, che il codice sintetizza da sé
- `renderer/` (il disegno a schermo con PixiJS, le luci, le particelle), tranne i file di grafica elencati sotto
- `components/` e `services/` (interfaccia, menu, impostazioni, salvataggi, aggiornamenti), tranne i file di grafica elencati sotto
- `levels.ts`, `mazeGen.ts`, `trophies.ts`, `constants.ts`, `types.ts`, `App.tsx`, `GameScreen.tsx`, `index.tsx`, `index.html`, `index.css` e le impostazioni di build
- `tests/`, `tools/`, `.github/` (compreso il flusso di rilascio)
- `src-tauri/` (l'app Tauri in Rust), tranne le icone
- la documentazione tecnica: `README.md`, `docs/` (tranne `MUSIC_BRIEF.md`), `log/`

**CC BY-NC-SA 4.0 (il contenuto creativo):**

- **le musiche**: gli 8 brani in `public/audio/music/`, generati con Lyria (vedi più sotto)
- **il disegno di Debh**: `characters/debh/` (le parti, la palette), tranne le forme tracciate dal logo, che sono riservate
- **i boss**: `components/bosses/FrogArt.tsx`, `components/bosses/ChickenEyeArt.tsx`, `components/ShadowHeadBoss.tsx`
- **i nemici e gli oggetti da raccogliere**: `services/enemyArt.tsx`, `services/assetService.tsx`
- **gli sfondi dei mondi e il caveau**: `renderer/worldArt.ts`, `renderer/vaultArt.ts`, `components/Background.tsx`
- **i testi di presentazione**: `PRESENTAZIONE.md` e `docs/MUSIC_BRIEF.md`

Il criterio, se un file non è nell'elenco: ciò che **disegna** un personaggio, un nemico, un boss, un oggetto o uno sfondo è contenuto; ciò che lo **muove, lo cuoce in texture o lo mostra** è codice.

## Che cosa è riservato (nessuna delle due licenze)

**Tutti i diritti riservati.** Si possono ridistribuire solo come parte di questo gioco, senza modifiche; un'opera derivata deve toglierli o sostituirli, e non può presentarsi come il gioco ufficiale del canale.

- **I nomi**: PixelDebh, Pixel Debh, Debh, «PixelDebh: Retro-Rescue!», Runtime Multimedia e i nomi dei personaggi, dei nemici e dei boss del gioco (Globby, Hoppy, Flappy, Bomby, Ghosty, Cyclops Frog, LeGallineNellOcchi, CapocciaNelBuio).
- **I loghi**: il logo del canale PixelDebh (`public/pixeldebh-logo.png`), le forme di Debh tracciate da quel logo (`characters/debh/traced/`), le icone dell'app (`src-tauri/icons/`) e il marchio di Runtime Multimedia (`intro/runtimeForme.ts`).
- **Le animazioni d'apertura**: l'intro animata di PixelDebh (`public/intro/pixeldebh-intro.webm`) e l'animazione, con il suo suono, del logo di Runtime Multimedia (la cartella `intro/`). La stessa animazione resta MIT nel suo repository d'origine, *Il Relitto Silente*: qui è riservata.

## Che cosa non è coperto

- **Le dipendenze di terzi** hanno le loro licenze: React, PixiJS, pixi-filters, Tauri, Vite, Tailwind CSS e Vitest (MIT o MIT/Apache-2.0); i caratteri **Orbitron** e **Press Start 2P** (SIL Open Font License 1.1).
- **I marchi di terzi**: i nomi delle console e degli oggetti retro (Atari 2600, Amiga 500, NES, Sega Mega Drive, CD-ROM e simili) appartengono ai rispettivi titolari. Qui sono disegni originali, senza loghi e senza alcun legame con i titolari.

## Che cosa è stato fatto con l'intelligenza artificiale

- **Le musiche** sono generate con **Lyria** (Google) dall'account dell'autore, che le ha scelte e dirette; i brani generati con Lyria portano la filigrana SynthID di Google. L'elenco dei brani è nella schermata dei crediti del gioco. Gli effetti sonori no: li sintetizza il codice.
- **Il codice, la grafica vettoriale e l'intro animata** sono stati scritti dall'autore con l'aiuto di Claude (Anthropic). La dichiarazione è nel gioco, all'avvio e nei crediti.

L'autore concede in licenza il contenuto generato **per quanto di sua spettanza**: **i Termini d'uso dei servizi che lo hanno generato prevalgono**, e il diritto d'autore su un'opera generata con l'IA non è sempre riconosciuto. Chi vuole usare questi file oltre la licenza deve controllare i Termini attuali di Google.

## La storia del repository

Fino a questa scelta il repository era pubblico **senza licenza**. La scelta vale dal commit che la introduce in avanti e si applica allo stesso modo ai file già presenti.

## Il testo completo della licenza dei contenuti

[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode.it).
