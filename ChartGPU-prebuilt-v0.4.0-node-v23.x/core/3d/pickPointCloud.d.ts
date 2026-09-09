/**
 * Pure screen-space nearest-point pick for packed XYZV point clouds.
 * Fixed-stride subsample when count > maxFullScan (default 50_000).
 */
import { type Mat4 } from './mat4';
export type PointCloudPickHit = Readonly<{
    readonly dataIndex: number;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly value: number;
    readonly dist2: number;
}>;
export declare const DEFAULT_POINT_CLOUD_PICK_FULL_SCAN = 50000;
/**
 * Scan step for large clouds: ceil(count / maxFullScan) so roughly maxFullScan samples.
 */
export declare function pointCloudPickStep(count: number, maxFullScan?: number): number;
/**
 * Nearest packed point to (cssX, cssY) within thresholdPx (screen CSS pixels).
 * `packed` is xyzv floats; only first `count` points are considered.
 * View-projection is column-major mat4 (clip = VP * world).
 */
export declare function pickNearestPointCloud(packed: Float32Array, count: number, viewProj: Mat4, cssX: number, cssY: number, viewportCssW: number, viewportCssH: number, thresholdPx?: number, maxFullScan?: number): PointCloudPickHit | null;
//# sourceMappingURL=pickPointCloud.d.ts.map