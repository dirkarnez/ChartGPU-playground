/**
 * Per-chart step (digital) expand cache (prepare-time stair geometry).
 *
 * Owned by the render coordinator instance — **not** process-global.
 * Identity-keyed on source data + mode + connectNulls (+ stack columns).
 *
 * **connectNulls contract:** expand always uses `connectNulls: false` in the pure
 * expander because callers pre-filter gaps. The field remains in the cache key so
 * toggles re-expand after the filtered source view changes.
 *
 * **Stable Cartesian refs:** each hit reuses the same `cartesian` / `stackedPack`
 * object so DataStore setSeries and area private-pack skip re-upload on idle frames.
 *
 * @module stepExpandCache
 * @internal
 */
import type { CartesianSeriesData } from '../../../config/types';
import { type StepMode, type StepPolyline, type StepStackedPolyline } from '../../../data/stepGeometry';
type StepExpandCacheEntry = {
    source: unknown;
    mode: StepMode;
    connectNulls: boolean;
    poly: StepPolyline;
    /** Stable XY columns view over `poly` — reuse while entry hits. */
    cartesian: CartesianSeriesData;
    stacked?: StepStackedPolyline;
    /** Stable pack view `{ x, y: yTop }` for stacked step area. */
    stackedPack?: CartesianSeriesData;
    stackYBottom?: ArrayLike<number>;
    stackYTop?: ArrayLike<number>;
};
export type StepExpandCache = {
    byIndex: Map<number, StepExpandCacheEntry>;
};
export declare function createStepExpandCache(): StepExpandCache;
export declare function invalidateStepExpandCache(cache: StepExpandCache): void;
/**
 * Expand (or reuse) step polyline for a series. Returns stable `cartesian` identity
 * while source/mode/connectNulls hit — suitable for DataStore setSeries skip.
 */
export declare function getExpandedStepPolyline(cache: StepExpandCache | undefined, seriesIndex: number, source: CartesianSeriesData, mode: StepMode, connectNulls: boolean): {
    readonly poly: StepPolyline;
    readonly cartesian: CartesianSeriesData;
};
/**
 * Expand (or reuse) stacked step geometry. Returns stable `stackedPack` identity.
 */
export declare function getExpandedStepStacked(cache: StepExpandCache | undefined, seriesIndex: number, source: CartesianSeriesData, yBottom: ArrayLike<number>, yTop: ArrayLike<number>, mode: StepMode, connectNulls: boolean): {
    readonly stacked: StepStackedPolyline;
    readonly stackedPack: CartesianSeriesData;
    readonly strokeData: CartesianSeriesData;
};
export {};
//# sourceMappingURL=stepExpandCache.d.ts.map