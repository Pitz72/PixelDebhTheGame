/**
 * Rasterises an SVG string (the game's existing vector art, rendered from the React components)
 * into a canvas that Pixi can upload as a texture.
 */

const sanitiseRoot = (svg: string, width: number, height: number): string => {
  const open = svg.match(/^<svg[^>]*>/);
  if (!open) throw new Error('Not an SVG string');
  let tag = open[0];
  tag = tag.replace(/\s(class|style|width|height|xmlns)="[^"]*"/g, '');
  tag = tag.replace('<svg', `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"`);
  return tag + svg.slice(open[0].length);
};

/** Boss components wrap the SVG in a div; keep only the <svg>...</svg>. */
export const extractSvg = (markup: string): string => {
  const start = markup.indexOf('<svg');
  const end = markup.lastIndexOf('</svg>');
  if (start < 0 || end < 0) throw new Error('No <svg> found in markup');
  return markup.slice(start, end + '</svg>'.length);
};

/** SVG <text> cannot use the page's fonts once the SVG is an image, so labels are drawn by Pixi instead. */
export const stripText = (svg: string): string => svg.replace(/<text[\s\S]*?<\/text>/g, '');

export async function svgToCanvas(
  svg: string,
  logicalWidth: number,
  logicalHeight: number,
  scale: number
): Promise<HTMLCanvasElement> {
  const w = Math.round(logicalWidth * scale);
  const h = Math.round(logicalHeight * scale);
  const source = sanitiseRoot(svg, w, h);
  const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.decoding = 'async';
    const loaded = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('SVG failed to load as an image'));
    });
    img.src = url;
    await loaded;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas unavailable');
    ctx.drawImage(img, 0, 0, w, h);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}
