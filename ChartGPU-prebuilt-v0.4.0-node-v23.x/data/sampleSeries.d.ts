import type { CartesianSeriesData, SeriesSampling } from '../config/types';
/**
 * Packs CartesianSeriesData into a Float32Array (absolute domain x).
 * **Not used for LTTB index selection on time axes** — Float32 ULP at epoch-ms
 * (~1e12) is ~1.3e5 ms and collapses second-spaced points before LTTB runs.
 * Kept for tests / callers that intentionally want absolute Float32 pack.
 * @internal
 */
export declare function packToFloat32ArrayAbsolute(data: CartesianSeriesData): Float32Array;
/**
 * Samples CartesianSeriesData using the specified sampling strategy.
 *
 * Returns the ORIGINAL data reference when:
 * - `sampling === 'none'`
 * - `samplingThreshold` is invalid/non-positive
 * - Point count <= threshold
 *
 * When sampling occurs:
 * - For `lttb`:
 *   - Float32Array interleaved → sampled Float32Array (domain x already Float32)
 *   - Float64 interleaved / other typed arrays / XYArraysData / DataPoint[] →
 *     Float64-domain LTTB (`lttbSampleCartesian`); returns `DataPoint[]` with
 *     original domain x (epoch-ms safe). Null gaps are filtered first, then the
 *     same Float64 path runs on the non-null points.
 * - For `average`/`max`/`min`:
 *   - Returns DataPointTuple[] for all input formats
 */
export declare function sampleSeriesDataPoints(data: CartesianSeriesData, sampling: SeriesSampling, samplingThreshold: number): CartesianSeriesData;
//# sourceMappingURL=sampleSeries.d.ts.map