/**
 * Bounds computation utilities for the RenderCoordinator.
 *
 * These pure functions compute xMin/xMax/yMin/yMax bounds from data arrays
 * and aggregate bounds across series. They handle edge cases like empty data,
 * NaN/Infinity values, and zero-span domains.
 *
 * @module boundsComputation
 */
import type { OHLCDataPoint } from '../../../config/types';
/**
 * Bounds type for min/max x and y values.
 */
type Bounds = Readonly<{
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
}>;
/**
 * Extends bounds with OHLC candlestick data using low/high values.
 * If bounds is null, initializes bounds from OHLC points.
 *
 * @param bounds - Existing bounds or null
 * @param points - OHLC points (timestamp, open, high, low, close)
 * @returns Updated bounds or original bounds if no finite points
 */
export declare const extendBoundsWithOHLCDataPoints: (bounds: Bounds | null, points: ReadonlyArray<OHLCDataPoint>) => Bounds | null;
/**
 * Ensures min ≤ max, handles infinities with defaults (0,1), handles zero-span domains.
 * Returns a usable domain for scale derivation.
 *
 * @param minCandidate - Candidate minimum value
 * @param maxCandidate - Candidate maximum value
 * @returns Normalized domain with min ≤ max, both finite
 */
export declare const normalizeDomain: (minCandidate: number, maxCandidate: number) => {
    readonly min: number;
    readonly max: number;
};
/**
 * Sanitize a domain for logarithmic axes.
 *
 * - Both ends must be finite and strictly positive.
 * - Explicit min/max ≤ 0 are clamped using `positiveDataMin` when available
 *   (prefer `positiveDataMin * 0.5`, floored at a power of `base`), else fallback.
 * - Empty / all-non-positive data → `[1, 10]` (or `[1, base]` when base > 1).
 *
 * @returns Sanitized domain plus whether a clamp/fallback warning was applied
 */
export declare function sanitizeLogDomain(minCandidate: number, maxCandidate: number, options?: Readonly<{
    base?: number;
    /** Smallest positive finite data value on this axis (for clamping explicit ≤0). */
    positiveDataMin?: number;
    /** When true, emit a console warning on clamp/fallback (dev). */
    warn?: boolean;
    /**
     * Stable key for de-duplicating warnings (e.g. `'x'`, `'y:0'`).
     * Warns once per key, or again when the sanitized `[min, max]` changes.
     */
    warnKey?: string;
}>): {
    readonly min: number;
    readonly max: number;
    readonly warned: boolean;
};
export {};
//# sourceMappingURL=boundsComputation.d.ts.map