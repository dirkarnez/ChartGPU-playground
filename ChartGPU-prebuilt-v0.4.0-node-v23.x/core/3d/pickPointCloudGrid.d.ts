/**
 * Screen-space spatial grid for exact nearest-point cloud pick at large N.
 * Rebuild on camera / data identity change; query is O(cell + neighbors).
 * Replaces stride-only approximation as the primary large-N path.
 */
import { type Mat4 } from './mat4';
import type { PointCloudPickHit } from './pickPointCloud';
export type PointCloudScreenGrid = {
    /** Flat list of data indices per cell (variable length arrays). */
    cells: Int32Array[];
    cols: number;
    rows: number;
    cellSize: number;
    viewportW: number;
    viewportH: number;
    /** Identity stamp used to detect stale grids. */
    stamp: string;
    count: number;
    packedRef: Float32Array | null;
};
export declare function createEmptyPointCloudScreenGrid(): PointCloudScreenGrid;
export declare function pointCloudScreenGridStamp(count: number, viewportW: number, viewportH: number, viewProj: Mat4, packed: Float32Array): string;
/**
 * Rebuild screen-space grid. O(N) project — call when stamp changes (camera/data), not every move.
 */
export declare function rebuildPointCloudScreenGrid(grid: PointCloudScreenGrid, packed: Float32Array, count: number, viewProj: Mat4, viewportCssW: number, viewportCssH: number, cellSizePx?: number): void;
/**
 * Exact nearest point using screen grid (falls back to full/strided scan if empty).
 */
export declare function pickNearestPointCloudWithGrid(grid: PointCloudScreenGrid, packed: Float32Array, count: number, viewProj: Mat4, cssX: number, cssY: number, viewportCssW: number, viewportCssH: number, thresholdPx?: number): PointCloudPickHit | null;
//# sourceMappingURL=pickPointCloudGrid.d.ts.map