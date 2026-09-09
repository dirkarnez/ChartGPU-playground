/**
 * Analytic ray–heightfield pick for uniform surface3d grids (Y-up, XZ base).
 */
import type { Mat4 } from './mat4';
export type Surface3DPickHit = Readonly<{
    readonly i: number;
    readonly j: number;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    /** Same as y under Y-up heightfield convention. */
    readonly height: number;
    /** Ray parameter t (distance along ray). */
    readonly t: number;
}>;
export type Surface3DPickGrid = Readonly<{
    readonly xStart: number;
    readonly xStep: number;
    readonly zStart: number;
    readonly zStep: number;
    readonly columns: number;
    readonly rows: number;
    /** Row-major heights y[j * columns + i]. */
    readonly y: ArrayLike<number>;
}>;
/**
 * Pick surface cell under CSS cursor via ray + heightfield walk.
 * Hit position is the ray intersection with the bilinear height patch (not cell center).
 * NaN / non-finite heights are non-pickable.
 */
export declare function pickSurface3D(grid: Surface3DPickGrid, viewProj: Mat4, cssX: number, cssY: number, viewportCssW: number, viewportCssH: number): Surface3DPickHit | null;
//# sourceMappingURL=pickSurface3d.d.ts.map