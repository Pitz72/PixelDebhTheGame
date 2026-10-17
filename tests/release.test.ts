import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { REPO_URL, canSelfUpdate, isNewer, parseVersion, releasePage } from '../services/updateService';

const read = (file: string) => readFileSync(file, 'utf8');
const json = (file: string) => JSON.parse(read(file));

const pkg = json('package.json');
const conf = json('src-tauri/tauri.conf.json');
const workflow = parse(read('.github/workflows/release.yml'));

describe('the version', () => {
  it('is the same in package.json, tauri.conf.json and Cargo.toml (the release workflow checks it too)', () => {
    const cargo = /^version\s*=\s*"([^"]+)"/m.exec(read('src-tauri/Cargo.toml'))![1];
    expect(conf.version).toBe(pkg.version);
    expect(cargo).toBe(pkg.version);
  });

  it('has its log file (a release needs one)', () => {
    expect(existsSync(`log/${pkg.version}.md`)).toBe(true);
  });
});

describe('the release workflow', () => {
  it('starts only when somebody decides: no push, no tag, no schedule', () => {
    const on = workflow.on;
    expect(Object.keys(on)).toEqual(['workflow_dispatch']);
    const raw = read('.github/workflows/release.yml');
    expect(raw).not.toMatch(/^\s*(push|pull_request|schedule|release|create):/m);
    // and the old workflow that started on tags is gone
    expect(existsSync('.github/workflows/desktop.yml')).toBe(false);
  });

  it('offers build-only, draft and publish, defaulting to the safe draft', () => {
    const mode = (workflow.on).workflow_dispatch.inputs.mode;
    expect(mode.options).toEqual(['build-only', 'draft', 'publish']);
    expect(mode.default).toBe('draft');
  });

  it('builds Windows (NSIS) and Linux (deb, rpm, AppImage)', () => {
    const matrix = workflow.jobs.build.strategy.matrix.include as { os: string; bundles: string }[];
    const win = matrix.find(m => m.os === 'windows-latest');
    const linux = matrix.find(m => m.os.startsWith('ubuntu'));
    expect(win?.bundles).toBe('nsis');
    expect(linux?.bundles).toBe('deb,rpm,appimage');
  });

  it('releases with tauri-action, signs the update files and writes latest.json', () => {
    const steps = workflow.jobs.build.steps as { uses?: string; with?: Record<string, unknown>; env?: Record<string, string>; if?: string }[];
    const release = steps.find(s => s.uses?.startsWith('tauri-apps/tauri-action'));
    expect(release).toBeDefined();
    expect(release!.with!.includeUpdaterJson).toBe(true);
    expect(String(release!.with!.args)).toContain('src-tauri/tauri.release.conf.json');
    expect(release!.if).toContain("inputs.mode != 'build-only'");
    const env = workflow.jobs.build.env as Record<string, string>;
    expect(Object.keys(env)).toContain('TAURI_SIGNING_PRIVATE_KEY');
    expect(Object.keys(env)).toContain('TAURI_SIGNING_PRIVATE_KEY_PASSWORD');
    expect(json('src-tauri/tauri.release.conf.json').bundle.createUpdaterArtifacts).toBe(true);
    // a draft is the default: only "publish" publishes
    expect(String(release!.with!.releaseDraft)).toContain("inputs.mode == 'draft'");
  });

  it('adds the portable exe to the release', () => {
    const steps = workflow.jobs.build.steps as { name?: string; run?: string }[];
    const portable = steps.find(s => s.name?.startsWith('Portable exe'));
    expect(portable?.run).toContain('portable.exe');
    expect(portable?.run).toContain('gh release upload');
  });

  it('checks that the versions agree and tests before building', () => {
    expect(workflow.jobs.build.needs).toBe('check');
    const run = (workflow.jobs.check.steps as { run?: string }[]).map(s => s.run ?? '').join('\n');
    expect(run).toContain('npm test');
    expect(run).toContain('npm run typecheck');
    expect(run).toContain('tauri.conf.json');
  });
});

describe('the updater', () => {
  it('reads latest.json from the releases of this very repository', () => {
    const cargo = read('src-tauri/Cargo.toml');
    const repo = /repository\s*=\s*"([^"]+)"/.exec(cargo)![1];
    expect(repo).toBe(REPO_URL);
    expect(conf.plugins.updater.endpoints).toEqual([`${REPO_URL}/releases/latest/download/latest.json`]);
  });

  it('checks the signature with a minisign public key', () => {
    const decoded = Buffer.from(conf.plugins.updater.pubkey, 'base64').toString('utf8');
    expect(decoded).toContain('minisign public key');
  });

  it('is allowed to check, restart and open a link, and the Rust shell sets it all up', () => {
    const permissions = json('src-tauri/capabilities/default.json').permissions as string[];
    for (const p of ['updater:default', 'process:allow-restart', 'opener:default']) expect(permissions).toContain(p);
    const rust = read('src-tauri/src/lib.rs');
    for (const piece of ['tauri_plugin_updater', 'tauri_plugin_process::init', 'tauri_plugin_opener::init', 'install_kind']) {
      expect(rust, piece).toContain(piece);
    }
  });

  it('only a game that can replace itself updates itself; the others are told where to download', () => {
    expect(canSelfUpdate('installer')).toBe(true);
    expect(canSelfUpdate('appimage')).toBe(true);
    for (const kind of ['portable', 'package', 'other'] as const) expect(canSelfUpdate(kind), kind).toBe(false);
    expect(releasePage('1.13.0')).toBe(`${REPO_URL}/releases/tag/v1.13.0`);
    expect(releasePage('v1.13.0')).toBe(`${REPO_URL}/releases/tag/v1.13.0`);
  });
});

describe('comparing versions', () => {
  it('reads x.y.z, with or without a v and a suffix', () => {
    expect(parseVersion('1.12.0')).toEqual([1, 12, 0]);
    expect(parseVersion('v2.0.1')).toEqual([2, 0, 1]);
    expect(parseVersion('1.13.0-beta.2')).toEqual([1, 13, 0]);
    expect(parseVersion('nonsense')).toEqual([0, 0, 0]);
  });

  it('knows which one is newer, comparing numbers and not text', () => {
    expect(isNewer('1.13.0', '1.12.0')).toBe(true);
    expect(isNewer('1.12.1', '1.12.0')).toBe(true);
    expect(isNewer('2.0.0', '1.99.99')).toBe(true);
    expect(isNewer('1.10.0', '1.9.0')).toBe(true); // 10 > 9, not "1.1" < "1.9"
    expect(isNewer('1.12.0', '1.12.0')).toBe(false);
    expect(isNewer('1.11.0', '1.12.0')).toBe(false);
  });
});
