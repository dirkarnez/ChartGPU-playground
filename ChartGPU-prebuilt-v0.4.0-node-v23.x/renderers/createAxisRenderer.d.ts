import type { AxisConfig } from '../config/types';
import type { ContinuousScale } from '../utils/scales';
import type { GridArea } from './createGridRenderer';
import type { PipelineCache } from '../core/PipelineCache';
export interface AxisRenderer {
    prepare(axisConfig: AxisConfig, scale: ContinuousScale, orientation: 'x' | 'y', gridArea: GridArea, axisLineColor?: string, axisTickColor?: string, tickCount?: number, 
    /**
     * Optional explicit tick domain values (e.g. nice time ticks).
     * When provided and non-empty, marks are placed at `scale.scale(tickValues[i])`
     * and `tickCount` is ignored in favor of `tickValues.length`.
     * When omitted, falls back to a 1–2–5 × 10ⁿ nice ladder (domain-clamped) using `tickCount` as a hint.
     */
    tickValues?: readonly number[]): void;
    render(passEncoder: GPURenderPassEncoder): void;
    dispose(): void;
}
export interface AxisRendererOptions {
    /**
     * Must match the canvas context format used for the render pass color attachment.
     * Usually this is `gpuContext.preferredFormat`.
     *
     * Defaults to `'bgra8unorm'` for backward compatibility.
     */
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
export declare function createAxisRenderer(device: GPUDevice, options?: AxisRendererOptions): AxisRenderer;
//# sourceMappingURL=createAxisRenderer.d.ts.map