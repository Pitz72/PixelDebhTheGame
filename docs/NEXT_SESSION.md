# Prompt per la prossima sessione (copia e incolla)

```
Riprendiamo il lavoro su PixelDebh: Retro-Rescue! (repo C:\Users\Utente\Documents\GitHub\PIXELDEBH, branch main, remoto Pitz72/PixelDebhTheGame).
Leggi prima: docs/NEXT_SESSION.md, docs/AUDIT.md, docs/MUSIC_BRIEF.md, README.md, log/1.3.0.md e la memoria del progetto.

Stato: Fasi 1-4 fatte e pubblicate su main (v1.2.0). Fase 5 (audio) fatta in locale, NON ancora committata: motore audio, 24 effetti sintetici, pannello `O`, caricamento musica da file con loop e crossfade, strumento tools/audio/prepare_music.py. Mancano solo i brani veri.
- Fase 1: motore di gioco puro in engine/ (timestep fisso 60 Hz) + bug gravissimi/gravi corretti + 76 test (npm test).
- Fase 2: app desktop Tauri v2 (src-tauri/), sempre a schermo intero, salvataggi in save.json, installatore Windows NSIS, pacchetti Linux (deb/rpm/AppImage) verificati in WSL2.
- Fase 3: renderer PixiJS/WebGL (renderer/) con luci dinamiche, bloom, particelle, parallasse, interpolazione; il vecchio DOM resta come ripiego.
- Fase 4: Debh vettoriale HD fedele al logo (characters/debh/), alta 122 px, hitbox 54x90, animazioni procedurali complete.

Richieste fisse dell'utente: gioco desktop Windows+Linux che parte SEMPRE a schermo intero; stile vettoriale HD (niente pixel art); musiche e suoni retrogaming; trovare e correggere criticita' (gravissime/gravi/medie/lievi).

Da fare ora, in ordine:
1. Fase 5 AUDIO, parte rimasta: i 10 brani (titolo, 3 mondi, 3 boss, classifica, vittoria, game over) li genera l'utente con Google Lyria 3.5 seguendo docs/MUSIC_BRIEF.md; poi `python tools/audio/prepare_music.py --src <cartella>` scrive i file e il manifest in public/audio/music/. Se l'utente li ha gia' messi: lancia lo strumento, leggi i WARNING, fai ascoltare i punti di loop e regola il bilanciamento musica/effetti con l'utente (i volumi predefiniti sono scelti a numeri, non a orecchio). Prima di distribuire: controllo licenza dei brani generati. Musica adattiva rimandata: senza stem separati serve prima sentire cosa produce Lyria. Verifica sempre sull'exe di release (sonda window.__pdAudio, vedi log/1.3.0.md). Non puoi ascoltare: il giudizio timbrico e' dell'utente.
2. Fase 6 meccaniche: guida ai collezionabili mancanti, combo, telegrafi dei nemici, boss a fasi, nuovi pericoli (molle, piattaforme mobili).
3. Nemici e sfondi potenziati in vettoriale HD (stessa tecnica del personaggio: parti baked + animazione procedurale).
4. Ancora da verificare in gioco: capriola, posa a gravita' zero, reazione al danno, pollice alzato a fine livello; schermi 4K e 144 Hz; Linux nativo con GPU e audio; inserimento classifica da interfaccia in Tauri.
5. Rifinitura: opzioni/gamepad/rimappa tasti, localizzazione IT/EN coerente, firma dell'installatore Windows (SmartScreen), `npm audit` (braces via Tailwind 3), aprire l'audit docs/AUDIT.md per i punti ancora aperti (M4, M7, M8, L4, L8, L9, L10).

Regole di lavoro: testa SEMPRE l'exe di release (la CSP stretta nasconde problemi che `tauri dev` non mostra); strumenti di test in tools/dev/ (CDP, screenshot, strisce di fotogrammi, script WSL); non fare push o merge senza che l'utente lo chieda; dichiara cio' che non hai potuto verificare (audio, FPS su hardware diverso).
```

## Comandi utili

```bash
npm install
npm run dev            # Vite
npm run desktop        # app Tauri in finestra (dev), hot reload
npm test               # 76 test (motore, input, dati livelli)
npm run typecheck
npx tauri build --no-bundle        # exe di release (Windows)
npx tauri build --bundles nsis     # installatore Windows
```

- Pagina delle pose: `npm run dev` poi `/character-sheet.html` (`?big=0,3,17` ingrandisce).
- Tasti di gioco: `F`/`F11`/`Alt+Enter` finestra, `M` muto, `Q` qualita', `F3` prestazioni. Tasti debug solo in dev: `0` god mode, `L` salta livello, `9` boss finale.
- Test con debug remoto WebView2: avviare l'app con `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9333`, poi `node tools/dev/cdp2.mjs 9333 "<js>" 3` (console, `window.__pdPerf`, `window.__pdPlayer`).

## Dove sta cosa

- `engine/` simulazione pura; `renderer/` PixiJS; `characters/debh/` personaggio; `components/` HUD e schermate React; `services/` audio, salvataggi, piattaforma; `src-tauri/` guscio desktop; `tests/` e `engine/*.test.ts`.
- Audio attuale (da sostituire in Fase 5): `services/soundService.ts` (oscillatori con `setTimeout`, melodie di 6-10 note).
