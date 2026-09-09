/**
 * Error-bar (HLC) series data adapters.
 *
 * Supports absolute HLC, relative errors, tuples, and objects.
 * Relative forms resolve to owned absolute high/low arrays (never mutates caller).
 *
 * @module errorBarData
 * @internal
 */
import type { ErrorBarDirection, ErrorBarHlcArraysData, ErrorBarMode, ErrorBarRelativeArraysData, ErrorBarSeriesData } from '../config/types';
import type { Bounds } from './cartesianData';
export type ErrorBarPoint = Readonly<{
    readonly x: number;
    readonly y: number;
    readonly high: number;
    readonly low: number;
}>;
/** Owned columnar HLC used after resolve / append. */
export type MutableErrorBarHlcColumns = {
    x: number[];
    y: number[];
    high: number[];
    low: number[];
};
/** Reset one-shot warn cache (tests). */
export declare function resetErrorBarWarnings(): void;
export declare function isErrorBarHlcArraysData(data: unknown): data is ErrorBarHlcArraysData;
export declare function isErrorBarRelativeSymmetric(data: unknown): data is Extract<ErrorBarRelativeArraysData, {
    yError: ArrayLike<number> | number;
}>;
export declare function isErrorBarRelativeAsymmetric(data: unknown): data is Extract<ErrorBarRelativeArraysData, {
    yErrorHigh: ArrayLike<number> | number;
    yErrorLow: ArrayLike<number> | number;
}>;
export declare function isErrorBarRelativeData(data: unknown): data is ErrorBarRelativeArraysData;
/**
 * True when payload looks like error-bar data (HLC or relative), not plain XY / band.
 * Used to validate appendData.
 */
export declare function isErrorBarShapedPayload(data: unknown): boolean;
/**
 * Swap low/high when low > high. Returns ordered pair (does not mutate).
 * One-shot warn when swap occurs.
 */
export declare function normalizeErrorBarHighLow(high: number, low: number): {
    readonly high: number;
    readonly low: number;
    readonly swapped: boolean;
};
/**
 * Convert relative error forms to absolute HLC columns (owned arrays).
 * Symmetric: high = y + |e|, low = y - |e|.
 * Asymmetric: high = y + |yErrorHigh|, low = y - |yErrorLow| (offsets use abs).
 */
export declare function relativeToAbsoluteHlc(data: ErrorBarRelativeArraysData): ErrorBarHlcArraysData;
/**
 * Normalize any accepted payload into owned absolute HLC columns.
 * Does not mutate caller-owned typed arrays / objects.
 */
export declare function resolveErrorBarToHlc(data: ErrorBarSeriesData): ErrorBarHlcArraysData;
/**
 * Number of logical samples. Array forms use min of channels.
 */
export declare function getErrorBarLength(data: ErrorBarSeriesData): number;
export declare function getErrorBarPoint(data: ErrorBarSeriesData, i: number): ErrorBarPoint | null;
/**
 * Whether a sample is drawable for the given errorMode (D6).
 * Skip when y non-finite or required ends non-finite for active mode.
 */
export declare function isErrorBarSampleDrawable(point: ErrorBarPoint | null, errorMode?: ErrorBarMode): point is ErrorBarPoint;
/**
 * Bounds from centers and high/low (or left/right for horizontal).
 * Vertical: X = all finite x; Y = y, high, low.
 * Horizontal: X = x, high, low; Y = all finite y.
 *
 * Relative / mixed array payloads are resolved once to HLC (O(n)), not per-index.
 */
export declare function errorBarBounds(data: ErrorBarSeriesData, direction?: ErrorBarDirection): Bounds | null;
export declare function extendBoundsWithErrorBarData(prev: Bounds | null | undefined, data: ErrorBarSeriesData, direction?: ErrorBarDirection): Bounds | null;
/** Seed mutable HLC columns from any ErrorBarSeriesData. */
export declare function errorBarDataToMutableHlc(data: ErrorBarSeriesData): MutableErrorBarHlcColumns;
export declare function asErrorBarHlcArrays(cols: MutableErrorBarHlcColumns): ErrorBarHlcArraysData;
/**
 * Append HLC / relative / tuple payload into mutable columns.
 * Relative batches are resolved first (owned intermediate).
 */
export declare function appendErrorBarIntoHlcColumns(cols: MutableErrorBarHlcColumns, batch: ErrorBarSeriesData, options?: {
    readonly newSrcOffset?: number;
    readonly keepNewCount?: number;
}): void;
/**
 * Cheap content stamp for OptionResolver reuse.
 *
 * Samples length + first / mid / last points (O(1)). **In-place mutation of
 * middle samples under a stable data reference may not change the stamp** —
 * pass a new data reference (or use appendData) when content changes.
 * Matches the library-wide data-identity contract used for OHLC/cartesian stamps.
 */
export declare function cheapErrorBarContentStamp(data: ErrorBarSeriesData): number;
/**
 * Category spacing for capWidth percent resolution.
 * - Vertical bars: min positive Δx (category along X)
 * - Horizontal bars: min positive Δy (category along Y)
 */
export declare function computeErrorBarCategoryStep(data: ErrorBarSeriesData, direction?: ErrorBarDirection): number;
//# sourceMappingURL=errorBarData.d.ts.map