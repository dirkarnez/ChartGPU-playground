/**
 * Pure layout / hit-test / z-range helpers for uniform heatmap series.
 *
 * Cell index mapping (shared by CPU hit-test and GPU UV→texel):
 *   origin (x0,y0) = cell (0,0) min-corner after cellAnchor
 *   i = floor((x - x0) / xStep),  j = floor((y - y0) / yStep)
 * Signed steps are supported; UV u=0 always maps to column 0 (not sorted axis min).
 */
import type { HeatmapData, HeatmapNullHandling } from '../config/types';
export type HeatmapCellAnchor = 'corner' | 'center';
export type HeatmapGridBounds = Readonly<{
    readonly xMin: number;
    readonly xMax: number;
    readonly yMin: number;
    readonly yMax: number;
}>;
/** Signed grid placement for VS/FS: origin + UV * extent (extent may be negative). */
export type HeatmapGridPlacement = Readonly<{
    readonly x0: number;
    readonly y0: number;
    /** columns * xStep (signed). */
    readonly xExtent: number;
    /** rows * yStep (signed). */
    readonly yExtent: number;
    readonly columns: number;
    readonly rows: number;
    readonly xStep: number;
    readonly yStep: number;
}>;
export type HeatmapHitResult = Readonly<{
    readonly i: number;
    readonly j: number;
    readonly z: number;
    /** Cell center in data space. */
    readonly x: number;
    readonly y: number;
    /** Row-major index into z. */
    readonly dataIndex: number;
}>;
/**
 * Origin of cell (0,0) min-corner and signed extents covering the full grid.
 * UV (0,0) → origin; UV (1,1) → origin + extent. Matches GPU vsMain placement.
 */
export declare function heatmapGridPlacement(data: Pick<HeatmapData, 'xStart' | 'xStep' | 'yStart' | 'yStep' | 'columns' | 'rows'>, cellAnchor?: HeatmapCellAnchor): HeatmapGridPlacement;
/**
 * Data-space axis-aligned bounds of the heatmap grid (including cell extents).
 * Always returns min ≤ max (normalizes negative steps). Used for axis auto-domain only.
 */
export declare function heatmapGridBounds(data: Pick<HeatmapData, 'xStart' | 'xStep' | 'yStart' | 'yStep' | 'columns' | 'rows'>, cellAnchor?: HeatmapCellAnchor): HeatmapGridBounds;
/**
 * Map data-space (x, y) to integer cell indices using the same formula as GPU FS.
 * Returns null when outside [0, columns) × [0, rows).
 */
export declare function heatmapCellIndex(data: Pick<HeatmapData, 'xStart' | 'xStep' | 'yStart' | 'yStep' | 'columns' | 'rows'>, x: number, y: number, cellAnchor?: HeatmapCellAnchor): {
    readonly i: number;
    readonly j: number;
} | null;
/**
 * Map data-space (x, y) to a cell. Returns null when outside the grid.
 * Half-open cell intervals along the step direction (signed steps supported).
 */
export declare function heatmapHitTest(data: HeatmapData, x: number, y: number, cellAnchor?: HeatmapCellAnchor): HeatmapHitResult | null;
/**
 * Scan finite z values for min/max. Empty/all-nonfinite → { zMin: 0, zMax: 1 }.
 * When `zScale === 'log'`, only positive finite values are considered.
 */
export declare function computeHeatmapZExtent(z: Float32Array | ReadonlyArray<number>, length: number, zScale?: 'linear' | 'log'): {
    readonly zMin: number;
    readonly zMax: number;
};
/**
 * Normalize a single z sample to t ∈ [0, 1]. Non-finite / invalid log → NaN
 * (caller applies nullHandling).
 */
export declare function normalizeZ(z: number, zMin: number, zMax: number, zScale?: 'linear' | 'log'): number;
/**
 * Map a non-finite or out-of-policy z sample through nullHandling.
 * Returns t ∈ [0,1] or null when transparent (skip draw / alpha 0).
 */
export declare function applyNullHandling(t: number, nullHandling: HeatmapNullHandling): number | null;
/**
 * Position-sensitive content stamp for equal-size z dirty detection
 * (O(n), only on setOption identity change).
 *
 * Uses FNV-1a over IEEE-754 bit patterns of each sample mixed with index so
 * cell swaps, column ring-shifts, and sub-quantum float edits change the stamp.
 * Order-blind sum/xor is intentionally avoided.
 */
export declare function heatmapZContentStamp(z: Float32Array | ReadonlyArray<number>, length: number): number;
/**
 * Validate heatmap dimensions and steps. Returns a sanitized snapshot or null
 * when the series should be skipped (invalid geometry).
 */
export declare function sanitizeHeatmapGeometry(data: HeatmapData | null | undefined): {
    readonly columns: number;
    readonly rows: number;
    readonly xStart: number;
    readonly xStep: number;
    readonly yStart: number;
    readonly yStep: number;
    readonly zLength: number;
    readonly drawCells: number;
} | null;
//# sourceMappingURL=heatmapLayout.d.ts.map