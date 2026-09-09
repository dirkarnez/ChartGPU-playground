/**
 * Pure eligibility for O(k) DataStore.appendSeries on line / area series.
 *
 * Full raw resident kinds (`fullRawLine`, `gpuDecimationRaw`) are append-safe at
 * any zoom — the buffer holds full raw, not a zoomed sampled slice.
 * Cold `unknown` unlocks when sampling is `'none'` or GPU decimation is eligible
 * (before the first prepare tags the kind).
 *
 * Pure `type: 'area'` is included so streaming dashboards can ranged-append into
 * the same DataStore buffer the area renderer binds (private pack identity-cache
 * cannot see in-place column growth under a stable ref).
 *
 * @module canRangedAppendLine
 * @internal
 */
import type { ResolvedSeriesConfig } from '../../../config/OptionResolver';
import type { CartesianSeriesData, SeriesSampling, SeriesType } from '../../../config/types';
/** What DataStore currently holds for a series index (written by prepareSeries). */
export type DataStoreBufferKind = 'unknown' | 'fullRawLine' | 'gpuDecimationRaw' | 'other';
export type CanRangedAppendLineInput = {
    readonly seriesType: SeriesType | string;
    readonly sampling: SeriesSampling | string | undefined;
    readonly kind: DataStoreBufferKind;
    /** Runtime raw (or series raw) for GPU-decimation eligibility when kind is cold/active. */
    readonly rawData: CartesianSeriesData | null | undefined;
    /** Full series config when available (areaStyle, samplingThreshold, etc.). */
    readonly series?: ResolvedSeriesConfig | null;
};
/**
 * True when ranged append may write only the new points without full setSeries.
 */
export declare function canRangedAppendLine(input: CanRangedAppendLineInput): boolean;
//# sourceMappingURL=canRangedAppendLine.d.ts.map