// Takes a screenshot of each promotional image at its exact size, into branding/.
//   npm run dev                                   (in another terminal: the dev server on :3000)
//   node tools/branding/export.mjs [asset ...]    (no argument = all of them)
// It starts its own headless Edge or Chrome on a throwaway profile and talks to it over the DevTools protocol:
// no dependencies. The images are composed in tools/branding/branding.tsx.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const BASE = process.env.PD_BASE ?? 'http://localhost:3000';
const PORT = 9444;

// asset -> [width, height, output file under branding/, format (png unless said)]
// The poster is a JPEG at quality 95: a PNG of 2000x3000 made the browser's screenshot crash with software rendering.
const ASSETS = {
  'banner-16x9': [1920, 1080, 'social/banner-16x9-1920x1080.png'],
  'banner-21x9': [2560, 1080, 'social/banner-21x9-2560x1080.png'],
  'banner-1x1': [1080, 1080, 'social/banner-1x1-1080x1080.png'],
  'banner-9x16': [1080, 1920, 'social/banner-9x16-1080x1920.png'],
  'github-social': [1280, 640, 'social/github-social-preview-1280x640.png'],
  poster: [2000, 3000, 'poster/poster-2000x3000.jpg', 'jpeg'],
  // not part of "all": the poses to choose from (node tools/branding/export.mjs debh-poses)
  'debh-poses': [1920, 1080, 'debh-poses.png'],
};
const DEV_ONLY = ['debh-poses'];
const OUT = process.env.PD_OUT ?? path.join(ROOT, 'branding');

const BROWSERS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];
const exe = process.env.PD_BROWSER ?? BROWSERS.find(p => fs.existsSync(p));
if (!exe) throw new Error('No Edge or Chrome found: set PD_BROWSER to its path');

const wanted = process.argv.slice(2);
const names = wanted.length ? wanted : Object.keys(ASSETS).filter(n => !DEV_ONLY.includes(n));
for (const n of names) if (!ASSETS[n]) throw new Error(`Unknown asset "${n}". Known: ${Object.keys(ASSETS).join(', ')}`);

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-branding-'));
const browser = spawn(
  exe,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    '--hide-scrollbars',
    '--mute-audio',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--no-first-run',
    '--disable-extensions',
    'about:blank',
  ],
  { stdio: 'ignore' }
);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function targetUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find(t => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      /* not up yet */
    }
    await sleep(500);
  }
  throw new Error('The browser did not start');
}

try {
  const ws = new WebSocket(await targetUrl());
  let id = 0;
  const pending = new Map();
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m.result ?? m.error);
      pending.delete(m.id);
    }
  };
  await new Promise(r => (ws.onopen = r));
  // if the page crashes (a very heavy composition) the connection closes: say so instead of hanging silently
  ws.onclose = () => {
    for (const res of pending.values()) res({ error: { message: 'the browser connection closed (the page probably crashed)' } });
    pending.clear();
  };
  const send = (method, params = {}) =>
    new Promise(res => {
      const i = ++id;
      pending.set(i, res);
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  await send('Page.enable');
  await send('Runtime.enable');

  for (const name of names) {
    const [w, h, out, format = 'png'] = ASSETS[name];
    // the override lives as long as this connection: set it for every image
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `${BASE}/tools/branding/branding.html?asset=${name}` });
    let ready = false;
    for (let i = 0; i < 240 && !ready; i++) {
      await sleep(500);
      const r = await send('Runtime.evaluate', { expression: 'window.__ready === true', returnByValue: true });
      ready = r.result?.value === true;
    }
    if (!ready) throw new Error(`${name}: the page was not ready after 2 minutes`);
    const shot = await send('Page.captureScreenshot', format === 'jpeg' ? { format, quality: 95 } : { format });
    if (!shot.data) throw new Error(`${name}: capture failed ${JSON.stringify(shot)}`);
    const file = path.join(OUT, out);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const image = Buffer.from(shot.data, 'base64');
    fs.writeFileSync(file, image);
    console.log(`${name}: ${w}x${h}, ${Math.round(image.length / 1024)} KB -> ${file}`);
  }
  ws.close();
} finally {
  // on Windows the browser has child processes: take the whole tree down
  if (process.platform === 'win32') spawn('taskkill', ['/PID', String(browser.pid), '/T', '/F'], { stdio: 'ignore' });
  else browser.kill();
  await sleep(1500);
  try {
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 8, retryDelay: 400 });
  } catch {
    // Windows may still hold a file of the throwaway profile for a moment: it is in the temp folder, harmless
  }
}
