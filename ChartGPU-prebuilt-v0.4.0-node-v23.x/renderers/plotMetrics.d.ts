/**
 * Shared plot-space metrics and CSS→domain converters for series renderers.
 *
 * Canonical home for helpers previously copy-pasted across errorBar, impulse,
 * ohlc, candlestick, etc. Coordinator-side clip/scissor also live in
 * `renderCoordinator/utils/axisUtils.ts` (same math; width/height variants here).
 *
 * **Consumers (wired):** createErrorBarRenderer, createImpulseRenderer,
 * createOhlcRenderer, createCandlestickRenderer.
 *
 * **Residual private copies (deferred U4):** createBarRenderer, createScatterRenderer,
 * createScatterDensityRenderer, createHeatmapRenderer, createAreaRenderer,
 * createLineRenderer, createPieRenderer, createAnnotationMarkerRenderer,
 * createDecimationCompute — migrate opportunistically when those files are touched;
 * not a single bulk rewrite to limit review risk.
 *
 * @module plotMetrics
 * @internal
 */
import type { ContinuousScale } from '../utils/scales';
import type { GridArea } from './createGridRenderer';
export declare const clamp01: (v: number) => number;
export declare const clampInt: (v: number, lo: number, hi: number) => number;
export declare const nextPow2: (v: number) => number;
export declare const nearEqual: (a: number, b: number) => boolean;
export type PlotSizeCssPx = {
    readonly plotWidthCss: number;
    readonly plotHeightCss: number;
};
export declare function computePlotSizeCssPx(gridArea: GridArea): PlotSizeCssPx | null;
export type PlotClipRect = {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
    readonly width: number;
    readonly height: number;
};
export declare function computePlotClipRect(gridArea: GridArea): PlotClipRect;
export type PlotScissorDevicePx = {
    readonly x: number;
    readonly y: number;
    readonly w: number;
    readonly h: number;
};
export declare function computePlotScissorDevicePx(gridArea: GridArea): PlotScissorDevicePx;
/** Write a 2D affine transform into a column-major mat4 (clip = a*domain + b). */
export declare function writeTransformMat4F32(out: Float32Array, ax: number, bx: number, ay: number, by: number): void;
export type CssToDomainConverters = {
    readonly cssWidthToDomainX: (cssPx: number) => number;
    readonly cssHeightToDomainY: (cssPx: number) => number;
};
/**
 * Build CSS-px → domain converters for the current plot + scales.
 * Log axes use geometric mid of the domain for a local width estimate.
 */
export declare function createCssToDomainConverters(args: {
    readonly xScale: ContinuousScale;
    readonly yScale: ContinuousScale;
    readonly ax: number;
    readonly ay: number;
    readonly clipPerCssX: number;
    readonly clipPerCssY: number;
}): CssToDomainConverters;
//# sourceMappingURL=plotMetrics.d.ts.map