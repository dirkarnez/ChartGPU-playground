/**
 * Pure stacked mountain / area composition math.
 *
 * Multi-series layers sharing a non-empty `stack` id compose fills between
 * cumulative yBottom and yTop (positive up / negative down — bar parity).
 * Never mutates caller-owned data.
 *
 * @module stackedArea
 * @internal
 */
import type { CartesianSeriesData } from '../config/types';
/**
 * Normalize a stack group id (shared semantics with bar `stack`).
 * Empty / non-string → unstacked (`''`).
 */
export declare function normalizeStackId(stack: unknown): string;
/**
 * True when a series participates in mountain/area stack composition:
 * non-empty stack id + (type area, or type line with areaStyle).
 */
export declare function isStackedMountainSeries(series: {
    readonly type?: string;
    readonly stack?: unknown;
    readonly areaStyle?: unknown;
}): boolean;
/**
 * Source series data for stack geometry / pack / hit-test.
 * `sampling === 'none'` prefers rawData (matches prepare path).
 */
export declare function selectStackedMountainSourceData(series: {
    readonly sampling?: string;
    readonly data?: CartesianSeriesData;
    readonly rawData?: CartesianSeriesData;
}): CartesianSeriesData;
/**
 * Data view used for stack baselines, pack, and hit-test.
 * When `connectNulls` is true, gaps are stripped via {@link filterGaps} so
 * composition matches the drawn fill (prepare uses the same filtered view).
 *
 * Pure equivalent of prepare's `resolveStackDataView` without a filterGaps cache.
 */
export declare function resolveStackedMountainDataView(series: {
    readonly sampling?: string;
    readonly connectNulls?: boolean;
    readonly data?: CartesianSeriesData;
    readonly rawData?: CartesianSeriesData;
}): CartesianSeriesData;
export type StackLayerSpec = Readonly<{
    seriesIndex: number;
    data: CartesianSeriesData;
}>;
export type StackLayerGeometry = Readonly<{
    seriesIndex: number;
    /** Per-point floor (baseline). Length = point count. NaN where sample invalid. */
    yBottom: Float64Array;
    /** Per-point ceiling = yBottom + contribution (pos/neg rules). */
    yTop: Float64Array;
}>;
/**
 * True when all layers share equal length and equal finite x[i] at every index
 * (or matching non-finite x). Enables O(n×layers) index-aligned stacking.
 */
export declare function canAlignStackedAreaByIndex(layers: ReadonlyArray<StackLayerSpec>): boolean;
/**
 * Compute per-layer yBottom / yTop for one stack group (series already ordered
 * bottom → top). Positive and negative contributions stack independently from 0.
 *
 * X alignment (D3): equal-x by index when possible; otherwise x-value keys with
 * missing peers contributing 0.
 */
export declare function computeStackedAreaBaselines(layers: ReadonlyArray<StackLayerSpec>): StackLayerGeometry[];
/**
 * Y extent across stacked tops/bottoms for auto domain (includes composition totals).
 */
export declare function computeStackedYExtents(geometries: ReadonlyArray<StackLayerGeometry>): {
    yMin: number;
    yMax: number;
} | null;
/**
 * Stack total at a domain x for a completed geometry set (pos tops + |neg bottoms|).
 * Uses the last layer that has a sample at x (or nearest index for equal-length peers).
 *
 * Returns `posCumulative + negCumulative` where pos is the highest pos top and
 * neg is the lowest (most negative) neg bottom at that x — i.e. net stack span origin at 0.
 * For all-positive stacks this equals the top layer's yTop.
 */
export declare function stackTotalAtX(layers: ReadonlyArray<StackLayerSpec>, geometries: ReadonlyArray<StackLayerGeometry>, xTarget: number): number | null;
/**
 * Prefer topmost layer under cursor y in domain space at the nearest sample x.
 * Returns seriesIndex + dataIndex + contribution y + stackTotal.
 */
export declare function findStackedMountainHit(args: {
    readonly layers: ReadonlyArray<StackLayerSpec>;
    readonly geometries: ReadonlyArray<StackLayerGeometry>;
    readonly xTarget: number;
    readonly yTarget: number;
    /** Max |x - xTarget| in domain units to accept a sample (caller maps from px). */
    readonly xTolerance: number;
}): {
    seriesIndex: number;
    dataIndex: number;
    contributionY: number;
    yBottom: number;
    yTop: number;
    stackTotal: number;
    x: number;
} | null;
/**
 * Group resolved mountain series by `${yAxis}\\0${stackId}` preserving array order.
 * Only series that pass {@link isStackedMountainSeries} are included.
 *
 * Default: **visible series only** (legend-hidden layers do not participate in
 * composition, bounds, or hit). Pass `includeHidden: true` only for tooling.
 */
export declare function groupStackedMountainLayers<T extends {
    readonly type?: string;
    readonly stack?: unknown;
    readonly areaStyle?: unknown;
    readonly yAxis?: string;
    readonly data?: unknown;
    readonly visible?: boolean;
}>(series: ReadonlyArray<T>, options?: Readonly<{
    includeHidden?: boolean;
}>): Map<string, Array<{
    seriesIndex: number;
    series: T;
}>>;
/**
 * Stacked composition Y extents for one axis (visible peers only by default).
 * Used by OptionResolver and runtime auto-Y so contribution-only rawBounds
 * cannot clip stacked peaks after append / stream.
 *
 * When `xWindow` is set, only samples with x in [min,max] contribute (visible zoom).
 */
export declare function computeStackedMountainYExtentsForAxis<T extends {
    readonly type?: string;
    readonly stack?: unknown;
    readonly areaStyle?: unknown;
    readonly yAxis?: string;
    readonly data?: unknown;
    readonly rawData?: unknown;
    readonly visible?: boolean;
}>(series: ReadonlyArray<T>, axisId: string, options?: Readonly<{
    includeHidden?: boolean;
    xWindow?: {
        readonly min: number;
        readonly max: number;
    } | null;
    /** Prefer rawData over data when both present (runtime seed). */
    preferRawData?: boolean;
}>): {
    yMin: number;
    yMax: number;
} | null;
//# sourceMappingURL=stackedArea.d.ts.map