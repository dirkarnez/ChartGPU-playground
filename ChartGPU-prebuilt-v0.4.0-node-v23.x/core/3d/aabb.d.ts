/**
 * Axis-aligned bounding box helpers for 3D series world bounds.
 */
import type { Vec3 } from './mat4';
export type AABB = Readonly<{
    readonly min: Vec3;
    readonly max: Vec3;
}>;
export declare const emptyAABB: () => {
    min: [number, number, number];
    max: [number, number, number];
};
export declare const isValidAABB: (b: AABB) => boolean;
export declare const expandAABBPoint: (b: {
    min: [number, number, number];
    max: [number, number, number];
}, x: number, y: number, z: number) => void;
export declare const expandAABB: (b: {
    min: [number, number, number];
    max: [number, number, number];
}, other: AABB) => void;
export declare const aabbCenter: (b: AABB) => Vec3;
export declare const aabbSize: (b: AABB) => Vec3;
/** Longest half-diagonal of the AABB (for camera distance fit). */
export declare const aabbHalfDiagonal: (b: AABB) => number;
/** Degenerate / empty → unit box at origin. */
export declare const sanitizeAABB: (b: AABB | null | undefined) => AABB;
//# sourceMappingURL=aabb.d.ts.map