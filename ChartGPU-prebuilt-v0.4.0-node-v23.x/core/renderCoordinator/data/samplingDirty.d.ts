/**
 * Sampling / baseline dirty predicates (P1-7).
 *
 * Separates "raw data / sampling config dirty" from "presentation dirty" so
 * theme/legend/tooltip-only option updates can patch series metadata without
 * re-running the multi-stage CPU sampling pipeline.
 *
 * @module samplingDirty
 */
import type { ResolvedChartGPUOptions, ResolvedSeriesConfig } from '../../../config/OptionResolver';
import type { Bounds } from '../../../data/cartesianData';
/**
 * Cheap structural + content check: did series raw data change?
 *
 * Uses reference equality first. When the raw ref is stable, compares
 * `contentHash` when both sides present and differ. Note: normal
 * `resolveOptions` identity-reuses contentHash for a stable data reference, so
 * in-place value mutations under the same array are **not** detected on the
 * public setOption path (callers must pass a new data reference or use
 * `appendData`). A differing contentHash under the same ref is only meaningful
 * if a caller/test manually supplies hashes.
 */
export declare function didSeriesDataLikelyChange(prev: ResolvedChartGPUOptions['series'], next: ResolvedChartGPUOptions['series']): boolean;
/**
 * Baseline recompute is needed when raw data or sampling-related series config changes.
 * Presentation-only updates (theme, colors, names, legend, tooltip) return false.
 */
export declare function shouldRecomputeBaselineSampling(prev: ResolvedChartGPUOptions['series'], next: ResolvedChartGPUOptions['series']): boolean;
/**
 * Patch presentation fields from `nextSeries` onto previous baseline/render series
 * while retaining already-sampled `data`, `rawData`, and `contentHash`.
 *
 * **rawBounds:** Prefer `next.rawBounds` when `rawBoundsMode` changes (axes
 * explicit ↔ auto under a stable data ref). Otherwise keep prior bounds so we
 * do not thrash object identity on pure theme/color updates.
 *
 * Used when setOptions is presentation-only so series colors/styles update without LTTB.
 */
export declare function patchSeriesPresentationKeepingSampledData(nextSeries: ResolvedChartGPUOptions['series'], previousSampled: ReadonlyArray<ResolvedSeriesConfig>): ResolvedSeriesConfig[];
/**
 * Presentation-only impulse baseline change: update the runtime bounds store so
 * auto-Y (which prefers runtimeRawBoundsByIndex over series.rawBounds) expands.
 *
 * Returns true when any slot was updated. Mutates `runtimeRawBoundsByIndex` in place.
 */
export declare function syncRuntimeBoundsForImpulseBaselineChange(input: {
    readonly prev: ResolvedChartGPUOptions['series'];
    readonly next: ResolvedChartGPUOptions['series'];
    readonly runtimeRawDataByIndex: ReadonlyArray<unknown>;
    readonly runtimeRawBoundsByIndex: Array<Bounds | null>;
}): boolean;
/**
 * True when any series' `rawBoundsMode` changed between prev and next resolve
 * (axes explicitness flip under stable data). Callers should refresh runtime
 * bounds stores that may still hold synthetic extents.
 */
export declare function didRawBoundsModeChange(prev: ResolvedChartGPUOptions['series'], next: ResolvedChartGPUOptions['series']): boolean;
//# sourceMappingURL=samplingDirty.d.ts.map