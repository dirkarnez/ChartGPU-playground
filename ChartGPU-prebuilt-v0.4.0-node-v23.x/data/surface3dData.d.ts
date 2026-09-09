/**
 * Uniform grid surface pack: XZ grid, height Y.
 * Mesh: two triangles per cell; positions + normals + height for colormap.
 */
import type { Surface3DGridData } from '../config/types';
import type { AABB } from '../core/3d/aabb';
export type PackedSurface3D = Readonly<{
    /** Vertex: x,y,z,nx,ny,nz,height,pad — 8 floats (32 bytes) each. */
    readonly vertices: Float32Array;
    readonly indices: Uint32Array;
    readonly vertexCount: number;
    readonly indexCount: number;
    readonly aabb: AABB | null;
    readonly yMin: number;
    readonly yMax: number;
    readonly columns: number;
    readonly rows: number;
}>;
/**
 * Sanitize grid geometry. Returns null if invalid (caller should skip draw).
 */
export declare function sanitizeSurface3DGrid(data: Surface3DGridData | null | undefined): Surface3DGridData | null;
/**
 * Cheap AABB from grid meta + heights (no normals / indices). Used for scene bounds
 * so streaming strip updates do not pay a full mesh pack twice per frame.
 */
export declare function computeSurface3DAABB(data: Surface3DGridData): AABB | null;
/**
 * Shift a previous surface AABB by one column scroll (+dx on X) and expand Y from the
 * newly appended column heights. Avoids a full height walk on the spectrogram path.
 * Y only expands (matches colormap domain policy); stale tall peaks that scrolled off
 * keep the box tall until a full recompute — acceptable for stream framing.
 */
export declare function shiftSurface3DAABBColumnScroll(prev: AABB, dx: number, newColumnY: ArrayLike<number>, rows: number): AABB;
export type PackSurface3DOptions = Readonly<{
    readonly yMin?: number;
    readonly yMax?: number;
    /** When true (dims unchanged stream path), omit index build — renderer retains prior index buffer. */
    readonly skipIndices?: boolean;
    /**
     * Optional preallocated vertex buffer (length >= columns*rows*8). Avoids per-frame
     * Float32Array alloc on high-rate strip scroll. When too small, a new buffer is allocated.
     */
    readonly targetVertices?: Float32Array;
    /** Skip AABB assembly (coordinator uses computeSurface3DAABB / stream expand). */
    readonly skipAabb?: boolean;
}>;
/**
 * Pack uniform surface mesh. Normals from central differences on the height field.
 */
export declare function packSurface3D(data: Surface3DGridData, options?: PackSurface3DOptions): PackedSurface3D | null;
/** Wireframe line-list indices (cell edges, no diagonals). */
export declare function packSurface3DWireframeIndices(columns: number, rows: number): Uint32Array;
//# sourceMappingURL=surface3dData.d.ts.map