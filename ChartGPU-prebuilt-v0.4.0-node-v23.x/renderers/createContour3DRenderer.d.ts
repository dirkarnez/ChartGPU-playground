/**
 * Depth-tested line-list renderer for surface3d isolines (marching-squares output).
 */
import type { Mat4 } from '../core/3d/mat4';
import type { PipelineCache } from '../core/PipelineCache';
import type { ResolvedSurface3DSeriesConfig } from '../config/OptionResolver';
export interface Contour3DRenderer {
    prepare(seriesConfig: ResolvedSurface3DSeriesConfig, viewProj: Mat4): void;
    render(passEncoder: GPURenderPassEncoder): void;
    dispose(): void;
    /** Invalidate cached contour geometry (call after surface stream / data change). */
    invalidate(): void;
}
export interface Contour3DRendererOptions {
    readonly targetFormat?: GPUTextureFormat;
    readonly sampleCount?: number;
    readonly pipelineCache?: PipelineCache;
}
export declare function createContour3DRenderer(device: GPUDevice, options?: Contour3DRendererOptions): Contour3DRenderer;
//# sourceMappingURL=createContour3DRenderer.d.ts.map