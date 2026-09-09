/**
 * 3D camera state: perspective / orthographic, orbit controls, fit-to-AABB.
 * Y-up, right-handed.
 */
import type { Chart3DCameraOptions } from '../../config/types';
import { type Mat4, type Vec3 } from './mat4';
import { type AABB } from './aabb';
export type CameraProjectionType = 'perspective' | 'orthographic';
export type ResolvedCamera = Readonly<{
    readonly type: CameraProjectionType;
    readonly fovY: number;
    readonly near: number;
    readonly far: number;
    readonly eye: Vec3;
    readonly target: Vec3;
    readonly up: Vec3;
    readonly orthoSize: number;
}>;
export type OrbitCameraState = {
    type: CameraProjectionType;
    fovY: number;
    near: number;
    far: number;
    /** Orbit target (look-at). */
    target: [number, number, number];
    /** Spherical: yaw around Y, pitch from XZ plane, distance from target. */
    yaw: number;
    pitch: number;
    distance: number;
    orthoSize: number;
    up: [number, number, number];
    /** When true, next fit uses data AABB unless user set explicit eye/target. */
    needsFit: boolean;
    /** User locked explicit eye/target (skip auto-fit until reset). */
    userLocked: boolean;
};
export declare const createDefaultOrbitCameraState: () => OrbitCameraState;
export declare const eyeFromOrbit: (state: OrbitCameraState) => Vec3;
export declare const toResolvedCamera: (state: OrbitCameraState) => ResolvedCamera;
/**
 * Apply partial camera options onto orbit state.
 * Explicit eye+target sets spherical from those vectors.
 */
export declare const applyCameraOptions: (state: OrbitCameraState, opts: Chart3DCameraOptions | undefined) => void;
/** Fit orbit camera to AABB (sphere-fit). */
export declare const fitCameraToAABB: (state: OrbitCameraState, aabbIn: AABB | null | undefined) => void;
export declare const orbitByPixels: (state: OrbitCameraState, dx: number, dy: number, speed: number) => void;
export declare const panByPixels: (state: OrbitCameraState, dx: number, dy: number, viewportHeightPx: number, speed: number) => void;
export declare const zoomByWheel: (state: OrbitCameraState, deltaY: number, speed: number) => void;
/** Build viewProj matrix (column-major Float32Array 16). */
export declare const buildViewProj: (state: OrbitCameraState, aspect: number, out?: Mat4) => Mat4;
//# sourceMappingURL=camera.d.ts.map