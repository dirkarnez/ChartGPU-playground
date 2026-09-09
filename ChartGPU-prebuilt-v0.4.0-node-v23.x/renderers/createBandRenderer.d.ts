/**
 * Band / range series renderer — GPU trapezoid fill between y and y1 curves,
 * with optional dual edge strokes via private LineRenderer instances.
 *
 * Data residency: **renderer-private** storage buffer (packed BandPoint stride-4).
 * Not GPU-decimation eligible. Zoom-only frames rewrite VS uniforms only.
 */
import type { ResolvedBandSeriesConfig } from '../config/OptionResolver';
import type { BandSeriesData } from '../config/types';
import type { ContinuousScale } from '../utils/scales';
import type { PipelineCache } from '../core/PipelineCache';
export interface BandRenderer {
    prepare(seriesConfig: ResolvedBandSeriesConfig, data: BandSeriesData, xScale: ContinuousScale, yScale: ContinuousScale, devicePixelRatio?: number, canvasWidthDevicePx?: number, canvasHeightDevicePx?: number): void;
    /**
     * Drop cached domain-space geometry so the next `prepare` re-packs vertices.
     * Required when values mutate under a stable data array reference.
     */
    invalidateGeometry(): void;
    render(passEncoder: GPURenderPassEncoder): void;
    dispose(): void;
    /** Test/instrumentation: true when the last prepare rewrote the points buffer. */
    didRewritePointsLastPrepare(): boolean;
}
export interface BandRendererOptions {
    readonly targetFormat?: GPUTextureFormat;
    readonly sampleCount?: number;
    readonly pipelineCache?: PipelineCache;
}
export declare function createBandRenderer(device: GPUDevice, options?: BandRendererOptions): BandRenderer;
//# sourceMappingURL=createBandRenderer.d.ts.map