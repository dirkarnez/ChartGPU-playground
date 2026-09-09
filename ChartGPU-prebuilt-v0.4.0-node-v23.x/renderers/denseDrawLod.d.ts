/**
 * Shared draw-only LOD stride for multi-M series under `performance.lod: 'auto'`.
 *
 * Caps **drawn** consecutive-segment instances toward a plot-pixel budget while
 * GPU residency / sampling stay unchanged. Used by mountain area fill and dense
 * hairline stroke so 5M–10M axes-only redraws stay fill-rate bounded.
 *
 * @module denseDrawLod
 * @internal
 */
/**
 * Minimum max-draw-segment budget when plot width is tiny or unknown.
 * Keeps mid-N series from collapsing to a handful of segments.
 */
export declare const DENSE_DRAW_MIN_TARGET_SEGMENTS = 8192;
/**
 * Oversample factor × plot width (device px) → max drawn segments.
 * ~4 samples per device pixel is continuous for mountain fill under suite cameras;
 * multi-M group 8 still densifies well below full N under this budget.
 */
export declare const DENSE_DRAW_WIDTH_OVERSAMPLE = 4;
/**
 * Only enter multi-segment stride when raw point count is at/above this floor.
 * Protects ≤999k fidelity (product demos at 250k–500k keep full geometry).
 * At N ≥ 1M under lod:auto, series over `max(8192, 4× plotWidthDevicePx)` densify —
 * including suite multi-M protect rows (intentional display-refresh budget;
 * use lod:'strict' for full N).
 */
export declare const DENSE_DRAW_POINT_THRESHOLD = 1000000;
export type DenseDrawStrideInput = Readonly<{
    readonly pointCount: number;
    /** Plot (or canvas) width in device pixels — drives max draw segments. */
    readonly plotWidthDevicePx?: number;
    /**
     * When true (`performance.lod: 'strict'`), always stride 1 (full N geometry).
     */
    readonly forceStandard?: boolean;
    /**
     * Override max drawn segments (tests). When omitted, derived from plot width.
     */
    readonly maxDrawSegments?: number;
}>;
export type DenseDrawStrideResult = Readonly<{
    /** Index step between consecutive drawn endpoints (≥1). */
    readonly stride: number;
    /** Instance count for triangle-list / line-list segment draws. */
    readonly drawSegmentCount: number;
    /** Last valid point index (`pointCount - 1`, or 0 when empty). */
    readonly lastPointIndex: number;
    /** True when stride > 1 (dense LOD active). */
    readonly dense: boolean;
}>;
/**
 * Resolve max drawn segments from plot width (device px).
 */
export declare function resolveMaxDrawSegments(plotWidthDevicePx?: number): number;
/**
 * Resolve draw-only index stride + instance count.
 *
 * - `stride === 1`: instance `i` connects points `i → i+1` (full fidelity)
 * - `stride > 1`: instance `i` connects `min(i*stride, last) → min((i+1)*stride, last)`
 *   so the polyline still ends on the final sample
 *
 * Does **not** change uploaded buffers or sampling mode.
 */
export declare function resolveDenseDrawStride(input: DenseDrawStrideInput): DenseDrawStrideResult;
//# sourceMappingURL=denseDrawLod.d.ts.map