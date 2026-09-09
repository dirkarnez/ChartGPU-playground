/**
 * Pure display/sample resolution for series prepare paths.
 *
 * Single place for: GPU-decimation keeps full raw on the series; otherwise
 * CPU `sampleSeriesDataPoints` (or OHLC sample for candles).
 *
 * @module resolveSeriesDisplayData
 * @internal
 */
import type { ResolvedSeriesConfig } from '../../../config/OptionResolver';
import type { CartesianSeriesData, OHLCDataPoint } from '../../../config/types';
type DisplayResolveMode = 'baseline' | 'zoomed' | 'setOptionsReuse';
/**
 * Baseline / setOptions: choose series `data` for one cartesian line-like series.
 * GPU-eligible → raw; null-gap data → raw (preserve segmentation); else sample.
 */
export declare function resolveCartesianDisplayData(input: {
    readonly series: ResolvedSeriesConfig;
    readonly raw: CartesianSeriesData;
    readonly mode: DisplayResolveMode;
    /** Zoomed path: override sample target (threshold scaled by zoom). */
    readonly sampleTarget?: number;
}): CartesianSeriesData;
/**
 * Candlestick baseline sample-or-raw.
 */
export declare function resolveCandlestickDisplayData(input: {
    readonly sampling: string | undefined;
    readonly samplingThreshold: number;
    readonly rawOHLC: ReadonlyArray<OHLCDataPoint>;
    readonly sampleTarget?: number;
}): ReadonlyArray<OHLCDataPoint>;
/**
 * Zoom target point count from base threshold and visible span fraction.
 */
export declare function computeZoomSampleTarget(baseThreshold: number, spanFraction: number, options?: {
    readonly minTarget?: number;
    readonly maxAbs?: number;
    readonly maxMultiplier?: number;
}): number;
export {};
//# sourceMappingURL=resolveSeriesDisplayData.d.ts.map