import React from 'react';
import type { TracedObject } from './tracedTypes';

/**
 * Draws an object vectorised from the channel logo (see tools/trace_object.py in the intro project).
 * `unit` is how many caller units one logo pixel is worth; `outline` adds an ink halo around the
 * silhouette (in caller units) so the character keeps its cartoon outline at game size, where the
 * logo's own thin ink lines would shrink below a pixel.
 */
export const TracedGroup: React.FC<{
  obj: TracedObject;
  unit?: number;
  x?: number;
  y?: number;
  outline?: number;
  outlineColor?: string;
}> = ({ obj, unit = 1, x = 0, y = 0, outline = 0, outlineColor = '#2C2016' }) => {
  const k = unit / obj.scale;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      {outline > 0 && (
        <g fill={outlineColor} stroke={outlineColor} strokeWidth={(outline * 2) / k} strokeLinejoin="round">
          {obj.layers.map((layer, i) =>
            layer.paths.map((p, j) => <path key={`o${i}-${j}`} d={p.d} transform={`translate(${p.t})`} fillRule="evenodd" />)
          )}
        </g>
      )}
      {obj.layers.map((layer, i) => (
        <g key={i} fill={layer.fill} fillRule="evenodd">
          {layer.paths.map((p, j) => (
            <path key={j} d={p.d} transform={`translate(${p.t})`} />
          ))}
        </g>
      ))}
    </g>
  );
};
