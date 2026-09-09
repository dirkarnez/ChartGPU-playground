/**
 * 3D point cloud billboard renderer (WebGPU, depth-enabled).
 * Storage buffer of xyzv; draw(6, N) camera-facing quads.
 */
import type { ResolvedPointCloud3DSeriesConfig } from '../config/OptionResolver';
import type { PipelineCache } from '../core/PipelineCache';
import { type PackedPointCloud3D } from '../data/pointCloud3dData';
import type { Mat4 } from '../core/3d/mat4';
export interface PointCloud3DPrepareOptions {
    readonly viewProj: Mat4;
    /** CSS viewport width/height. */
    readonly viewportCssW: number;
    readonly viewportCssH: number;
    readonly opacityOverride?: number;
}
export interface PointCloud3DRenderer {
    prepare(seriesConfig: ResolvedPointCloud3DSeriesConfig, options: PointCloud3DPrepareOptions): void;
    /**
     * Replace packed data without full series resolve (append path).
     * Pass same series config for style; packed buffer is authoritative for geometry.
     */
    preparePacked(seriesConfig: ResolvedPointCloud3DSeriesConfig, packed: PackedPointCloud3D, options: PointCloud3DPrepareOptions): void;
    render(passEncoder: GPURenderPassEncoder): void;
    dispose(): void;
    getPointCount(): number;
    getUploadCount(): number;
    /** CPU-side packed xyzv for picking (may be a subarray). */
    getPackedForPick(): Float32Array | null;
}
export interface PointCloud3DRendererOptions {
    readonly targetFormat?: GPUTextureFormat;
    readonly sampleCount?: number;
    readonly pipelineCache?: PipelineCache;
}
export declare function createPointCloud3DRenderer(device: GPUDevice, options?: PointCloud3DRendererOptions): PointCloud3DRenderer;
//# sourceMappingURL=createPointCloud3DRenderer.d.ts.map