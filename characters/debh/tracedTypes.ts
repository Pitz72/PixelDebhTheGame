// Tipi comuni per gli oggetti vettorializzati dal logo.
export type TracedPath = { d: string; t: string };
export type TracedLayer = { fill: string; name: string; area: number; paths: TracedPath[] };
export type TracedObject = {
  name: string;
  /** dimensioni dello spazio di tracciatura (pixel logo * scale) */
  w: number;
  h: number;
  scale: number;
  /** angolo in alto a sinistra del ritaglio nel logo originale */
  origin: [number, number];
  layers: TracedLayer[];
};
