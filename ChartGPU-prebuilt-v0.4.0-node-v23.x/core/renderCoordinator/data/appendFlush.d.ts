/**
 * Append flush ownership — pending-append flush for the render coordinator.
 * Uses a single deps bag (d) for all closed-over state/helpers.
 * @module appendFlush
 * @internal
 */
import type { ResolvedChartGPUOptions } from '../../../config/OptionResolver';
import type { BandSeriesData, CartesianSeriesData, ErrorBarSeriesData, OHLCDataPoint } from '../../../config/types';
import type { ZoomRange } from '../../../interaction/createZoomState';
import type { DataStore } from '../../../data/createDataStore';
import type { DataStoreBufferKind, CanRangedAppendLineInput } from './canRangedAppendLine';
/** Pending append batch stored per series index. */
type PendingAppendBatch = {
    readonly points: CartesianSeriesData | ReadonlyArray<OHLCDataPoint> | BandSeriesData | ErrorBarSeriesData;
    readonly maxPoints?: number;
};
/** Bounds slot used by flush for domain extension. */
type AppendFlushBounds = {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
} | null;
/**
 * Typed dependency bag for the owned append flush.
 *
 * Structural types are intentionally wide where coordinator helpers differ
 * slightly (e.g. normalizeMaxPoints null vs undefined). Call site uses
 * `as AppendFlushDeps` after assembling live bindings.
 */
export interface AppendFlushDeps {
    pendingAppendByIndex: Map<number, PendingAppendBatch[]>;
    appendedGpuThisFrame: Set<number>;
    zoomState: {
        getRange: () => ZoomRange | null;
        setRange: (start: number, end: number) => void;
        setSpanConstraints?: (minSpan: number, maxSpan: number) => void;
        setRangeAnchored?: (start: number, end: number, anchor: 'start' | 'end' | 'center') => void;
    } | null;
    currentOptions: ResolvedChartGPUOptions;
    dataStore: DataStore;
    /** Runtime raw slots (columns / ring / staging / OHLC). */
    runtimeRawDataByIndex: unknown[];
    runtimeRawBoundsByIndex: AppendFlushBounds[];
    gpuSeriesKindByIndex: DataStoreBufferKind[];
    lastSetSeriesCache: Map<number, {
        data: unknown;
        xOffset: number;
    }>;
    filterGapsCache: {
        delete: (index: number) => void;
        clear?: () => void;
    };
    /**
     * Invalidate stacked mountain prepare cache (and similar peer caches) when
     * append mutates data under stable refs / grows columns.
     */
    invalidateStackedMountainCache?: () => void;
    /** Invalidate step (digital) expand identity cache on append. */
    invalidateStepExpandCache?: () => void;
    lastSampledData: unknown[];
    warnedSamplingDefeatsFastPath: Set<number>;
    recomputeRuntimeBaseSeries: () => void;
    recomputeCachedVisibleYBoundsIfNeeded: () => void;
    ensureMutableRuntimeColumns: (seriesIndex: number, s: unknown) => unknown;
    isOwnedMutableColumns: (data: unknown) => boolean;
    brandOwnedColumns: (cols: unknown) => unknown;
    computeBaseXDomain: (options: ResolvedChartGPUOptions, bounds: unknown) => {
        min: number;
        max: number;
    };
    computeVisibleXDomain: (base: {
        min: number;
        max: number;
    }, zoom: ZoomRange | null) => {
        min: number;
        max: number;
        spanFraction: number;
    };
    isFullSpanZoomRange: (range: ZoomRange | null) => boolean;
    computeEffectiveZoomSpanConstraints: () => {
        minSpan?: number;
        maxSpan?: number;
    };
    extendBoundsWithCartesianData: (b: unknown, data: unknown) => unknown;
    extendBoundsWithOHLCDataPoints: (b: unknown, points: unknown) => unknown;
    canRangedAppendLine: (input: CanRangedAppendLineInput) => boolean;
    isGpuDecimationEligible: (series: unknown, raw: unknown) => boolean;
    normalizeMaxPoints: (maxPoints?: number | null) => number | null | undefined;
    planMaxPointsWindow: (prevLen: number, newCount: number, maxPoints?: number | null) => {
        didWindow: boolean;
        dropPrevCount: number;
        keepNewCount: number;
        newSrcOffset: number;
        isRing: boolean;
        ringCapacity: number;
        [key: string]: unknown;
    };
    getPointCount: (data: unknown) => number;
    getX: (data: unknown, i: number) => number;
    getY: (data: unknown, i: number) => number;
    getSize: (data: unknown, i: number) => number | undefined;
    createRingXYColumns: (capacity: number, withSize?: boolean) => unknown;
    appendIntoRingXY: (ring: unknown, data: unknown, newSrcOffset: number, keepNewCount: number, dropPrevCount: number) => void;
    dropPrefixXY: (x: number[], y: number[], drop: number, size?: unknown) => void;
    createStagingRingView: (...args: unknown[]) => unknown;
    isRingXYColumns: (data: unknown) => boolean;
    isStagingRingView: (data: unknown) => boolean;
    demoteStagingViewAfterRebindFailure: (raw: unknown) => unknown;
    computeRawBoundsFromCartesianData: (data: unknown) => unknown;
    runtimeBaseSeries: ResolvedChartGPUOptions['series'];
    renderSeries: ResolvedChartGPUOptions['series'];
    pendingZoomSourceKind: unknown;
}
export declare function createAppendFlush(getDeps: () => AppendFlushDeps): () => boolean;
export {};
//# sourceMappingURL=appendFlush.d.ts.map