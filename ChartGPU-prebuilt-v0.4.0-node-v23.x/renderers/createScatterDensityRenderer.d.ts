import type { RawBounds, ResolvedScatterSeriesConfig } from '../config/OptionResolver';
import type { ContinuousScale } from '../utils/scales';
import type { GridArea } from './createGridRenderer';
import type { PipelineCache } from '../core/PipelineCache';
export interface ScatterDensityRenderer {
    prepare(seriesConfig: ResolvedScatterSeriesConfig, pointBuffer: GPUBuffer, pointCount: number, visibleStartIndex: number, visibleEndIndex: number, xScale: ContinuousScale, yScale: ContinuousScale, gridArea: GridArea, rawBounds?: RawBounds, 
    /**
     * DataStore content version / FNV hash for this series. Equal-N rewrites
     * keep the same buffer identity and point count; without this, binning
     * would skip recompute and leave stale heatmaps (issue 0.1).
     */
    contentVersion?: number): void;
    encodeCompute(encoder: GPUCommandEncoder): void;
    render(passEncoder: GPURenderPassEncoder): void;
    dispose(): void;
}
export interface ScatterDensityRendererOptions {
    readonly targetFormat?: GPUTextureFormat;
    /**
     * Multisample count for the render pipeline.
     *
     * Must match the render pass color attachment sampleCount.
     * Defaults to 1 (no MSAA).
     */
    readonly sampleCount?: number;
    /**
     * Optional shared cache for shader modules + render pipelines.
     */
    readonly pipelineCache?: PipelineCache;
}
export declare function createScatterDensityRenderer(device: GPUDevice, options?: ScatterDensityRendererOptions): ScatterDensityRenderer;
//# sourceMappingURL=createScatterDensityRenderer.d.ts.map