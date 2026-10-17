/**
 * Looking for a newer version of the game on GitHub (the releases of the repository).
 *
 * The desktop app asks the updater plugin, which reads `latest.json` from the latest published release and
 * knows whether it is newer than this copy. What the player is offered depends on how the copy was installed:
 *  - installed with the setup program (Windows) or an AppImage (Linux): "update now", the new version is
 *    downloaded, its signature is checked against the public key in tauri.conf.json and it is installed;
 *  - portable exe, or a .deb / .rpm package: only a notice and the link to the release page (the copy cannot
 *    replace itself, and a package belongs to the package manager).
 * A copy running in a browser tab has nothing to look for. A failed check (no network, no release yet) is
 * silent: it is never worth interrupting a game for.
 */
import { isTauri } from './platform';

export const REPO_URL = 'https://github.com/Pitz72/PixelDebhTheGame';

export type InstallKind = 'installer' | 'appimage' | 'portable' | 'package' | 'other';

export interface UpdateInfo {
  /** The new version, without a leading "v". */
  version: string;
  /** The notes of the release (may be empty). */
  notes: string;
  kind: InstallKind;
  /** True when this copy can download and install the update by itself. */
  canInstall: boolean;
  /** The page of the release on GitHub, for the copies that cannot update themselves. */
  releaseUrl: string;
  /** Downloads, installs and restarts. Only for `canInstall`. */
  install: () => Promise<void>;
}

/** The "x.y.z" of a version, as three numbers (a "v" in front and a "-beta.1" behind are ignored). */
export function parseVersion(v: string): [number, number, number] {
  const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(v.trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, 0, 0];
}

/** True when `candidate` is a newer version than `current`. */
export function isNewer(candidate: string, current: string): boolean {
  const a = parseVersion(candidate);
  const b = parseVersion(current);
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
}

export const canSelfUpdate = (kind: InstallKind): boolean => kind === 'installer' || kind === 'appimage';

export const releasePage = (version: string): string => `${REPO_URL}/releases/tag/v${version.replace(/^v/, '')}`;

export async function installKind(): Promise<InstallKind> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const kind = await invoke<string>('install_kind');
    return kind === 'installer' || kind === 'appimage' || kind === 'portable' || kind === 'package' ? kind : 'other';
  } catch {
    return 'other';
  }
}

/** Asks GitHub whether there is a newer version. Resolves to null when there is none or the check failed. */
export async function checkForUpdate(): Promise<UpdateInfo | null> {
  // Development only (compiled out of releases): `?fakeupdate=9.9.9` or `?fakeupdate=9.9.9,installer` shows the notice.
  if (import.meta.env.DEV) {
    const fake = new URLSearchParams(window.location.search).get('fakeupdate');
    if (fake) {
      const [version, kind = 'portable'] = fake.split(',');
      const k = (['installer', 'appimage', 'portable', 'package'] as const).find(x => x === kind) ?? 'portable';
      return {
        version,
        notes: 'test',
        kind: k,
        canInstall: canSelfUpdate(k),
        releaseUrl: releasePage(version),
        install: () => new Promise((_, reject) => setTimeout(() => reject(new Error('fake update: nothing to install')), 1500)),
      };
    }
  }
  if (!isTauri()) return null;
  try {
    const kind = await installKind();
    const { check } = await import('@tauri-apps/plugin-updater');
    const update = await check({ timeout: 8000 });
    if (!update) return null;
    // the plugin says "different version"; only a newer one is worth a notice
    if (!isNewer(update.version, __APP_VERSION__)) return null;
    return {
      version: update.version,
      notes: update.body ?? '',
      kind,
      canInstall: canSelfUpdate(kind),
      releaseUrl: releasePage(update.version),
      install: async () => {
        await update.downloadAndInstall();
        const { relaunch } = await import('@tauri-apps/plugin-process');
        await relaunch();
      },
    };
  } catch (error) {
    console.warn('Update check failed:', error);
    return null;
  }
}

/** Opens a web page in the system browser (in a browser tab, in a new tab). */
export async function openPage(url: string): Promise<void> {
  try {
    if (isTauri()) {
      const { openUrl } = await import('@tauri-apps/plugin-opener');
      await openUrl(url);
    } else {
      window.open(url, '_blank', 'noopener');
    }
  } catch (error) {
    console.warn('Could not open the page:', error);
  }
}
