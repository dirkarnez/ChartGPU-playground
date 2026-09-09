import type { ContinuousScale, LinearScale } from '../utils/scales';
/**
 * Clip affine for buffers packed as `x' = x - xOffset` (time-axis Float32 safety).
 *
 * Must sample near `xOffset` — `computeClipAffineFromScale(0,1)` then `bx + ax*xOffset`
 * loses digits when domain is ~1e12 epoch-ms (catastrophic cancellation). Same contract as
 * candlestick packing-origin affine.
 *
 * clipX = ax * x' + b  with  b = scale(xOffset), ax = scale(xOffset+δ) - scale(xOffset) for δ=1.
 *
 * **Log X:** packing is invalid under log projection (log of offset-relative x is wrong).
 * Callers must pass `xOffset === 0` for log X; this helper falls back to
 * {@link computeClipAffineFromContinuousScale} when `scale.kind === 'log'`.
 */
export declare function computePackedXAffineFromScale(scale: LinearScale, xOffset: number): {
    readonly a: number;
    readonly b: number;
};
/**
 * Linear (or raw-sample) clip affine: `clip = a * v + b` solved from two domain samples.
 *
 * For linear axes sampling `(0, 1)` recovers the exact domain→range affine regardless of
 * domain endpoints. **Do not** use raw `(0, 1)` for log axes (0 is outside domain).
 */
export declare function computeClipAffineFromScale(scale: ContinuousScale, v0: number, v1: number): {
    readonly a: number;
    readonly b: number;
};
/**
 * Domain→clip affine consistent with vertex-shader log projection.
 *
 * - **Linear:** samples domain 0 and 1 (same as historical line/scatter Y path).
 * - **Log:** solves `clip = a * log_b(v) + b` from domain endpoints so the VS can
 *   `log(v)/log(base)` then multiply by the mat4.
 */
export declare function computeClipAffineFromContinuousScale(scale: ContinuousScale): {
    readonly a: number;
    readonly b: number;
};
/**
 * Packed flags for series VS uniforms: bit0 = log X, bit1 = log Y.
 */
export declare function packLogAxisFlags(logX: boolean, logY: boolean): number;
/**
 * Resolve log projection params for a pair of continuous scales.
 * When both axes are linear, flags are 0 and bases are unused (still written as 10).
 * X and Y bases are independent so dual-log charts with mismatched bases project
 * correctly (affine helpers already solve with each scale’s own base).
 */
export declare function resolveLogProjection(xScale: ContinuousScale, yScale: ContinuousScale): {
    readonly logFlags: number;
    readonly logBaseX: number;
    readonly logBaseY: number;
};
//# sourceMappingURL=packedXAffine.d.ts.map