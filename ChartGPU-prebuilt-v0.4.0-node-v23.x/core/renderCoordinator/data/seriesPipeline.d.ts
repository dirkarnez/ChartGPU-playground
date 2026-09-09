/**
 * Series display pipeline — owns sample/raw resolution for coordinator recompute.
 *
 * Pure functions used by createRenderCoordinatorImpl for:
 * - baseline recompute (`mode: 'baseline'`)
 * - setOptions full-rewrite raw alignment (`mode: 'setOptionsReuse'`)
 * - zoomed recompute (`mode: 'zoomed'` with sample target + optional buffer slice)
 *
 * @module seriesPipeline
 * @internal
 */
import type { ResolvedChartGPUOptions, ResolvedSeriesConfig } from '../../../config/OptionResolver';
import type { BandSeriesData, CartesianSeriesData, OHLCDataPoint } from '../../../config/types';
/** Runtime raw slot — any runtime series raw ref (columns, ring, staging, OHLC, empty). */
type RuntimeRawSlot = unknown;
type RawBoundsSlot = Readonly<{
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
}> | null | undefined;
/**
 * Full baseline recompute for all series indices.
 */
export declare function buildRuntimeBaseSeries(series: ResolvedChartGPUOptions['series'], runtimeRawDataByIndex: ReadonlyArray<RuntimeRawSlot>, runtimeRawBoundsByIndex: ReadonlyArray<RawBoundsSlot>): ResolvedChartGPUOptions['series'];
export declare function buildSetOptionsReuseSeries(series: ResolvedChartGPUOptions['series'], runtimeRawDataByIndex: ReadonlyArray<RuntimeRawSlot>, runtimeRawBoundsByIndex: ReadonlyArray<RawBoundsSlot>): ResolvedChartGPUOptions['series'];
type ZoomedSeriesResult = {
    readonly series: ResolvedSeriesConfig;
    /** When set, caller should store into lastSampledData[i]. */
    readonly cacheEntry: {
        readonly data: CartesianSeriesData | ReadonlyArray<OHLCDataPoint> | BandSeriesData;
        readonly cachedRange: {
            readonly min: number;
            readonly max: number;
        };
    } | null;
};
/**
 * One zoomed series entry.
 *
 * - GPU-eligible cartesian (`lttb`/`min`/`max` without null gaps): keep full raw;
 *   prepare scopes via visibleStart/End on the compute path.
 * - `sampling: 'none'`: also keep full raw. Zoom must not replace `data` with a
 *   visible slice — DataStore is tagged `fullRawLine` for ranged append, and
 *   uploading a windowed subset then append-streaming corrupts the buffer and
 *   makes right-side zoom show the wrong prefix (live-streaming regression).
 * - Other CPU sampling: sample a buffered X window at a zoom-scaled target.
 */
export declare function resolveZoomedSeriesEntry(input: {
    readonly series: ResolvedSeriesConfig;
    readonly rawSlot: RuntimeRawSlot;
    readonly bufferedMin: number;
    readonly bufferedMax: number;
    readonly visibleMin: number;
    readonly visibleMax: number;
    readonly spanFraction: number;
    readonly sliceX: (data: CartesianSeriesData, min: number, max: number) => CartesianSeriesData;
    readonly sliceOHLC: (data: ReadonlyArray<OHLCDataPoint>, min: number, max: number) => ReadonlyArray<OHLCDataPoint>;
}): ZoomedSeriesResult;
export {};
//# sourceMappingURL=seriesPipeline.d.ts.map