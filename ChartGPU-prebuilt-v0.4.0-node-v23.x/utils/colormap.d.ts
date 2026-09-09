/**
 * Shared colormap LUT builders (scatter density + uniform heatmap).
 *
 * Named stops stay consistent across series types so viridis/plasma/inferno
 * match visually whether used as densityColormap or heatmap.colormap.
 */
import { type Rgba01 } from './colors';
export type NamedColormap = 'viridis' | 'plasma' | 'inferno' | 'magma' | 'grayscale';
export type ColormapSpec = NamedColormap | readonly string[];
/**
 * Compact CSS stop lists for named colormaps (interpolated to 256 entries).
 */
export declare function getNamedColormapStops(name: NamedColormap): readonly string[];
export declare function isNamedColormap(v: unknown): v is NamedColormap;
/**
 * Stable string key for dirty-gating LUT rebuilds.
 */
export declare function colormapKey(colormap: ColormapSpec): string;
/**
 * Build a 256×RGBA8 unorm LUT (1024 bytes) from named or custom stops.
 * Endpoints match first/last stop colors (t=0 and t=1).
 */
export declare function buildColormapLut(colormap: ColormapSpec): Uint8Array<ArrayBuffer>;
/**
 * Sample colormap at t ∈ [0,1] (clamped). Useful for tests and CPU reference.
 */
export declare function sampleHeatmapColormap(colormap: ColormapSpec, t: number): Rgba01;
//# sourceMappingURL=colormap.d.ts.map