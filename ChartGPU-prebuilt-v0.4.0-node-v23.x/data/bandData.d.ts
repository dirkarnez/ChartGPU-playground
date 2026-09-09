/**
 * Band / range series data adapters (Xyy).
 *
 * Supports:
 * - ReadonlyArray<BandDataPoint | null> (tuple [x,y,y1] or {x,y,y1})
 * - BandXYYArraysData ({ x, y, y1 })
 * - InterleavedXYYData (ArrayBufferView, stride 3)
 *
 * Layout for GPU pack: Float32 stride 4 (x, y, y1, pad) for 16-byte alignment.
 *
 * @module bandData
 * @internal
 */
import type { BandDataPointTuple, BandSeriesData, BandXYYArraysData, InterleavedXYYData, SeriesSampling } from '../config/types';
import type { Bounds } from './cartesianData';
export type BandPoint = Readonly<{
    x: number;
    y: number;
    y1: number;
}>;
/** Reset length-mismatch warn cache (tests). */
export declare function resetBandLengthMismatchWarnings(): void;
export declare function isBandXYYArraysData(data: unknown): data is BandXYYArraysData;
export declare function isInterleavedXYYData(data: unknown): data is InterleavedXYYData;
/**
 * Number of logical samples. Array forms use min(x,y,y1) length.
 * Interleaved: floor(view.length / 3); non-multiple of 3 truncates the tail.
 */
export declare function getBandLength(data: BandSeriesData): number;
/**
 * Read one sample. Null array slots and non-finite x/y/y1 yield null
 * (or a point with NaN components when only some channels are invalid — pack uses NaN).
 */
export declare function getBandPoint(data: BandSeriesData, i: number): BandPoint | null;
export declare function getBandX(data: BandSeriesData, i: number): number;
/**
 * Bounds from all finite x and both y channels (y and y1).
 * Returns null when no finite contribution.
 */
export declare function bandBounds(data: BandSeriesData): Bounds | null;
/**
 * Visible-window Y envelope (both y and y1). Optional x window.
 */
export declare function scanBandVisibleYBounds(data: BandSeriesData, xWindow?: {
    readonly min: number;
    readonly max: number;
} | null): {
    yMin: number;
    yMax: number;
} | null;
/**
 * Strictly positive finite y/y1 envelope (log-axis auto domain).
 * Both channels contribute independently when positive.
 */
export declare function scanBandPositiveYBounds(data: BandSeriesData, xWindow?: {
    readonly min: number;
    readonly max: number;
} | null): {
    yMin: number;
    yMax: number;
} | null;
/**
 * Seed mutable Xyy columns from any BandSeriesData (hit-test / append store).
 */
export declare function bandDataToMutableXYY(data: BandSeriesData): {
    x: number[];
    y: number[];
    y1: number[];
};
/**
 * True when a payload looks like band data (has y1 channel) rather than plain XY.
 * Used to warn on cartesian-only append to band series.
 */
export declare function isBandShapedPayload(data: unknown): boolean;
/**
 * Pack into Float32 stride-4: [x, y, y1, 0] per point (16-byte BandPoint).
 * Null / non-finite any of x/y/y1 → NaN for that channel (segment discard uses dual-endpoint).
 * Returns logical point count written.
 */
export declare function packBandPoints(data: BandSeriesData, out: Float32Array, pointCount?: number): number;
/**
 * Pack y-curve (or y1-curve) as interleaved XY Float32 for stroke LineRenderer buffers.
 * `channel`: 0 = y, 1 = y1.
 */
export declare function packBandStrokeXY(data: BandSeriesData, out: Float32Array, channel: 0 | 1, pointCount?: number): number;
/** True when any sample is a null array slot or has a non-finite x/y/y1. */
export declare function hasBandNullGaps(data: BandSeriesData): boolean;
/**
 * Drop null / non-finite gap samples (connectNulls path). Returns dense XYY arrays.
 */
export declare function filterBandGaps(data: BandSeriesData): BandXYYArraysData;
/**
 * Sample band series per dual-Y policy (D5).
 * `'ohlc'` is not supported — falls back to full data.
 */
export declare function sampleBandSeries(data: BandSeriesData, mode: SeriesSampling | Exclude<SeriesSampling, 'ohlc'>, threshold: number): BandSeriesData;
/**
 * Slice band points by x window (inclusive). Returns dense tuple array.
 */
export declare function sliceBandByX(data: BandSeriesData, xMin: number, xMax: number): BandDataPointTuple[];
/**
 * O(1) content stamp when band data reference changes.
 */
export declare function cheapBandContentStamp(data: BandSeriesData): number;
/**
 * Append band points onto mutable XYY columns (in-place growth).
 * Accepts any BandSeriesData payload; returns new length.
 */
export declare function appendBandIntoXYYColumns(columns: {
    x: number[];
    y: number[];
    y1: number[];
}, append: BandSeriesData, plan?: {
    readonly newSrcOffset?: number;
    readonly keepNewCount?: number;
}): number;
/**
 * Extend bounds with band samples (both y channels).
 */
export declare function extendBoundsWithBandData(prev: Bounds | null | undefined, data: BandSeriesData): Bounds | null;
/**
 * Convert owned mutable XYY columns to BandXYYArraysData view.
 */
export declare function asBandXYYArrays(columns: {
    readonly x: ArrayLike<number>;
    readonly y: ArrayLike<number>;
    readonly y1: ArrayLike<number>;
}): BandXYYArraysData;
//# sourceMappingURL=bandData.d.ts.map