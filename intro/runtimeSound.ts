// ====================================================================
//  The sound of the Runtime Multimedia logo: Web Audio, all synthesised.
// --------------------------------------------------------------------
//  Imported from "Il Relitto Silente" (loghi/suono.ts, the RUNTIME part; the FAVELLA 1 score is left
//  out), same author. Every sound is written on the instants of the logo's own direction
//  (REGIA_RUNTIME) and is scheduled ALL AT ONCE on the audio clock when it starts: picture and sound
//  begin together and never drift apart. The TV that turns on (thump, discharge, CRT hum), the
//  screen that opens, the head that scrolls and writes in beeps, the triangle that closes with a zip
//  and hits (kick and chord), the pixels as sparks, the reflection, the switch-off.
//  Code of the score unchanged (names stay Italian); new is only the start-up at the bottom.
// ====================================================================
import { REGIA_RUNTIME as R, PASSA_RUNTIME, PASSA_MULTIMEDIA, ORDINE_PIXEL } from "./LogoRuntime";
import { RUNTIME_RIQUADRI, MULTIMEDIA_RIQUADRI, PIXEL } from "./runtimeForme";

const LIVELLO = 0.8;            // volume generale
const ZERO = 0.0001;

interface Banco { ac: BaseAudioContext; master: GainNode; secco: GainNode; riv: GainNode; rumore: AudioBuffer }

/** Una risposta all'impulso sintetica: rumore stereo che si spegne (una stanza ampia, morbida). */
function impulso(ac: BaseAudioContext, durata = 2.6, decadimento = 0.48) {
  const n = Math.floor(ac.sampleRate * durata), buf = ac.createBuffer(2, n, ac.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let basso = 0;
    for (let i = 0; i < n; i++) {
      const t = i / ac.sampleRate;
      basso += (Math.random() * 2 - 1 - basso) * 0.35;           // un po' più scura in alto
      d[i] = basso * Math.exp(-t / decadimento) * (t < 0.012 ? t / 0.012 : 1);
    }
  }
  return buf;
}

function banco(ac: BaseAudioContext, uscita: AudioNode): Banco {
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 3.2; comp.attack.value = 0.004; comp.release.value = 0.25;
  // e in fondo un limitatore: nessun picco oltre −1 dB, nemmeno sul colpo del «play»
  const limite = ac.createDynamicsCompressor();
  limite.threshold.value = -4; limite.knee.value = 0; limite.ratio.value = 20; limite.attack.value = 0.001; limite.release.value = 0.12;
  const master = ac.createGain(); master.gain.value = LIVELLO;
  master.connect(comp).connect(limite).connect(uscita);
  const conv = ac.createConvolver(); conv.buffer = impulso(ac);
  const ritorno = ac.createGain(); ritorno.gain.value = 0.5;
  conv.connect(ritorno).connect(master);
  const riv = ac.createGain(); riv.connect(conv);
  const secco = ac.createGain(); secco.connect(master);
  const n = ac.sampleRate * 2, rumore = ac.createBuffer(1, n, ac.sampleRate), d = rumore.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return { ac, master, secco, riv, rumore };
}

/** L'uscita di una voce: posizione nello stereo e quanto va nel riverbero. */
function voce(b: Banco, pan = 0, mandata = 0.15): AudioNode {
  const g = b.ac.createGain();
  const p = b.ac.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan));
  g.connect(p); p.connect(b.secco);
  if (mandata > 0) { const m = b.ac.createGain(); m.gain.value = mandata; p.connect(m).connect(b.riv); }
  return g;
}

function inviluppo(g: AudioParam, t: number, picco: number, attacco: number, durata: number) {
  g.setValueAtTime(ZERO, t);
  g.exponentialRampToValueAtTime(Math.max(picco, ZERO * 2), t + attacco);
  g.exponentialRampToValueAtTime(ZERO, t + Math.max(durata, attacco + 0.01));
}

interface OpzTono { f: number; f1?: number; dur: number; g: number; tipo?: OscillatorType; att?: number; pan?: number; riv?: number; lp?: number; lp1?: number; det?: number }
function tono(b: Banco, t: number, o: OpzTono) {
  const ac = b.ac, osc = ac.createOscillator();
  osc.type = o.tipo ?? "sine";
  osc.frequency.setValueAtTime(o.f, t);
  if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
  if (o.det) osc.detune.value = o.det;
  const g = ac.createGain(); inviluppo(g.gain, t, o.g, o.att ?? 0.005, o.dur);
  let nodo: AudioNode = osc;
  if (o.lp) {
    const fl = ac.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.setValueAtTime(o.lp, t);
    if (o.lp1) fl.frequency.exponentialRampToValueAtTime(o.lp1, t + o.dur);
    osc.connect(fl); nodo = fl;
  }
  nodo.connect(g).connect(voce(b, o.pan, o.riv));
  osc.start(t); osc.stop(t + o.dur + 0.05);
}

interface OpzRumore { dur: number; g: number; tipo?: BiquadFilterType; f: number; f1?: number; q?: number; att?: number; pan?: number; riv?: number }
function rumore(b: Banco, t: number, o: OpzRumore) {
  const ac = b.ac, s = ac.createBufferSource();
  s.buffer = b.rumore;
  const fl = ac.createBiquadFilter(); fl.type = o.tipo ?? "bandpass"; fl.Q.value = o.q ?? 1;
  fl.frequency.setValueAtTime(o.f, t);
  if (o.f1) fl.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
  const g = ac.createGain(); inviluppo(g.gain, t, o.g, o.att ?? Math.min(0.01, o.dur / 4), o.dur);
  s.connect(fl).connect(g).connect(voce(b, o.pan, o.riv));
  s.start(t, Math.random() * 1.2, o.dur + 0.05);
}

/** Una campana: parziali inarmoniche che si spengono prima le alte. */
function campana(b: Banco, t: number, f: number, g: number, dur = 1.4, pan = 0, riv = 0.5) {
  [[1, 1, 1], [2.76, 0.42, 0.6], [5.4, 0.22, 0.35], [8.93, 0.1, 0.2]].forEach(([r, a, d]) =>
    tono(b, t, { f: f * r, dur: dur * d, g: g * a, att: 0.002, pan, riv }));
}

/** Un tonfo grave (cassa): seno che scende, con un piccolo clic in testa. */
function colpo(b: Banco, t: number, g: number, f0 = 120, f1 = 42, dur = 0.42, riv = 0.12) {
  tono(b, t, { f: f0, f1, dur, g, att: 0.002, riv });
  rumore(b, t, { dur: 0.018, g: g * 0.22, tipo: "highpass", f: 2600, riv: 0.05 });
}

/** Un accordo sostenuto: per ogni nota due seghe appena stonate, dentro un passa-basso;
 *  le note si dividono fra sinistra e destra per dare larghezza. */
function accordo(b: Banco, t0: number, t1: number, o: { note: number[]; g: number; att: number; ril: number; lp: number; lp1?: number; tlp?: number; stacco?: boolean; riv?: number; onda?: OscillatorType }) {
  const ac = b.ac;
  const lati = [-0.35, 0.35].map((pan) => {
    const fl = ac.createBiquadFilter(); fl.type = "lowpass"; fl.Q.value = 0.6;
    fl.frequency.setValueAtTime(o.lp, t0);
    if (o.lp1) fl.frequency.exponentialRampToValueAtTime(o.lp1, t0 + (o.tlp ?? 1));
    const g = ac.createGain();
    g.gain.setValueAtTime(ZERO, t0);
    if (o.stacco) {                     // attacco secco e caduta: un colpo d'accordo che resta sotto
      g.gain.exponentialRampToValueAtTime(o.g, t0 + o.att);
      g.gain.exponentialRampToValueAtTime(o.g * 0.22, t0 + o.att + 0.7);
      g.gain.setValueAtTime(o.g * 0.22, t1 - o.ril);
    } else {
      g.gain.linearRampToValueAtTime(o.g, t0 + o.att);
      g.gain.setValueAtTime(o.g, t1 - o.ril);
    }
    g.gain.exponentialRampToValueAtTime(ZERO, t1);
    fl.connect(g).connect(voce(b, pan, o.riv ?? 0.35));
    return fl;
  });
  o.note.forEach((f, i) => {
    const gn = ac.createGain(); gn.gain.value = 2 / o.note.length;
    [-6, 6].forEach((det) => {
      const osc = ac.createOscillator(); osc.type = o.onda ?? "sawtooth"; osc.frequency.value = f; osc.detune.value = det;
      osc.connect(gn); osc.start(t0); osc.stop(t1 + 0.05);
    });
    gn.connect(lati[i % 2]);
  });
}

/** Il ronzio del tubo catodico: rete a 50 Hz con le armoniche e un fruscio sottile. */
function ronzio(b: Banco, t0: number, t1: number, g: number) {
  const ac = b.ac, gg = ac.createGain();
  gg.gain.setValueAtTime(ZERO, t0);
  gg.gain.exponentialRampToValueAtTime(g, t0 + 0.4);
  gg.gain.setValueAtTime(g, t1 - 0.12);
  gg.gain.exponentialRampToValueAtTime(ZERO, t1);
  gg.connect(voce(b, 0, 0.05));
  [[50, 0.35], [100, 0.6], [150, 0.45], [250, 0.2]].forEach(([f, a]) => {
    const o = ac.createOscillator(); o.frequency.value = f;
    const ga = ac.createGain(); ga.gain.value = a;
    o.connect(ga).connect(gg); o.start(t0); o.stop(t1 + 0.05);
  });
  const s = ac.createBufferSource(); s.buffer = b.rumore; s.loop = true;
  const hp = ac.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 6500;
  const gs = ac.createGain(); gs.gain.value = 0.35;
  s.connect(hp).connect(gs).connect(gg); s.start(t0); s.stop(t1 + 0.05);
}

const panX = (x: number, centro: number, mezzo: number, ampiezza = 0.6) => ((x - centro) / mezzo) * ampiezza;

// ── RUNTIME MULTIMEDIA ────────────────────────────────────────────────
function partituraRuntime(b: Banco, s: number) {
  const at = (x: number) => s + x;
  // il televisore si accende: tonfo, scarica, e il tubo che ronza fino allo spegnimento
  colpo(b, at(R.rigaDa), 0.42, 95, 38, 0.36);
  rumore(b, at(R.rigaDa), { dur: 0.16, g: 0.16, tipo: "highpass", f: 1800, f1: 7000, riv: 0.2 });
  tono(b, at(R.rigaDa + 0.02), { f: 7800, f1: 9400, dur: 0.32, g: 0.012, att: 0.02, riv: 0.1 });
  ronzio(b, at(R.rigaDa + 0.05), at(R.spentaA), 0.018);
  // lo schermo si apre: un soffio che sale
  rumore(b, at(R.rigaA - 0.04), { dur: 0.42, g: 0.3, tipo: "bandpass", f: 380, f1: 3600, q: 1.1, att: 0.12, riv: 0.3 });
  // la testina compare e scorre: un tono che sale piano, appena sotto le lettere
  tono(b, at(R.testina), { f: 880, f1: 1320, dur: 0.09, g: 0.08, att: 0.003, pan: -0.55, riv: 0.2 });
  const corsa = R.corsaA - R.corsaDa;
  tono(b, at(R.corsaDa), { f: 196, f1: 587, dur: corsa + 0.1, g: 0.05, tipo: "triangle", att: 0.15, lp: 900, lp1: 2600, pan: 0, riv: 0.25 });
  rumore(b, at(R.corsaDa), { dur: corsa, g: 0.035, tipo: "bandpass", f: 2000, f1: 6000, q: 3, att: 0.2, riv: 0.2 });
  // RUNTIME: un bip per lettera, su una scala che sale (Re maggiore pentatonica)
  const scala = [587.3, 659.3, 740, 880, 987.8, 1174.7, 1318.5];
  PASSA_RUNTIME.forEach((tp, i) => {
    const [x0, x1] = RUNTIME_RIQUADRI[i];
    tono(b, at(tp + 0.02), { f: scala[i], f1: scala[i] * 0.985, dur: 0.12, g: 0.13, tipo: "triangle", att: 0.002, lp: 5000, pan: panX((x0 + x1) / 2, 478, 420), riv: 0.25 });
  });
  // MULTIMEDIA: ticchettii più fini, dati che si scrivono
  PASSA_MULTIMEDIA.forEach((tp, i) => {
    const [x0, x1] = MULTIMEDIA_RIQUADRI[i];
    rumore(b, at(tp + 0.03), { dur: 0.024, g: 0.085, tipo: "highpass", f: 4200 + i * 120, pan: panX((x0 + x1) / 2, 478, 420), riv: 0.12 });
  });
  // il triangolo si chiude: una zip che sale
  const dis = R.disegnoA - R.disegnoDa;
  tono(b, at(R.disegnoDa), { f: 170, f1: 760, dur: dis, g: 0.055, tipo: "sawtooth", att: 0.04, lp: 700, lp1: 3800, pan: 0.35, riv: 0.2 });
  rumore(b, at(R.disegnoDa), { dur: dis, g: 0.05, tipo: "bandpass", f: 900, f1: 5200, q: 2, att: 0.05, pan: 0.35, riv: 0.2 });
  // … e colpisce: cassa, accordo che si apre e resta sotto fino allo spegnimento
  const colpoT = R.pienoDa + 0.06;
  colpo(b, at(colpoT), 0.95, 130, 40, 0.55, 0.15);
  accordo(b, at(colpoT), at(R.spegneDa + 0.06), { note: [146.8, 220, 293.7, 370, 440, 659.3], g: 0.22, att: 0.006, ril: 0.25, lp: 5200, lp1: 1100, tlp: 0.7, stacco: true, riv: 0.5 });
  campana(b, at(colpoT + 0.01), 1318.5, 0.05, 1.6, 0.3, 0.6);
  // il triangolo interno: un «pop»
  tono(b, at(R.internoDa + 0.04), { f: 523.3, f1: 880, dur: 0.12, g: 0.06, att: 0.003, pan: 0.3, riv: 0.3 });
  // i pixel: scintille che volano a destra
  const alte = [1174.7, 1318.5, 1480, 1760, 1975.5, 2349.3, 2637, 2960];
  ORDINE_PIXEL.forEach((i, n) => {
    const p = PIXEL[i];
    campana(b, at(R.pixelDa + n * R.pixelPasso + 0.03), alte[n], 0.06, 0.7, 0.25 + (p.x - 78) / 112 * 0.6, 0.55);
  });
  // il riflesso: un velo luminoso
  const rif = R.riflessoA - R.riflessoDa;
  rumore(b, at(R.riflessoDa), { dur: rif, g: 0.05, tipo: "bandpass", f: 2600, f1: 9500, q: 2.5, att: rif * 0.4, pan: -0.2, riv: 0.6 });
  tono(b, at(R.riflessoDa + 0.1), { f: 2637, f1: 3951, dur: 0.5, g: 0.012, att: 0.15, pan: 0.2, riv: 0.7 });
  // lo spegnimento: tutto scende in un attimo, la riga, il punto
  tono(b, at(R.spegneDa), { f: 1400, f1: 70, dur: 0.3, g: 0.11, att: 0.004, riv: 0.25 });
  rumore(b, at(R.spegneDa), { dur: 0.26, g: 0.09, tipo: "lowpass", f: 4200, f1: 220, riv: 0.2 });
  colpo(b, at(R.spentaA), 0.26, 80, 36, 0.24, 0.1);
  tono(b, at(R.spentaA + 0.02), { f: 5200, f1: 2400, dur: 0.22, g: 0.016, att: 0.004, riv: 0.4 });
}

/** Writes the score on a context (live or offline). The instants are on the clock of the context. */
export function scriviPartitura(ac: BaseAudioContext, uscita: AudioNode, inizio: number, livello = 1) {
  const b = banco(ac, uscita);
  b.master.gain.value = LIVELLO * livello;
  partituraRuntime(b, inizio);
  return b;
}

/**
 * The live sound of the logo. `avvia` gives back null when the audio cannot start by itself here (a
 * browser tab that has had no key press yet): then the logo plays in silence rather than late.
 */
export class SuonoRuntime {
  private constructor(private ac: AudioContext, private b: Banco, /** performance.now() when the logo is at `salto`, output latency included */ readonly inizioMs: number) {}

  /**
   * `livello` is the master volume (0..1) of the game's own settings. The picture is meant to be at
   * `salto` seconds of its own timeline at `quandoMs` (a performance.now() instant): the score is
   * written so that its first sound falls right there (`salto` skips the black at the logo's start).
   */
  static async avvia(livello: number, quandoMs: number, salto: number): Promise<SuonoRuntime | null> {
    try {
      const ac = new AudioContext({ latencyHint: "interactive" });
      if (ac.state !== "running") {
        await Promise.race([ac.resume().catch(() => {}), new Promise((r) => setTimeout(r, 400))]);
      }
      if (ac.state !== "running") {
        void ac.close().catch(() => {});
        return null;
      }
      // What is written now is heard `ritardo` later (the output latency): the sound goes out that much
      // early, so picture and sound reach the player together at `quandoMs`.
      const ritardo = ac.outputLatency || ac.baseLatency || 0;
      const dopoMs = Math.max(120, quandoMs - performance.now() - ritardo * 1000);   // at least the time to schedule everything
      const t0 = ac.currentTime + dopoMs / 1000;
      const b = scriviPartitura(ac, ac.destination, t0 - salto, livello);
      return new SuonoRuntime(ac, b, performance.now() + dopoMs + ritardo * 1000);
    } catch {
      return null;
    }
  }

  /** Fades out and closes (end of the logo, or Esc). */
  sfuma(secondi = 0.35) {
    const { ac, b } = this;
    if (ac.state === "closed") return;
    const ora = ac.currentTime;
    b.master.gain.cancelScheduledValues(ora);
    b.master.gain.setValueAtTime(b.master.gain.value, ora);
    b.master.gain.linearRampToValueAtTime(0, ora + secondi);
    setTimeout(() => { ac.close().catch(() => {}); }, (secondi + 0.1) * 1000);
  }
}
