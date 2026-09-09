import type { CartesianSeriesData, DataPoint } from '../config/types';
/**
 * LTTB index selection over cartesian data using Float64 domain x via {@link getX}.
 * Avoids packing absolute epoch-ms into Float32 before index choice (which collapses
 * second-spaced timestamps at modern epoch scale).
 */
export declare function lttbIndicesForCartesian(data: CartesianSeriesData, targetPoints: number): Int32Array;
/**
 * Sample cartesian series via Float64-domain LTTB indices, returning DataPoint tuples
 * with original domain x (and optional size).
 */
export declare function lttbSampleCartesian(data: CartesianSeriesData, targetPoints: number): DataPoint[];
export declare function lttbSample(data: Float32Array, targetPoints: number): Float32Array;
export declare function lttbSample(data: DataPoint[], targetPoints: number): DataPoint[];
export declare function lttbSample(data: ReadonlyArray<DataPoint>, targetPoints: number): ReadonlyArray<DataPoint>;
//# sourceMappingURL=lttbSample.d.ts.map