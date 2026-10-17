# Immagini promozionali (`branding/`)

Banner per i social, immagine per GitHub e poster. Si compongono con la grafica del gioco (i componenti SVG di boss, nemici e oggetti, e lo scheletro di Debh in PixiJS), non con immagini ritagliate: restano nitide a qualsiasi dimensione.

| File | Formato | Uso |
|---|---|---|
| `branding/social/banner-16x9-1920x1080.png` | 16:9 | YouTube, post e anteprime |
| `branding/social/banner-21x9-2560x1080.png` | 21:9 | testata del README, banner larghi |
| `branding/social/banner-1x1-1080x1080.png` | 1:1 | Instagram, Facebook, Telegram |
| `branding/social/banner-9x16-1080x1920.png` | 9:16 | storie e reel |
| `branding/social/github-social-preview-1280x640.png` | 2:1 | anteprima social del repository (Settings > Social preview, la carica a mano il proprietario) |
| `branding/poster/poster-2000x3000.jpg` | 2:3 | poster in stile cinematografico cartoon |

## Rifarle

```bash
npm run dev                          # in un terminale: il server su http://localhost:3000
node tools/branding/export.mjs       # in un altro: tutte le immagini; oppure un nome solo (poster, banner-1x1...)
```

Serve Edge o Chrome (lo script ne avvia uno senza finestra su un profilo temporaneo; `PD_BROWSER` indica un altro percorso). Le immagini si compongono in `branding.tsx` (si guardano anche nel browser: `/tools/branding/branding.html?asset=poster`), e `export.mjs` ne fa lo screenshot alla misura esatta. `?asset=debh-poses` mostra le pose di Debh tra cui scegliere. Il poster esce in JPEG: un PNG di quelle dimensioni faceva cadere il browser con il rendering software.

Il logo di Runtime Multimedia è la versione bianca di `J:\PODCAST\ASSETS\LOGO 2025\RUNTIME MULTIMEDIA` (le altre varianti hanno la scritta verde petrolio o nera, che sullo sfondo viola scuro non si legge), ridotta in `assets/`.

Le immagini sono a diritti riservati (vedi `LICENZE.md`).
