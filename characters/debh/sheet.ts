// Dev-only contact sheet of every Debh pose (open /character-sheet.html while `npm run dev` is running).
import { Application, Container, Graphics, Text } from 'pixi.js';
import { bakeDebh } from './bake';
import { DebhRig, DebhPose, STAND_GROUND_Y, RIG_HEIGHT, groundLineY } from './rig';
import {
  idlePose,
  runPose,
  JUMP_UP,
  JUMP_APEX,
  FALL,
  LAND,
  TUCK,
  HURT,
  CARRY,
  CHEER,
  FLOAT,
  throwPose,
  aimPose,
} from './anim';

const W = 1920;
const H = 1080;

const cells: Array<[string, DebhPose]> = [
  ['idle', idlePose(0.4)],
  ['run 0', runPose(0, 1, false)],
  ['run 1/8', runPose(0.125, 1, false)],
  ['run 2/8', runPose(0.25, 1, false)],
  ['run 3/8', runPose(0.375, 1, false)],
  ['run 4/8', runPose(0.5, 1, false)],
  ['run 5/8', runPose(0.625, 1, false)],
  ['run 6/8', runPose(0.75, 1, false)],
  ['jump up', JUMP_UP],
  ['apex', JUMP_APEX],
  ['fall', FALL],
  ['land', LAND],
  ['somersault', TUCK],
  ['hurt', HURT],
  ['carry', CARRY],
  ['throw 0.2', throwPose(0.2, idlePose(0))],
  ['throw 0.6', throwPose(0.6, idlePose(0))],
  ['shoot fwd', aimPose(idlePose(0), 1, 0)],
  ['shoot up', aimPose(idlePose(0), 0.7, -0.7)],
  ['shoot down', aimPose(idlePose(0), 0.7, 0.7)],
  ['cheer', CHEER(0.3)],
  ['zero-g', FLOAT(0.5, 0)],
];

async function main() {
  const app = new Application();
  await app.init({ width: W, height: H, background: 0x1a1240, antialias: true, autoStart: false });
  document.body.appendChild(app.canvas);
  app.canvas.style.width = '100vw';
  app.canvas.style.height = 'auto';
  const debh = await bakeDebh();

  // ?big=0,3,17  ->  render just those poses, as large as the canvas allows
  const big = new URLSearchParams(location.search).get('big');
  if (big) {
    const idx = big.split(',').map(Number).filter(n => cells[n]);
    const cw2 = W / idx.length;
    const S2 = (H - 60) / RIG_HEIGHT;
    idx.forEach((n, i) => {
      const [label, pose] = cells[n];
      const rig = new DebhRig(debh);
      rig.apply(pose);
      rig.root.scale.set(S2);
      rig.root.position.set(i * cw2 + cw2 * 0.42, H - 30 - groundLineY(pose) * S2);
      app.stage.addChild(rig.root);
      const t = new Text({ text: label, style: { fill: '#c9b8ff', fontSize: 28, fontFamily: 'monospace' } });
      t.position.set(i * cw2 + 20, 16);
      app.stage.addChild(t);
    });
    app.renderer.render({ container: app.stage });
    (window as unknown as { __sheetReady?: boolean }).__sheetReady = true;
    return;
  }

  const cols = 8;
  const cw = W / cols;
  const rows = Math.ceil(cells.length / cols);
  const ch = (H - 190) / rows;
  const S = (ch - 46) / RIG_HEIGHT; // rig units -> px for the big cells

  cells.forEach(([label, pose], i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cell = new Container();
    cell.position.set(col * cw, row * ch);
    const bg = new Graphics();
    bg.rect(4, 4, cw - 8, ch - 8).stroke({ width: 1, color: 0x4a3c8a });
    bg.moveTo(8, ch - 16).lineTo(cw - 8, ch - 16).stroke({ width: 2, color: 0x6ee7ff, alpha: 0.5 });
    cell.addChild(bg);
    const rig = new DebhRig(debh);
    rig.apply(pose);
    rig.root.scale.set(S);
    const ground = groundLineY(pose);
    rig.root.position.set(cw * 0.42, ch - 16 - ground * S);
    cell.addChild(rig.root);
    const t = new Text({ text: label, style: { fill: '#c9b8ff', fontSize: 18, fontFamily: 'monospace' } });
    t.position.set(12, 8);
    cell.addChild(t);
    app.stage.addChild(cell);
  });

  // actual game size strip: idle, a run cycle, jump, shoot, cheer on a floor line
  const gameScale = 122 / RIG_HEIGHT;
  const strip = new Container();
  strip.position.set(40, H - 170);
  const floor = new Graphics();
  floor.rect(0, 140, W - 80, 6).fill(0x00e5ff);
  strip.addChild(floor);
  const sample: Array<DebhPose> = [
    idlePose(0.4),
    ...[0, 0.17, 0.33, 0.5, 0.67, 0.83].map(p => runPose(p, 1, false)),
    JUMP_UP,
    JUMP_APEX,
    FALL,
    LAND,
    TUCK,
    CARRY,
    aimPose(idlePose(0), 1, 0),
    CHEER(0.3),
    HURT,
  ];
  sample.forEach((pose, i) => {
    const rig = new DebhRig(debh);
    rig.apply(pose);
    rig.root.scale.set(gameScale);
    rig.root.position.set(60 + i * 105, 140 - groundLineY(pose) * gameScale);
    strip.addChild(rig.root);
  });
  const note = new Text({ text: `actual game size (122 px tall)  |  stand ground line y=${STAND_GROUND_Y}`, style: { fill: '#9fb4ff', fontSize: 16, fontFamily: 'monospace' } });
  note.position.set(0, -8);
  strip.addChild(note);
  app.stage.addChild(strip);

  app.renderer.render({ container: app.stage });
  (window as unknown as { __sheetReady?: boolean }).__sheetReady = true;
}

main().catch(error => {
  document.body.innerText = String(error?.stack ?? error);
});
