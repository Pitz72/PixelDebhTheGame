// Copies the release exe into exe/ (a folder in the root, kept out of git) with its version in the name,
// e.g. exe/PixelDebh-1.10.0.exe, ready to be sent to somebody. Run it after a release build:
//   npm run exe        (builds, then copies)
//   node tools/dev/copy_exe.mjs   (only copies what was built last)
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const source = join(root, 'src-tauri', 'target', 'release', 'pixeldebh.exe');
if (!existsSync(source)) {
  console.error('No release exe yet: run `npm run exe` (or `npx tauri build --no-bundle`) first.');
  process.exit(1);
}

const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const folder = join(root, 'exe');
mkdirSync(folder, { recursive: true });
const target = join(folder, `PixelDebh-${version}.exe`);
copyFileSync(source, target);

const built = statSync(source).mtime.toLocaleString('it-IT');
console.log(`${target}\n  ${(statSync(target).size / 1048576).toFixed(1)} MB, built ${built}`);
