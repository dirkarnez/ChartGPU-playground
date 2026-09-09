/**
 * Surface3D streaming helpers: replaceY + appendColumns (column-major strips) scroll.
 *
 * Full field layout (replaceY / stored grid): row-major y[j * columns + i]
 * appendColumns payload: column-major strips y[c * rows + r] for each new column.
 *
 * Non-finite heights are preserved as NaN (holes); match packSurface3D / pick policy.
 */
import type { Surface3DGridData, Surface3DUpdate } from '../config/types';
export type { Surface3DUpdate };
export type Surface3DStreamResult = Readonly<{
    readonly data: Surface3DGridData;
    /** True when dimensions or xStart/zStart changed (index topology may stay same if dims fixed). */
    readonly dimsChanged: boolean;
    readonly scrolled: boolean;
    /** Explicit colormap domain from replaceY; undefined → recompute auto from field. */
    readonly yMin?: number;
    readonly yMax?: number;
    /** True when domain should be recomputed from the height field. */
    readonly recomputeDomain: boolean;
}>;
/**
 * Whether `updateSurface3D` stream override should be cleared on setOption.
 *
 * Policy (single source of truth for coordinator + tests):
 * - Keep stream while user reuses the **same** `data` object identity (style-only setOption).
 * - Clear when user supplies a **new** data identity (even after scrollX changed xStart).
 * - Do not clear on first seed (`prevUser == null`).
 */
export declare function shouldClearSurfaceStream(prevUserData: Surface3DGridData | null | undefined, nextUserData: Surface3DGridData | null | undefined): boolean;
/**
 * Auto y extent from field (finite samples only). Fallback [0, 1] if empty/flat NaN.
 */
export declare function computeSurface3DDomain(y: ArrayLike<number>, length: number): {
    yMin: number;
    yMax: number;
};
export type ApplySurface3DReplaceYOptions = Readonly<{
    /**
     * Optional stream-owned scratch for the coerce/copy path (non-Float32 or short payload).
     * Reused across frames to avoid allocate-per-replaceY GC pressure.
     * Ignored on the zero-copy Float32Array path.
     */
    readonly targetY?: Float32Array;
}>;
/**
 * Apply replaceY: new full field, same grid meta.
 * Missing cells → NaN. Optional yMin/yMax pass through for colormap domain.
 *
 * **Zero-copy fast path:** when `update.y` is a `Float32Array` of length ≥ columns×rows,
 * the stream retains that buffer (or a `subarray(0, n)` view) without allocating or scanning.
 * Callers that mutate the same typed array in place each frame (then call replaceY) get
 * identity-stable heights and no extra full-field copy. Non-Float32 / short payloads still
 * coerce via `heightOrNaN` into a stream-owned buffer (`targetY` when provided).
 */
export declare function applySurface3DReplaceY(data: Surface3DGridData, update: Extract<Surface3DUpdate, {
    mode: 'replaceY';
}>, options?: ApplySurface3DReplaceYOptions): Surface3DStreamResult;
/**
 * Append columns on +X side. Payload is column-major: for each new column c, heights for r=0..rows-1
 * at y[c * rows + r]. When scrollX (default true), drop oldest `columns` columns and
 * xStart += columns * xStep so window width stays constant.
 */
export declare function applySurface3DAppendColumns(data: Surface3DGridData, update: Extract<Surface3DUpdate, {
    mode: 'appendColumns';
}>): Surface3DStreamResult;
/**
 * Append rows on +Z side. Payload is row-major block of length columns * rows_new.
 */
export declare function applySurface3DAppendRows(data: Surface3DGridData, update: Extract<Surface3DUpdate, {
    mode: 'appendRows';
}>): Surface3DStreamResult;
export declare function applySurface3DUpdate(data: Surface3DGridData, update: Surface3DUpdate, options?: ApplySurface3DReplaceYOptions): Surface3DStreamResult;
//# sourceMappingURL=surface3dStream.d.ts.map