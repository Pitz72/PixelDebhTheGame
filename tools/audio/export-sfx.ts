/**
 * Renders every sound effect to a WAV file and prints its measurements, so the sounds can be
 * inspected (spectrograms, a listen by the person who owns the ears) without starting the game.
 *
 *   npx esbuild tools/audio/export-sfx.ts --bundle --platform=node --format=esm --outfile=%TEMP%/export-sfx.mjs
 *   node %TEMP%/export-sfx.mjs <output-dir>
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SFX_NAMES, renderSfx } from '../../audio/sfx';
import { measure, toWav } from '../../audio/measure';

const outDir = process.argv[2] ?? 'sfx-export';
mkdirSync(outDir, { recursive: true });

console.log('name'.padEnd(13), 'dur s', ' peak dB', ' rms dB', ' act dB', '  LUFS', '    dc');
for (const name of SFX_NAMES) {
  const buf = renderSfx(name);
  writeFileSync(join(outDir, `${name}.wav`), toWav(buf));
  const s = measure(buf);
  console.log(
    name.padEnd(13),
    s.durationS.toFixed(2).padStart(5),
    s.peakDb.toFixed(1).padStart(8),
    s.rmsDb.toFixed(1).padStart(7),
    s.activeRmsDb.toFixed(1).padStart(7),
    s.lufs.toFixed(1).padStart(6),
    s.dc.toFixed(4).padStart(7)
  );
}
