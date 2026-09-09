/**
 * Pack and bounds for 3D point cloud series.
 *
 * Storage layout per point (16 bytes, 4 floats):
 *   [x, y, z, value]
 * value is 0 when no value channel; used for colormap.
 *
 * Non-finite XYZ are skipped for all input shapes (no NaN written to GPU).
 * Interleaved Float32Array is zero-copy; Float64Array is converted element-wise.
 */
import type { PointCloud3DData } from '../config/types';
import { type AABB } from '../core/3d/aabb';
export type PackedPointCloud3D = Readonly<{
    /** Interleaved xyzv Float32Array; capacity may exceed count * 4 (append growth). */
    readonly packed: Float32Array;
    readonly count: number;
    readonly aabb: AABB | null;
    readonly valueMin: number;
    readonly valueMax: number;
    readonly hasValue: boolean;
}>;
/** Minimum point capacity when geometric growth reallocates. */
export declare const POINT_CLOUD_GROW_MIN_CAPACITY = 16;
/** Growth factor for append reallocation. */
export declare const POINT_CLOUD_GROW_FACTOR = 1.5;
/**
 * Pack point cloud data into GPU-friendly xyzv float32.
 * Length mismatch (arrays): uses min length and may warn.
 * Interleaved: length must be a multiple of 3 (remainder truncated with warn).
 */
export declare function packPointCloud3D(data: PointCloud3DData, options?: Readonly<{
    readonly valueOverride?: ArrayLike<number>;
    readonly warn?: (msg: string) => void;
}>): PackedPointCloud3D;
/**
 * Append XYZ points into a growable packed buffer (geometric capacity).
 * Growth: min capacity {@link POINT_CLOUD_GROW_MIN_CAPACITY}, factor {@link POINT_CLOUD_GROW_FACTOR}.
 * When `maxPoints` is set, applies {@link planMaxPointsWindow} (FIFO / strict tail) via pack rewrite.
 * Returns new packed buffer + count (may reallocate).
 */
export declare function appendPackedPointCloud3D(existing: Float32Array, existingCount: number, newData: PointCloud3DData, options?: Readonly<{
    readonly valueOverride?: ArrayLike<number>;
    readonly warn?: (msg: string) => void;
    /** Peak retained points (FIFO). Same semantics as 2D `appendData(..., { maxPoints })`. */
    readonly maxPoints?: number;
}>): PackedPointCloud3D;
/**
 * Cheap drawable probe (no full pack). True if at least one finite XYZ sample is present.
 */
export declare function pointCloud3dHasDrawableSample(data: PointCloud3DData | null | undefined): boolean;
//# sourceMappingURL=pointCloud3dData.d.ts.map