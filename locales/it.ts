/**
 * Italian texts. This file defines the keys: `en.ts` has to give every one of them (the type says so).
 * Texts that are built from numbers or names use `{name}` holes, filled by `t(key, { name: ... })`.
 */
export const it = {
  // The note on how the game was made (after the intros, at every start)
  'notice.chip': "UNA NOTA DELL'AUTORE",
  'notice.title': "FATTO CON L'IA, DA UN AUTORE",
  'notice.p1':
    "PixelDebh: Retro-Rescue! è un'opera di Simone Pizzi (Runtime Multimedia): l'idea, la direzione, le scelte di progetto e il giudizio su ogni parte sono dell'autore.",
  'notice.p2':
    "Per realizzarlo si è avvalso dell'intelligenza artificiale: il codice, la grafica vettoriale e l'intro animata sono stati scritti con l'aiuto dei modelli Claude (Anthropic); le musiche sono state generate con Lyria (Google), scelte e dirette dall'autore; gli effetti sonori sono sintetizzati dal motore audio del gioco.",
  'notice.p3': "L'IA è stata lo strumento. L'ingegno è dell'autore.",
  'notice.greeting': 'Buon divertimento.',
  'notice.continue': 'PREMI INVIO PER CONTINUARE',
  'boot.skip': 'ESC · SALTA',
  'credit.by': 'By Simone Pizzi - Runtime Multimedia',
  // Updates
  'update.available': 'NUOVA VERSIONE {version} DISPONIBILE',
  'update.install': '[U] AGGIORNA ORA',
  'update.download': '[U] SCARICA DA GITHUB',
  'update.installing': "SCARICO L'AGGIORNAMENTO...",
  'update.failed': 'AGGIORNAMENTO NON RIUSCITO: {error}',
} as const;

export type TextKey = keyof typeof it;
