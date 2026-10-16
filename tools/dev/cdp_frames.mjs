// Capture a burst of cropped screenshots that follow the character, from the running app via CDP.
// usage: node cdp_frames.mjs <port> <outPrefix> <frames> <intervalMs> <offX> <offY> <w> <h> <scale> "<js to run first>"
// offX/offY: top-left of the crop relative to her feet, in game pixels (1920x1080 space); w/h: size in game pixels.
import fs from 'node:fs';
const [port, prefix, nFrames, interval, cx, cy, cw, ch, scale, pre] = process.argv.slice(2);
const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const page = list.find(t => t.type === 'page' && !t.url.startsWith('devtools'));
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m.error); pending.delete(m.id); } };
await new Promise(r => (ws.onopen = r));
if (pre) await send('Runtime.evaluate', { expression: pre, awaitPromise: false });
const evalv = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.value;
const PROBE = "(()=>{const c=document.querySelector('canvas'); const r=c.getBoundingClientRect(); const p=window.__pdPlayer||{x:960,y:900}; return {left:r.left, top:r.top, s:r.width/1920, px:p.x, py:p.y}})()";
const t0 = Date.now();
for (let i = 0; i < Number(nFrames); i++) {
  const t = Date.now();
  const info = await evalv(PROBE);
  const s = info.s;
  const clip = { x: info.left + (info.px + Number(cx)) * s, y: info.top + (info.py + Number(cy)) * s, width: Number(cw) * s, height: Number(ch) * s, scale: Number(scale) / s };
  const r = await send('Page.captureScreenshot', { format: 'png', clip });
  if (!r.data) { console.log('capture failed', JSON.stringify(r)); break; }
  fs.writeFileSync(`${prefix}_${String(i).padStart(2, '0')}.png`, Buffer.from(r.data, 'base64'));
  const wait = Number(interval) - (Date.now() - t);
  if (wait > 0) await new Promise(res => setTimeout(res, wait));
}
console.log(`captured ${nFrames} frames in ${Date.now() - t0} ms`);
ws.close(); process.exit(0);
