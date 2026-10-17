// ====================================================================
//  Time and easing curves of the logo animation: pure functions of the time t (seconds).
//  Imported from "Il Relitto Silente" (trailer/tempo.ts), same author.
// ====================================================================

export const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x);

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Avanzamento 0→1 di t dentro [a, b]. */
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

export const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

export const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);

export const easeIn = (k: number) => k * k * k;

/** Uscita «da cinema»: parte decisa, atterra morbida. */
export const expoOut = (k: number) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k));

/** Mescola due colori #rrggbb. */
export function mix(c1: string, c2: string, k: number) {
  const p = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const a = p(c1), b = p(c2);
  const r = a.map((x, i) => Math.round(lerp(x, b[i], clamp(k))));
  return "#" + r.map((x) => x.toString(16).padStart(2, "0")).join("");
}
