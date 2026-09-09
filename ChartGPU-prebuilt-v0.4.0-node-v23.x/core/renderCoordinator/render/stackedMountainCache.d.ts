/**
 * Per-chart stacked mountain geometry cache (prepare-time baselines).
 *
 * Owned by the render coordinator instance — **not** process-global — so
 * multi-chart dashboards do not share stale peer baselines.
 *
 * Cache key includes data ref, point count, stack id, yAxis, membership,
 * connectNulls, and visibility so setOption regroup / append growth / legend
 * toggle recompute correctly. Call {@link invalidateStackedMountainCache} on
 * every site that clears `lastSetSeriesCache` and after append flush.
 *
 * @module stackedMountainCache
 * @internal
 */
import type { ResolvedSeriesConfig } from '../../../config/OptionResolver';
import type { CartesianSeriesData } from '../../../config/types';
import { type StackLayerGeometry } from '../../../data/stackedArea';
type StackGeomEntry = StackLayerGeometry & {
    /** Owned stroke columns with y = yTop (line draws at layer ceiling). */
    strokeData: CartesianSeriesData;
    /** Data view used for geometry (may be filterGaps output when connectNulls). */
    packData: CartesianSeriesData;
};
type StackedMountainGeometryMap = Map<number, StackGeomEntry>;
export type StackedMountainCache = {
    /** Fingerprint of last successful build. */
    fingerprint: string | null;
    byIndex: StackedMountainGeometryMap | null;
    /**
     * Persistent object→ordinal map so data ref identity is stable across builds
     * (recreating a per-build WeakMap would re-number objects in index order and
     * miss peer data swaps).
     */
    refIds: WeakMap<object, number>;
    nextRefId: number;
};
export declare function createStackedMountainCache(): StackedMountainCache;
export declare function invalidateStackedMountainCache(cache: StackedMountainCache): void;
/**
 * Build (or reuse) stack geometries for all **visible** stacked mountain groups.
 */
export declare function getStackedMountainGeometryMap(seriesForRender: ReadonlyArray<ResolvedSeriesConfig>, cache: StackedMountainCache, filterGaps: (seriesIndex: number, data: CartesianSeriesData) => CartesianSeriesData): StackedMountainGeometryMap;
export {};
//# sourceMappingURL=stackedMountainCache.d.ts.map