/**
 * The desktop app is a web page in a WebView, and the WebView keeps the shortcuts of a browser: F5 and Ctrl+R reload
 * the page (the game in progress is gone and the intros start again), Ctrl+P prints, Ctrl+F and F3 search, F7 asks
 * about caret browsing, Alt+Left goes "back". `isBrowserShortcut` names them; index.tsx cancels their default action
 * in the shipped game. Cancelling does not hide the key from the game: F3 is still its performance overlay.
 */
export interface KeyLike {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
}

/** Keys that do something in a browser by themselves. */
const ALONE = new Set(['f5', 'f3', 'f7', 'browserrefresh', 'browserback', 'browserforward', 'browsersearch', 'browserhome', 'browserfavorites']);
/** Letters that do something in a browser with Ctrl: reload, print, find, find next, source, downloads, save, open, history, bookmark, search. */
const WITH_CTRL = new Set(['r', 'p', 'f', 'g', 'u', 'j', 's', 'o', 'h', 'd', 'e']);

export function isBrowserShortcut(e: KeyLike): boolean {
  const k = (e.key ?? '').toLowerCase();
  if (ALONE.has(k)) return true; // also with Ctrl or Shift: Ctrl+F5 is a reload too
  if ((e.ctrlKey || e.metaKey) && !e.altKey && WITH_CTRL.has(k)) return true; // not AltGr, which is Ctrl+Alt
  if (e.altKey && !e.ctrlKey && (k === 'arrowleft' || k === 'arrowright' || k === 'home')) return true;
  return false;
}
