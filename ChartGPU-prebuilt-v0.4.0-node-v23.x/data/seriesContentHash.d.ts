/**
 * Content fingerprint for series raw data (P1-7 correctness).
 *
 * Used when the raw data **reference** changes (or no prior hash is available).
 * `OptionResolver.resolveSeriesContentHash` reuses a previous `contentHash` in
 * O(1) when the data reference is unchanged — full scans are not performed on
 * every axes-only / presentation-only `setOption`.
 *
 * **Full rewrite path:** When the data reference changes every frame (harnesses
 * regenerating arrays), use {@link cheapCartesianContentStamp}.
 *
 * @module seriesContentHash
 */
import type { CartesianSeriesData, OHLCDataPoint } from '../config/types';
/**
 * O(1) content stamp for cartesian series when the data **reference** changed.
 *
 * Not a content fingerprint: does not scan point values. Mixes point count with a
 * generation counter so consecutive same-length rewrites produce distinct stamps.
 */
export declare function cheapCartesianContentStamp(data: CartesianSeriesData): number;
/**
 * O(1) content stamp for OHLC series when the data reference changed.
 * See {@link cheapCartesianContentStamp}.
 */
export declare function cheapOHLCContentStamp(data: ReadonlyArray<OHLCDataPoint>): number;
//# sourceMappingURL=seriesContentHash.d.ts.map