/**
 * Project world XYZ through a view-projection matrix to CSS pixel coordinates.
 * Shared by 3D pick, axis labels, and hit-test.
 */
import { type Mat4 } from './mat4';
export type CssProjection = Readonly<{
    readonly x: number;
    readonly y: number;
    /** True when clip.w is usable and NDC is roughly in front of the camera. */
    readonly visible: boolean;
    readonly ndcX: number;
    readonly ndcY: number;
    readonly ndcZ: number;
    readonly clipW: number;
}>;
/**
 * World → CSS px (origin top-left of the canvas CSS box).
 * `visible` is false when behind camera or clip.w is degenerate.
 */
export declare function projectWorldToCss(viewProj: Mat4, worldX: number, worldY: number, worldZ: number, viewportCssW: number, viewportCssH: number): CssProjection;
/**
 * Unproject a CSS pixel to a world-space ray (origin + unit direction).
 * Uses inverse(viewProj) with NDC z = 0 (near) and z = 1 (far).
 */
export declare function unprojectCssRay(invViewProj: Mat4, cssX: number, cssY: number, viewportCssW: number, viewportCssH: number): {
    readonly origin: readonly [number, number, number];
    readonly dir: readonly [number, number, number];
} | null;
//# sourceMappingURL=projectWorldToCss.d.ts.map