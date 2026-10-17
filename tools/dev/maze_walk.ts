/**
 * Walks Debh through the labyrinth in the running app: collects every item with the greedy route,
 * then takes the exit, steering with keyboard events and reading the position from window.__pdGame.
 * Prints the frame rate (window.__pdPerf) while it goes. Needs the app started with a debug port:
 *
 *   $env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS='--remote-debugging-port=9333 --autoplay-policy=no-user-gesture-required'
 *   npx esbuild tools/dev/maze_walk.ts --bundle --platform=node --format=esm --outfile=%TEMP%/maze_walk.mjs
 *   node %TEMP%/maze_walk.mjs [port] [seconds to walk, 0 = until the level ends] [god mode: 1/0]
 */
import { levels } from '../../levels';
import { cellAt, cellCenter, distancesFrom, pathBetween } from '../../engine/mazeGrid';

const port = process.argv[2] ?? '9333';
const walkSeconds = Number(process.argv[3] ?? 0);
const god = (process.argv[4] ?? '1') === '1';

const levelIndex = levels.findIndex(l => l.maze);
const level = levels[levelIndex];
const maze = level.maze!;

const list = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()) as { type: string; url: string; webSocketDebuggerUrl: string }[];
const page = list.find(t => t.type === 'page' && !t.url.startsWith('devtools'));
if (!page) throw new Error('no page target');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map<number, (v: unknown) => void>();
ws.onmessage = ev => {
  const m = JSON.parse(String(ev.data));
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)!(m.result ?? m.error);
    pending.delete(m.id);
  }
};
await new Promise(r => (ws.onopen = r));
const send = (method: string, params: object = {}) =>
  new Promise<any>(res => {
    const i = ++id;
    pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
const ev = async (expr: string) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const keyEvent = (type: 'keydown' | 'keyup', key: string) =>
  ev(`document.body.dispatchEvent(new KeyboardEvent('${type}', {key: ${JSON.stringify(key)}, bubbles: true}))`);

// into the game
for (let i = 0; i < 60 && !(await ev('!!window.__pdGame')); i++) {
  if (i === 2) await keyEvent('keydown', ' ');
  if (i === 6) await keyEvent('keydown', 'Enter');
  if (i === 14) await keyEvent('keydown', 'Enter');
  await sleep(500);
}
if (!(await ev('!!window.__pdGame'))) throw new Error('the game did not start');
if (god) await ev('window.__pdGame.god(true)');
await ev(`window.__pdGame.load(${levelIndex})`);
await sleep(1500);
const first = await ev('window.__pdGame.state()');
console.log('start      ', JSON.stringify(first));

// the route: nearest item first, then the exit
const cellOf = (r: { x: number; y: number; width: number; height: number }) => {
  const { c, r: row } = cellAt(maze, r.x + r.width / 2, r.y + r.height / 2);
  return row * maze.cols + c;
};
const targets = level.items.map(cellOf);
const goal = cellOf(level.goal!);
let here = cellAt(maze, first.x + 27, first.y + 45);
let cur = here.r * maze.cols + here.c;
const waypoints: number[] = [];
const left = targets.slice();
while (left.length) {
  const d = distancesFrom(maze, cur % maze.cols, Math.floor(cur / maze.cols));
  let best = 0;
  for (let i = 1; i < left.length; i++) if (d[left[i]] < d[left[best]]) best = i;
  waypoints.push(...pathBetween(maze, cur, left[best]).slice(1));
  cur = left[best];
  left.splice(best, 1);
}
waypoints.push(...pathBetween(maze, cur, goal).slice(1));
console.log(`route      ${waypoints.length} cells, about ${Math.round((waypoints.length * maze.pitch) / (9 * 60))} s at full speed`);

const held = new Set<string>();
const setKeys = async (want: string[]) => {
  for (const k of [...held]) if (!want.includes(k)) { held.delete(k); await keyEvent('keyup', k); }
  for (const k of want) if (!held.has(k)) { held.add(k); await keyEvent('keydown', k); }
};

let next = 0;
const t0 = Date.now();
let lastLog = 0;
const fps: number[] = [];
const cpu: number[] = [];
let state = first;
while (true) {
  const elapsed = (Date.now() - t0) / 1000;
  if (walkSeconds > 0 && elapsed > walkSeconds) break;
  if (elapsed > 900) break;
  state = await ev('window.__pdGame.state()');
  if (state.status !== 'playing') break;
  if (await ev("document.body.innerText.includes('PAUSA')")) await keyEvent('keydown', 'Escape');

  const target = cellCenter(maze, waypoints[next] % maze.cols, Math.floor(waypoints[next] / maze.cols));
  const dx = target.x - (state.x + 27);
  const dy = target.y - (state.y + 45);
  if (Math.abs(dx) < 16 && Math.abs(dy) < 16 && next < waypoints.length - 1) next++;
  const want: string[] = [];
  if (Math.abs(dx) >= 16) want.push(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
  else if (Math.abs(dy) >= 6) want.push(dy > 0 ? 'ArrowDown' : 'ArrowUp');
  await setKeys(want);

  if (elapsed - lastLog >= 10) {
    lastLog = elapsed;
    const perf = await ev('window.__pdPerf ?? null');
    if (perf) { fps.push(perf.fps); cpu.push(perf.cpuMs); }
    console.log(
      `t ${String(Math.round(elapsed)).padStart(4)} s  waypoint ${next}/${waypoints.length}  items left ${state.items}  lives ${state.lives}  time ${Math.round(state.time)}` +
        (perf ? `  ${perf.fps} fps, cpu ${perf.cpuMs.toFixed(2)} ms, ${perf.quality}` : '')
    );
  }
  await sleep(18);
}
await setKeys([]);
const end = await ev('window.__pdGame?.state?.() ?? null');
const screen = await ev("document.body.innerText.replace(/\\s+/g,' ').slice(0,100)");
console.log('end        ', JSON.stringify(end), '|', screen);
if (fps.length) console.log(`fps         min ${Math.min(...fps)}  avg ${(fps.reduce((a, b) => a + b, 0) / fps.length).toFixed(1)}   cpu avg ${(cpu.reduce((a, b) => a + b, 0) / cpu.length).toFixed(2)} ms/frame`);
console.log(`walked      ${Math.round((Date.now() - t0) / 1000)} s`);
ws.close();
process.exit(0);
