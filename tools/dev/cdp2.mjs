// CDP probe for the running app: console output, WebGL info and the renderer's own perf counters.
// usage: node cdp2.mjs <port> [js-to-eval-before-sampling] [sampleSeconds]
const port = process.argv[2] || '9333';
const pre = process.argv[3] || '';
const seconds = Number(process.argv[4] || 4);
const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const page = list.find(t => t.type === 'page' && !t.url.startsWith('devtools'));
if (!page) { console.log('no page target', JSON.stringify(list.map(t => t.type + ':' + t.url))); process.exit(1); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
const msgs = [];
let id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m.error); pending.delete(m.id); return; }
  if (m.method === 'Log.entryAdded') msgs.push(`[log:${m.params.entry.level}] ${m.params.entry.text} ${m.params.entry.url ?? ''}`);
  if (m.method === 'Runtime.consoleAPICalled') msgs.push(`[console.${m.params.type}] ${m.params.args.map(a => a.value ?? a.description).join(' ').slice(0, 400)}`);
  if (m.method === 'Runtime.exceptionThrown') msgs.push(`[exception] ${m.params.exceptionDetails.text} ${m.params.exceptionDetails.exception?.description?.slice(0, 600) ?? ''}`);
};
await new Promise(r => (ws.onopen = r));
await send('Runtime.enable'); await send('Log.enable');
const ev = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;
if (pre) console.log('pre      :', JSON.stringify(await ev(pre)));
await new Promise(r => setTimeout(r, seconds * 1000));
console.log('perf     :', JSON.stringify(await ev('window.__pdPerf ?? null')));
console.log('webgl    :', await ev(`(()=>{const c=document.querySelector('canvas'); if(!c) return 'no canvas'; const gl=c.getContext('webgl2')||c.getContext('webgl'); if(!gl) return 'canvas present, context not re-readable'; const d=gl.getExtension('WEBGL_debug_renderer_info'); return d? gl.getParameter(d.UNMASKED_RENDERER_WEBGL):'(no debug info)'})()`));
console.log('canvas   :', await ev(`(()=>{const c=document.querySelector('canvas'); return c? c.width+'x'+c.height+' css '+c.style.width+'x'+c.style.height : 'none'})()`));
console.log('hud text :', (await ev("document.body.innerText.replace(/\\s+/g,' ').slice(0,140)")));
console.log('messages :', msgs.length ? '\n  ' + [...new Set(msgs)].slice(0, 25).join('\n  ') : '(none)');
ws.close(); process.exit(0);
