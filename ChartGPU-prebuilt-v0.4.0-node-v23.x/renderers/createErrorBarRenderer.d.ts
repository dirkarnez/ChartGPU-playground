import type { ResolvedErrorBarSeriesConfig } from '../config/OptionResolver';
import type { ErrorBarHlcArraysData, ErrorBarSeriesData } from '../config/types';
import type { ContinuousScale } from '../utils/scales';
import type { GridArea } from './createGridRenderer';
import type { PipelineCache } from '../core/PipelineCache';
export interface ErrorBarRenderer {
    prepare(series: ResolvedErrorBarSeriesConfig, data: ErrorBarSeriesData, xScale: ContinuousScale, yScale: ContinuousScale, gridArea: GridArea): void;
    /**
     * Drop cached domain-space instance geometry so the next `prepare` re-packs.
     * Required when values mutate under a stable data array reference.
     */
    invalidateGeometry(): void;
    render(passEncoder: GPURenderPassEncoder): void;
    dispose(): void;
}
export interface ErrorBarRendererOptions {
    readonly targetFormat?: GPUTextureFormat;
    readonly sampleCount?: number;
    readonly pipelineCache?: PipelineCache;
}
/**
 * Functional-first GPU error-bar renderer (instanced stems + caps).
 */
export declare function createErrorBarRenderer(device: GPUDevice, options?: ErrorBarRendererOptions): ErrorBarRenderer;
export type { ErrorBarHlcArraysData };
//# sourceMappingURL=createErrorBarRenderer.d.ts.map