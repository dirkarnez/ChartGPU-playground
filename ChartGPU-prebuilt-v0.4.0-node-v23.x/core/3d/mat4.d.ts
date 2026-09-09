/**
 * Minimal column-major mat4 / vec3 helpers for 3D camera + projection.
 * Y-up, right-handed (WebGPU / glTF convention).
 *
 * Matrices are Float32Array length 16, column-major.
 */
export type Mat4 = Float32Array;
export type Vec3 = readonly [number, number, number];
export declare const createMat4: () => Mat4;
export declare const identityMat4: (out?: Mat4) => Mat4;
/** out = a * b (column-major multiply). */
export declare const multiplyMat4: (out: Mat4, a: Mat4, b: Mat4) => Mat4;
export declare const normalizeVec3: (v: Vec3) => Vec3;
export declare const crossVec3: (a: Vec3, b: Vec3) => Vec3;
export declare const subVec3: (a: Vec3, b: Vec3) => Vec3;
export declare const addVec3: (a: Vec3, b: Vec3) => Vec3;
export declare const scaleVec3: (v: Vec3, s: number) => Vec3;
export declare const dotVec3: (a: Vec3, b: Vec3) => number;
/**
 * lookAt view matrix: eye → target, world up.
 * Produces a right-handed view matrix (camera looks down -Z in view space).
 */
export declare const lookAt: (out: Mat4, eye: Vec3, target: Vec3, up: Vec3) => Mat4;
/**
 * Perspective projection (WebGPU clip: z in [0,1], Y-up → NDC Y up is fine with positive f).
 * fovY in radians.
 */
export declare const perspective: (out: Mat4, fovY: number, aspect: number, near: number, far: number) => Mat4;
/**
 * Orthographic projection. halfHeight is half the vertical extent in world units.
 * halfWidth = halfHeight * aspect.
 */
export declare const orthographic: (out: Mat4, halfHeight: number, aspect: number, near: number, far: number) => Mat4;
/** Transform point (x,y,z,1) by mat4 → [x,y,z,w] clip. */
export declare const transformPoint: (m: Mat4, x: number, y: number, z: number) => readonly [number, number, number, number];
/**
 * Invert a column-major mat4. Returns null if determinant is near-zero.
 * Used for CSS → world ray unprojection.
 */
export declare const invertMat4: (m: Mat4, out?: Mat4) => Mat4 | null;
//# sourceMappingURL=mat4.d.ts.map