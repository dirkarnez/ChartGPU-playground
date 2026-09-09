/**
 * Marching-squares isolines for uniform surface3d height fields.
 * Output: world-space line-list segments (x,y,z) with y = contour level
 * (isoline on constant height; projected onto XZ with Y = level).
 */
export type Surface3DContourSegment = Readonly<{
    readonly x0: number;
    readonly y0: number;
    readonly z0: number;
    readonly x1: number;
    readonly y1: number;
    readonly z1: number;
}>;
export type Surface3DContourInput = Readonly<{
    readonly xStart: number;
    readonly xStep: number;
    readonly zStart: number;
    readonly zStep: number;
    readonly columns: number;
    readonly rows: number;
    /** Row-major y[j * columns + i]. */
    readonly y: ArrayLike<number>;
}>;
/**
 * Resolve level set: explicit array, or N evenly spaced between yMin/yMax (exclusive of exact flat ends when equal).
 */
export declare function resolveContourLevels(levels: number | readonly number[] | undefined, yMin: number, yMax: number): number[];
/**
 * Marching squares → line segments in world space (Y = level on surface isosurface along edges).
 * Edge interpolation places vertices at true height = level on the cell edges.
 */
export declare function generateSurface3DContours(grid: Surface3DContourInput, levels: readonly number[]): Float32Array;
/** Vertex count for a contour line-list buffer (floats / 3). */
export declare function contourVertexCount(positions: Float32Array): number;
//# sourceMappingURL=surface3dContours.d.ts.map