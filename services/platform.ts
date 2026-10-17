/**
 * Thin layer over what differs between the desktop app (Tauri) and a plain browser tab.
 * The Tauri API is imported lazily so the web build does not pay for it.
 */

export const isTauri = (): boolean =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export async function isFullscreen(): Promise<boolean> {
  if (isTauri()) {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    return getCurrentWindow().isFullscreen();
  }
  return Boolean(document.fullscreenElement);
}

export async function setFullscreen(on: boolean): Promise<void> {
  try {
    if (isTauri()) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().setFullscreen(on);
    } else if (on) {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    } else if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  } catch {
    // Browsers refuse fullscreen without a user gesture; nothing to do.
  }
}

/** Closes the game (the desktop app; a browser tab cannot close itself, so there it does nothing). */
export async function quitApp(): Promise<void> {
  if (!isTauri()) return;
  try {
    const { exit } = await import('@tauri-apps/plugin-process');
    await exit(0);
  } catch {
    // nothing to do: the window stays open
  }
}

export async function toggleFullscreen(): Promise<boolean> {
  const next = !(await isFullscreen());
  await setFullscreen(next);
  return next;
}
