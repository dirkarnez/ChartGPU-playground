import type { ResolvedScatterSeriesConfig } from '../config/OptionResolver';
import type { CartesianSeriesData } from '../config/types';
import type { ContinuousScale } from '../utils/scales';
import type { GridArea } from './createGridRenderer';
import type { PipelineCache } from '../core/PipelineCache';
export interface ScatterRenderer {
    prepare(seriesConfig: ResolvedScatterSeriesConfig, data: CartesianSeriesData, xScale: ContinuousScale, yScale: ContinuousScale, gridArea?: GridArea, 
    /**
     * When true (`performance.lod: 'strict'`), disable dense radius compaction
     * and honor configured marker size.
     */
    forceStandardDraw?: boolean, 
    /**
     * When false, fully-compact dense still shrinks radius but draws on the main
     * MSAA pass (preserves z-order under standard main-pass line strokes).
     * Default true. Coordinator sets false when any visible line series is present.
     */
    allowPostResolveDense?: boolean): void;
    /**
     * Drop cached instance geometry so the next `prepare` re-packs.
     * Required when values mutate under a stable data array reference
     * (update-transition interpolation — same rule as bar/area).
     */
    invalidateGeometry(): void;
    /**
     * Draw into the **main** MSAA pass. Dense-compact series with main sampleCount 4
     * are deferred ({@link isDenseDeferred}) and must be drawn with {@link renderDense}
     * into a sampleCount:1 load-pass on the resolved main texture.
     */
    render(passEncoder: GPURenderPassEncoder): void;
    /**
     * True when the last prepare selected **fully compact** denseCompact and deferred
     * draws out of the 4× MSAA main pass (group 2 ≥250k fill cliff). Main-pass
     * `render` is a no-op; draw via {@link renderDense}. Partial blends stay on main.
     */
    isDenseDeferred(): boolean;
    /**
     * Draw fully-compact dense const-radius markers into a **single-sample** pass
     * (sampleCount 1) on the resolved main color. No-op when the last prepare did
     * not defer (partial blend, sampleCount 1 main, forceStandard, or lines present).
     */
    renderDense(passEncoder: GPURenderPassEncoder): void;
    dispose(): void;
}
export interface ScatterRendererOptions {
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
export declare function createScatterRenderer(device: GPUDevice, options?: ScatterRendererOptions): ScatterRenderer;
//# sourceMappingURL=createScatterRenderer.d.ts.map