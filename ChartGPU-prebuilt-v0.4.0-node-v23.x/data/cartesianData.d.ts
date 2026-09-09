/**
 * Internal cartesian data abstraction for CartesianSeriesData.
 *
 * Provides high-performance, allocation-minimizing primitives to support all three cartesian formats:
 * - ReadonlyArray<DataPoint> (tuple or object)
 * - XYArraysData (separate x/y/size arrays)
 * - InterleavedXYData (typed array view with [x0,y0,x1,y1,...] layout)
 *
 * DO NOT export from public entrypoint (src/index.ts). This is internal-only.
 *
 * @module cartesianData
 * @internal
 */
import type { CartesianSeriesData, DataPoint } from '../config/types';
/**
 * Bounds type for min/max x and y values.
 */
export type Bounds = Readonly<{
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
}>;
/**
 * Fixed-capacity modular ring used by FIFO streaming (`maxPoints`).
 * Chronological index `i` maps to physical `(start + i) % capacity`.
 * Internal-only — not part of the public CartesianSeriesData union, but accepted
 * at runtime by getX/getY/getPointCount so coordinator columns stay O(append).
 */
export type RingXYColumns = {
    readonly __ring: true;
    x: Float64Array;
    y: Float64Array;
    size?: Float64Array;
    start: number;
    count: number;
    capacity: number;
    /**
     * Bumped on every mutating write ({@link appendIntoRingXY}).
     * Generation-aware mono / identity caches must include this so strict full
     * replace (start/count/capacity unchanged) cannot leave stale mono=true.
     */
    contentEpoch: number;
    /**
     * Bumped only on full-clear (drop ≥ count) before rewrite. Mono FIFO
     * incremental must full-scan when this changes; partial multi-append epoch
     * jumps alone are still O(dropped) verifiable.
     */
    rewriteGen: number;
};
/**
 * Zero-copy view over DataStore modular staging (interleaved Float32 x,y with
 * `xOffset` already subtracted). Used for tooltip-off + maxPoints + GPU append
 * fast-path streaming so the coordinator does not dual-pack every append into
 * RingXYColumns.
 *
 * Chronological index `i` maps to physical `(start + i) % capacity` when
 * `capacity > 0`; otherwise staging is linear in `[0, count)`.
 *
 * **Precision contract:** staging stores `Float32(x - xOffset)` (same packing as
 * the GPU buffer). {@link getX} restores domain space as `staging[phys*2] + xOffset`,
 * so restored domain x has Float32 error vs `RingXYColumns` Float64 dual-store.
 * That is intentional for zero-copy / tooltip-off streaming; binary-search visible
 * bounds can differ slightly from the dual-column path on large time axes.
 *
 * **WeakMap identity caveat:** `createStagingRingView` reuses one object while
 * mutating `count`/`start`/`xOffset`/floats in place. Identity-keyed caches
 * (e.g. monotonic-x WeakMaps) must not assume stable content under a stable ref —
 * same class of issue as {@link RingXYColumns}. Never pass a StagingRingView as
 * the data source to `DataStore.setSeries` (setSeries linearizes ringStart /
 * capacity and desyncs this view).
 */
export type StagingRingView = {
    readonly __stagingRing: true;
    /** Interleaved packed floats: staging[phys*2]=x-xOffset, staging[phys*2+1]=y. */
    staging: Float32Array;
    start: number;
    count: number;
    /** Modular capacity in points; `0` means linear layout at the start of staging. */
    capacity: number;
    /** Added back in {@link getX} so domain / binary search use original x. */
    xOffset: number;
    /**
     * Bumped on every {@link createStagingRingView} (reuse or new). Staging floats
     * may be rewritten in place under stable start/count — mono caches must key this.
     */
    contentEpoch: number;
};
/**
 * Coordinator / raw-pipeline cartesian data: public input formats plus internal
 * modular ring columns and zero-copy DataStore staging aliases.
 */
export type CoordinatorCartesianData = CartesianSeriesData | RingXYColumns | StagingRingView;
export declare function isRingXYColumns(data: unknown): data is RingXYColumns;
export declare function isStagingRingView(data: unknown): data is StagingRingView;
/**
 * Creates or updates a staging-backed ring view (mutates `reuse` when provided
 * to avoid per-append object allocation on the high-rate FIFO path).
 *
 * Always bumps {@link StagingRingView.contentEpoch} so generation-aware mono
 * caches re-evaluate after in-place float rewrites under stable layout fields.
 *
 * When {@link StagingRingGapOpts.newBatchAllFinite} is true and the ring was
 * previously clean (or first visit), updates the gap-scan cache O(1) so
 * {@link hasNullGaps} does not full-scan multi‑M rings every append frame.
 *
 * **Contract:** `newBatchAllFinite` must mean every new point has finite **x and y**
 * (not y-only). Callers (e.g. appendFlush thin path) must scan both channels.
 * `false` marks the view gapped immediately; omit to leave cache untouched.
 */
export type StagingRingGapOpts = {
    /**
     * True when every newly written point in this append is finite in **x and y**.
     * Callers that already O(append)-scan the batch for bounds should pass this.
     */
    readonly newBatchAllFinite?: boolean;
};
export declare function createStagingRingView(staging: Float32Array, start: number, capacity: number, count: number, xOffset: number, reuse?: StagingRingView | null, gapOpts?: StagingRingGapOpts | null): StagingRingView;
/**
 * Chronological pack of a {@link StagingRingView} into a private
 * {@link RingXYColumns} (domain x via +xOffset, capacity-preserving).
 * Used when leaving the thin path (tooltip on / coordinator dual-column) so
 * subsequent maxPoints appends keep modular FIFO structure.
 */
export declare function stagingRingViewToRingXYColumns(view: StagingRingView): RingXYColumns;
/**
 * Creates a fixed-capacity ring for FIFO streaming. Physical buffers are sized
 * to `capacity`; logical length starts at 0.
 *
 * When `withSize` is true, allocates a per-point size channel. Prefer this when
 * the seed/source has per-point sizes so linear → ring promotion keeps radii.
 * `stagingRingViewToRingXYColumns` remains size-less (staging is xy only).
 */
export declare function createRingXYColumns(capacity: number, withSize?: boolean): RingXYColumns;
/**
 * Ensures `ring.size` exists (allocates a size channel filled with NaN =
 * "no size"). Used when the first sized point arrives after an unsized promote.
 */
export declare function ensureRingSizeChannel(ring: RingXYColumns): Float64Array;
/**
 * Appends points into a ring, applying the same drop/keep plan as
 * `planMaxPointsWindow`. Drop first, then write — O(keepNewCount) only.
 * Never rewrites the retained window.
 *
 * When any appended point (or the ring already) has per-point size, writes the
 * size channel (allocating if needed). Sources without size leave size[i] as
 * NaN for new slots when the channel exists (getSize treats NaN as undefined).
 */
export declare function appendIntoRingXY(ring: RingXYColumns, src: CartesianSeriesData, newSrcOffset: number, keepNewCount: number, dropPrevCount: number): void;
/**
 * Returns the number of points in the CartesianSeriesData.
 */
export declare function getPointCount(data: CoordinatorCartesianData): number;
/**
 * Returns the x-coordinate of the point at index i.
 * Returns NaN if the point is undefined, null, or non-object (for DataPoint[] format).
 * This allows callers using `Number.isFinite()` to naturally skip missing points.
 */
export declare function getX(data: CoordinatorCartesianData, i: number): number;
/**
 * Returns the y-coordinate of the point at index i.
 * Returns NaN if the point is undefined, null, or non-object (for DataPoint[] format).
 * This allows callers using `Number.isFinite()` to naturally skip missing points.
 */
export declare function getY(data: CoordinatorCartesianData, i: number): number;
/**
 * Returns the size value of the point at index i, or undefined if not available.
 * Returns undefined if the point is undefined, null, or non-object (for DataPoint[] format).
 * Note: InterleavedXYData does NOT support interleaved size (use XYArraysData.size if needed).
 */
export declare function getSize(data: CartesianSeriesData, i: number): number | undefined;
/**
 * True when any point exposes a defined per-point size (matching {@link getSize} semantics).
 *
 * Used to gate const-radius scatter packing and dense Float32 LTTB paths that would
 * otherwise drop the size channel. Scans the full series (including sparse size on
 * later points and tuple `[x,y,size]` forms). Interleaved typed arrays never carry size.
 *
 * Results are cached by data object identity (WeakMap) so axes-only / stable-ref
 * frames are O(1) after the first scan. New array refs (full rewrite harnesses)
 * still pay one O(n) scan per identity.
 */
export declare function hasAnyPerPointSize(data: CartesianSeriesData): boolean;
/**
 * Packs XY coordinates from CartesianSeriesData into a Float32Array in interleaved layout.
 *
 * Writes `pointCount` points starting at `srcPointOffset` in the source data
 * into `out` starting at `outFloatOffset` (measured in float32 elements, not bytes).
 *
 * Each point writes 2 floats: [x - xOffset, y].
 * Size dimension is NOT packed (use getSize() separately if needed).
 *
 * @param out - Target Float32Array to write into
 * @param outFloatOffset - Starting offset in `out` (in float32 elements)
 * @param src - Source CartesianSeriesData
 * @param srcPointOffset - Starting point index in source
 * @param pointCount - Number of points to pack
 * @param xOffset - Value to subtract from x coordinates (for Float32 precision preservation)
 */
export declare function packXYInto(out: Float32Array, outFloatOffset: number, src: CartesianSeriesData, srcPointOffset: number, pointCount: number, xOffset: number): void;
/**
 * Computes xMin/xMax/yMin/yMax bounds from CartesianSeriesData.
 * Skips non-finite x or y values. Returns null if no finite points found.
 * Ensures xMin !== xMax and yMin !== yMax for scale derivation (expands max by +1 if needed).
 *
 * @param data - CartesianSeriesData in any supported format
 * @returns Bounds object or null if no finite points
 */
export declare function computeRawBoundsFromCartesianData(data: CartesianSeriesData): Bounds | null;
/**
 * X-extent only (skips y). Used when all y-axis domains are explicit so full
 * rawBounds only needs data-driven xMin/xMax (index-sorted / y-axis-fixed shape).
 */
export declare function computeRawXExtentFromCartesianData(data: CartesianSeriesData): {
    readonly xMin: number;
    readonly xMax: number;
} | null;
/**
 * Returns true if cartesian data contains gap markers:
 * - `null` / non-object entries in DataPoint[] (classic null gaps)
 * - non-finite x or y in any format (NaN pairs after null→column promotion;
 *   Ring / Staging / XY / interleaved)
 *
 * Nullish / non-array non-objects return false (callers treat missing raw as
 * ineligible via {@link isGpuDecimationEligible}).
 */
export declare function hasNullGaps(data: CoordinatorCartesianData): boolean;
/**
 * Drops the oldest `dropCount` points from mutable x/y (and optional size) columns
 * in place via `copyWithin` — used by FIFO / maxPoints streaming without reallocating
 * the backing arrays when possible.
 */
export declare function dropPrefixXY(x: number[], y: number[], dropCount: number, size?: (number | undefined)[]): void;
/**
 * Removes null entries from a DataPoint array.
 * Used by connectNulls to strip gap markers before GPU upload,
 * so the line/area draws through gaps instead of breaking.
 */
export declare function filterNullGaps(data: ReadonlyArray<DataPoint | null>): ReadonlyArray<DataPoint>;
/**
 * Removes gap entries (null or NaN) from any CartesianSeriesData format.
 *
 * Null entries in DataPoint[] arrays are a direct gap marker. NaN x/y values
 * in XYArraysData and InterleavedXYData arise when cartesianDataToMutableColumns
 * converts null DataPoint entries into NaN pairs for the columnar format.
 *
 * Used by connectNulls to strip all gap markers regardless of data format,
 * so the line/area draws through gaps instead of breaking.
 *
 * Returns a DataPointTuple[] with only finite-coordinate points.
 */
export declare function filterGaps(data: CartesianSeriesData): ReadonlyArray<DataPoint>;
//# sourceMappingURL=cartesianData.d.ts.map