import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SKIP = new Set(['node_modules', 'dist', 'src-tauri', 'exe', '.git', 'public', 'log', 'docs', 'tools', 'tests']);
const sources: string[] = [];
(function walk(dir: string) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.ts$/.test(name)) sources.push(path);
  }
})('.');

describe('event listeners', () => {
  // A listener that is removed under another name than it was added under stays on forever. It happened once: a tool that
  // renamed a style class also rewrote the string 'blur' in a removeEventListener call.
  it('are removed under the same event name they were added under', () => {
    const problems: string[] = [];
    for (const file of sources) {
      const text = readFileSync(file, 'utf-8');
      const added = new Set(Array.from(text.matchAll(/addEventListener\(\s*['"]([\w-]+)['"]/g)).map(m => m[1]));
      for (const m of text.matchAll(/removeEventListener\(\s*['"]([\w-]+)['"]/g)) {
        if (!added.has(m[1])) problems.push(`${file}: removeEventListener('${m[1]}') has no addEventListener('${m[1]}')`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('finds the sources it is meant to check', () => {
    expect(sources.length).toBeGreaterThan(50);
    expect(sources.some(f => /GameScreen\.tsx$/.test(f))).toBe(true);
  });
});
