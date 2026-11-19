import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { DOWNLOAD_TIMEOUT_MS, REPO_URL, canSelfUpdate, downloadFraction, isNewer, parseVersion, releasePage } from '../services/updateService';
import { isBrowserShortcut } from '../services/browserKeys';

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

  it('gives the build the tournament key from its secret, and stops a release without a valid one', () => {
    const env = workflow.jobs.build.env as Record<string, string>;
    expect(env.VITE_PIXELDEBH_TORNEO_CHIAVE).toBe('${{ secrets.VITE_PIXELDEBH_TORNEO_CHIAVE }}');
    const steps = workflow.jobs.check.steps as { name?: string; run?: string; env?: Record<string, string>; if?: string }[];
    const key = steps.find(s => s.name === 'The tournament key is there');
    expect(key).toBeDefined();
    expect(key!.if).toBeUndefined(); // it runs for every mode: build-only only warns
    expect(key!.env!.KEY).toBe('${{ secrets.VITE_PIXELDEBH_TORNEO_CHIAVE }}');
    expect(key!.run).toContain('^[0-9a-f]{64}$');
    expect(key!.run).toContain('::error::');
    expect(key!.run).toMatch(/build-only[^\n]*::warning::/);
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

describe('one copy of the game at a time (Windows)', () => {
  it('the single-instance plugin is there, only on Windows, and is the first plugin', () => {
    const cargo = read('src-tauri/Cargo.toml').replace(/\r\n/g, '\n');
    expect(cargo).toMatch(/\[target\.'cfg\(target_os = "windows"\)'\.dependencies\]\ntauri-plugin-single-instance = "2"/);
    const lib = read('src-tauri/src/lib.rs');
    const first = lib.indexOf('.plugin(');
    expect(lib.slice(first)).toMatch(/^\.plugin\(tauri_plugin_single_instance::init\(/);
    expect(lib.replace(/\r\n/g, '\n')).toContain('#[cfg(target_os = "windows")]\n    let builder = builder.plugin(tauri_plugin_single_instance::init(');
    expect(lib).toContain('window.set_focus()'); // a second start brings the first copy to the front
  });
});

describe('while an update downloads', () => {
  it('the download has a time limit and reports how far it is', () => {
    const src = read('services/updateService.ts');
    expect(DOWNLOAD_TIMEOUT_MS).toBeGreaterThanOrEqual(5 * 60 * 1000);
    expect(src).toContain('{ timeout: DOWNLOAD_TIMEOUT_MS }');
    const f = downloadFraction();
    expect(f({ event: 'Started', data: { contentLength: 200 } })).toBe(0);
    expect(f({ event: 'Progress', data: { chunkLength: 50 } })).toBe(0.25);
    expect(f({ event: 'Progress', data: { chunkLength: 500 } })).toBe(1); // never more than all of it
    expect(f({ event: 'Finished' })).toBe(1);
    const unknown = downloadFraction(); // a server that does not say the size
    expect(unknown({ event: 'Started', data: {} })).toBeNull();
    expect(unknown({ event: 'Progress', data: { chunkLength: 50 } })).toBeNull();
  });

  it('the game cannot be used: the menu is muted, the keys are ignored, the whole screen says so', () => {
    const app = read('App.tsx');
    expect(app).toContain("const updating = updateStatus === 'installing';");
    expect(app).toContain('if (updating) return; // the update screen is up: nothing else answers');
    expect(app.match(/active=\{!overlay && !updating\}/g)).toHaveLength(2);
    expect(app).toContain("if (gameState !== 'start' || overlay || updating) return;"); // no attract mode either
    // U only where the notice is in sight, not under another page
    expect(app).toContain("key === 'u' && update && !overlay && (gameState === 'start' || gameState === 'highscore')");
    const banner = read('components/UpdateBanner.tsx');
    expect(banner).toMatch(/if \(status === 'installing'\) \{[\s\S]*?absolute inset-0/);
    expect(banner).toContain("t('update.progress.note')");
  });
});

describe('the keys of a browser', () => {
  it('reload, print, find and the like are recognised; the keys of the game are not', () => {
    for (const key of ['F5', 'F3', 'F7', 'BrowserRefresh']) expect(isBrowserShortcut({ key })).toBe(true);
    expect(isBrowserShortcut({ key: 'F5', ctrlKey: true })).toBe(true);
    for (const key of ['r', 'R', 'p', 'f', 'g', 's']) expect(isBrowserShortcut({ key, ctrlKey: true })).toBe(true);
    expect(isBrowserShortcut({ key: 'ArrowLeft', altKey: true })).toBe(true);
    for (const key of ['r', 'p', 'f', ' ', 'Enter', 'Escape', 'ArrowLeft', 'F11', 'F4', 'c', 'x']) expect(isBrowserShortcut({ key })).toBe(false);
    expect(isBrowserShortcut({ key: 'Enter', altKey: true })).toBe(false); // Alt+Enter is the game's fullscreen
    expect(isBrowserShortcut({ key: 'r', ctrlKey: true, altKey: true })).toBe(false); // AltGr
    expect(isBrowserShortcut({ key: 'a', ctrlKey: true })).toBe(false);
  });

  it('the shipped game cancels them before anything else sees the key, and still lets the key through', () => {
    const index = read('index.tsx').replace(/\r\n/g, '\n');
    const shipped = /if \(!import\.meta\.env\.DEV\) \{\n([\s\S]*?)\n\}\n/.exec(index);
    expect(shipped).not.toBeNull();
    expect(shipped![1]).toMatch(/addEventListener\(\s*'keydown',\s*e => \{\s*if \(isBrowserShortcut\(e\)\) e\.preventDefault\(\);\s*\},\s*true\s*\)/);
    expect(shipped![1]).not.toContain('stopPropagation');
  });
});

describe('the Windows installer', () => {
  const nsis = conf.bundle.windows.nsis;

  it('in an update, waits for the game to let go of its exe before the running-app check', () => {
    expect(nsis.installerHooks).toBe('./windows/installer-hooks.nsh');
    const hooks = read('src-tauri/windows/installer-hooks.nsh');
    const preinstall = /!macro NSIS_HOOK_PREINSTALL\n([\s\S]*?)!macroend/.exec(hooks.replace(/\r\n/g, '\n'));
    expect(preinstall).not.toBeNull();
    const body = preinstall![1];
    expect(body).toMatch(/\$\{If\} \$UpdateMode = 1/); // a manual install does not wait
    expect(body).toContain('$INSTDIR\\${MAINBINARYNAME}.exe');
    expect(body).toContain('RmGetList');
    expect(body).toContain('${LoopUntil} $R9 >= ${PD_WAIT_STEPS}'); // bounded
    expect(hooks).toContain('!define /ifndef PD_WAIT_STEP_MS 250');
    expect(hooks).toContain('!define /ifndef PD_WAIT_STEPS 80'); // 20 seconds at most
    // every register it uses goes back as it was, in reverse order
    const pushed = [...body.matchAll(/^\s*Push (\$\w+)/gm)].map(m => m[1]);
    const popped = [...body.matchAll(/^\s*Pop (\$\w+)/gm)].map(m => m[1]);
    expect(pushed.length).toBeGreaterThan(0);
    expect(popped).toEqual([...pushed].reverse());
    // makensis reads a file without a byte order mark in the system code page
    expect(/^[\x00-\x7f]*$/.test(hooks)).toBe(true);
  });

  it('before copying anything, checks that it can write to the folder and offers the recommended one', () => {
    const hooks = read('src-tauri/windows/installer-hooks.nsh').replace(/\r\n/g, '\n');
    const macro = (name: string) => new RegExp(`!macro ${name}\\n([\\s\\S]*?)!macroend`).exec(hooks)?.[1] ?? '';
    const preinstall = macro('NSIS_HOOK_PREINSTALL');
    const check = macro('PD_CHECK_FOLDER');
    const canWrite = macro('PD_CAN_WRITE_INSTDIR');
    const post = macro('NSIS_HOOK_POSTINSTALL');
    for (const body of [preinstall, check, canWrite, post]) expect(body).not.toBe('');
    // the folder comes first: before the wait, the running-app check, the copy of the exe and the registry
    expect(preinstall.trimStart().startsWith('!insertmacro PD_CHECK_FOLDER')).toBe(true);
    // a real try at creating a file, cleaned up afterwards
    expect(canWrite).toContain('FileOpen $R0 "$INSTDIR\\${PD_WRITE_TEST}" w');
    expect(canWrite).toContain('Delete "$INSTDIR\\${PD_WRITE_TEST}"');
    // the folder offered is the one the template proposes by itself for a per-user install
    expect(nsis.installMode).toBe('currentUser');
    expect(check).toContain('StrCpy $R1 "$LOCALAPPDATA\\${PRODUCTNAME}"');
    expect(check).toContain('StrCpy $INSTDIR $R1');
    expect(check).toContain('SetOutPath $INSTDIR');
    expect(check).toContain('StrCpy $PdFolderMoved 1');
    // the player chooses; with no window at all the install stops instead of moving by itself
    expect(check).toContain('MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION "$R2" /SD ${PD_FOLDER_SILENT_CHOICE} IDCANCEL');
    expect(hooks).toContain('!define /ifndef PD_FOLDER_SILENT_CHOICE IDCANCEL');
    // in the two languages of the installer
    expect(nsis.languages).toEqual(['Italian', 'English']);
    expect(check).toContain('${If} $LANGUAGE = ${PD_LANG_ITALIAN}');
    expect(hooks).toContain('!define /ifndef PD_LANG_ITALIAN 1040');
    // every register it uses goes back as it was, in reverse order
    const pushed = [...check.matchAll(/^\s*Push (\$\w+)/gm)].map(m => m[1]);
    const popped = [...check.matchAll(/^\s*Pop (\$\w+)/gm)].map(m => m[1]);
    expect(pushed).toEqual(['$R0', '$R1', '$R2']);
    expect(popped).toEqual([...pushed].reverse());
    // an update that had to move the game: the shortcuts that exist follow it
    expect(post).toMatch(/\$\{If\} \$PdFolderMoved == 1\n\s*\$\{AndIf\} \$UpdateMode = 1/);
    expect(post).toContain('CreateShortcut "$SMPROGRAMS\\${PRODUCTNAME}.lnk" "$INSTDIR\\${MAINBINARYNAME}.exe"');
    expect(post).toContain('CreateShortcut "$DESKTOP\\${PRODUCTNAME}.lnk" "$INSTDIR\\${MAINBINARYNAME}.exe"');
  });

  it('is built with a Tauri CLI whose Italian messages name the game (fixed in 2.12.5)', () => {
    const lock = json('package-lock.json');
    const cli = lock.packages['node_modules/@tauri-apps/cli'].version as string;
    expect(isNewer(cli, '2.12.4')).toBe(true);
    expect(nsis.languages).toContain('Italian');
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
