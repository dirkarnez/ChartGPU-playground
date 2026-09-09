/**
 * Visible Slice Computation Utilities
 *
 * Provides efficient data slicing for zoom operations using binary search
 * when data is monotonic, with fallback to linear filtering.
 *
 * Key features:
 * - Binary search slicing for O(log n) performance on sorted data
 * - WeakMap caching of monotonicity checks to avoid O(n) scans
 * - Separate implementations for cartesian (x-based) and OHLC (timestamp-based) data
 * - Support for DataPoint[], XYArraysData, InterleavedXYData, plus internal
 *   RingXYColumns / StagingRingView (materialized chronologically when sliced)
 */
import type { CartesianSeriesData, OHLCDataPoint, OHLCDataPointTuple } from '../../../config/types';
export declare function isTupleOHLCDataPoint(p: OHLCDataPoint): p is OHLCDataPointTuple;
/**
 * Checks if cartesian data is monotonic non-decreasing by X coordinate with all finite values.
 *
 * **Array / XY / interleaved** (including coordinator-owned MutableXYColumns that
 * grow under a stable identity): WeakMap entry `{ mono, count, lastX }`. Pure
 * mono growth only re-checks the new tail (O(append)) — critical for multi‑M
 * streaming hover so we never re-scan 15M points every hit-test.
 *
 * **Mutable ring / staging:** generation-aware cache (start/count/capacity/
 * xOffset/staging/`contentEpoch`). Pure mono append and partial FIFO drop+append
 * re-verify only new points; strict full replace full-scans.
 *
 * First visit of huge series (n ≫ soft cap): strided sample may only **reject**
 * mono; otherwise progressive full-scan in soft-cap chunks until proven mono.
 * Never return mono=true from optimistic stride alone (M2). Sorted multi-M gains
 * tight binary windows after progressive proof completes (not permanent full-span).
 */
export declare function isMonotonicNonDecreasingFiniteX(data: CartesianSeriesData): boolean;
/**
 * Slices cartesian data to the visible X range [xMin, xMax].
 *
 * Uses binary search (O(log n)) when data is monotonic by X;
 * otherwise falls back to linear filtering (O(n)).
 *
 * @param data - Cartesian data in any supported format
 * @param xMin - Minimum X value (inclusive)
 * @param xMax - Maximum X value (inclusive)
 * @returns Sliced data in the same format as input
 */
export declare function sliceVisibleRangeByX(data: CartesianSeriesData, xMin: number, xMax: number): CartesianSeriesData;
/**
 * Finds the index range of visible points in cartesian data.
 *
 * Returns { start, end } indices suitable for slicing or iteration.
 * Only works correctly when data is monotonic; returns full range otherwise.
 *
 * @param data - Cartesian data in any supported format
 * @param xMin - Minimum X value (inclusive)
 * @param xMax - Maximum X value (inclusive)
 * @returns Index range { start, end } for visible data
 */
export declare function findVisibleRangeIndicesByX(data: CartesianSeriesData, xMin: number, xMax: number): {
    readonly start: number;
    readonly end: number;
};
/**
 * Slices OHLC/candlestick data to the visible timestamp range [xMin, xMax].
 *
 * Uses binary search (O(log n)) when timestamps are monotonic;
 * otherwise falls back to linear filtering (O(n)).
 *
 * @param data - OHLC data points (tuple or object format)
 * @param xMin - Minimum timestamp (inclusive)
 * @param xMax - Maximum timestamp (inclusive)
 * @returns Sliced data array containing only points within [xMin, xMax]
 */
export declare function sliceVisibleRangeByOHLC(data: ReadonlyArray<OHLCDataPoint>, xMin: number, xMax: number): ReadonlyArray<OHLCDataPoint>;
//# sourceMappingURL=computeVisibleSlice.d.ts.map