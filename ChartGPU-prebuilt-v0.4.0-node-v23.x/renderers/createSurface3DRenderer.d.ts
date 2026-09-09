/**
 * Uniform grid surface mesh renderer (Y-up, XZ grid) with height colormap + simple lighting.
 *
 * Steady-state path: upload height-only storage (4 B/cell); VS reconstructs position + normals.
 * Index + wire-index buffers retained when columns×rows are stable.
 */
import type { ResolvedSurface3DSeriesConfig } from '../config/OptionResolver';
import type { PipelineCache } from '../core/PipelineCache';
import type { Mat4 } from '../core/3d/mat4';
export interface Surface3DPrepareOptions {
    readonly viewProj: Mat4;
}
export interface Surface3DRenderer {
    prepare(seriesConfig: ResolvedSurface3DSeriesConfig, options: Surface3DPrepareOptions): void;
    render(passEncoder: GPURenderPassEncoder): void;
    dispose(): void;
    getUploadCount(): number;
    hasGeometry(): boolean;
}
export interface Surface3DRendererOptions {
    readonly targetFormat?: GPUTextureFormat;
    readonly sampleCount?: number;
    readonly pipelineCache?: PipelineCache;
}
export declare function createSurface3DRenderer(device: GPUDevice, options?: Surface3DRendererOptions): Surface3DRenderer;
//# sourceMappingURL=createSurface3DRenderer.d.ts.map