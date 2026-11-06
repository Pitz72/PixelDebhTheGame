import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// The tournament client against the site's isolated test runtime (tools/dev/torneo/sito.test.ts). Not part of
// `npm test`: it needs that server running. See docs/TORNEO.md, phase 3.
const pkg = JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf-8'));

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  test: {
    environment: 'node',
    include: ['tools/dev/torneo/sito.test.ts'],
    testTimeout: 30000,
    fileParallelism: false,
  },
});
