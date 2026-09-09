import type { ResolvedOhlcSeriesConfig } from '../config/OptionResolver';
import type { ContinuousScale } from '../utils/scales';
import type { GridArea } from './createGridRenderer';
import type { PipelineCache } from '../core/PipelineCache';
export interface OhlcRenderer {
    prepare(series: ResolvedOhlcSeriesConfig, data: ResolvedOhlcSeriesConfig['data'], xScale: ContinuousScale, yScale: ContinuousScale, gridArea: GridArea): void;
    /**
     * Drop cached domain-space instance geometry so the next `prepare` re-packs.
     * Required when values mutate under a stable data array reference.
     */
    invalidateGeometry(): void;
    render(passEncoder: GPURenderPassEncoder): void;
    dispose(): void;
}
export interface OhlcRendererOptions {
    readonly targetFormat?: GPUTextureFormat;
    readonly sampleCount?: number;
    readonly pipelineCache?: PipelineCache;
}
export declare function createOhlcRenderer(device: GPUDevice, options?: OhlcRendererOptions): OhlcRenderer;
//# sourceMappingURL=createOhlcRenderer.d.ts.map