import type { ResolvedAreaSeriesConfig } from '../config/OptionResolver';
import type { CartesianSeriesData } from '../config/types';
import type { ContinuousScale } from '../utils/scales';
import type { PipelineCache } from '../core/PipelineCache';
/**
 * Optional stacked mountain geometry: per-point floor (yBottom) and ceiling (yTop).
 * When set, AreaRenderer private-packs AreaPoint stride-4 and ignores shared storageBuffer
 * (composition baselines cannot share the line vec2 layout).
 */
export type AreaStackGeometry = Readonly<{
    /** Per-point floor in data space. Length must equal point count. */
    yBottom: ArrayLike<number>;
    /**
     * Per-point top in data space. When omitted, uses series y as top
     * (yTop = yBottom + contribution already applied by caller into data.y).
     */
    yTop?: ArrayLike<number>;
}>;
/** Optional draw-only LOD inputs for multi-M mountain fill (`performance.lod`). */
export type AreaDrawLodOptions = Readonly<{
    /** Plot width in device pixels (scissor). Drives max drawn segments. */
    readonly plotWidthDevicePx?: number;
    /**
     * When true (`performance.lod: 'strict'`), always draw full N−1 segments.
     */
    readonly forceStandardDraw?: boolean;
}>;
export interface AreaRenderer {
    prepare(seriesConfig: ResolvedAreaSeriesConfig, data: CartesianSeriesData, xScale: ContinuousScale, yScale: ContinuousScale, baseline?: number, 
    /**
     * Optional shared storage buffer (line / GPU decimation output). When set,
     * skips private pack+upload and binds this buffer (issue 1.4 step 3).
     * Ignored when `stackGeometry` is provided (stacked path always private-packs).
     */
    storageBuffer?: GPUBuffer, 
    /**
     * Point count for `storageBuffer` (required when buffer is external /
     * decimated — length is not reflected in `data`).
     */
    pointCountOverride?: number, 
    /**
     * X-origin subtracted during packing (time-axis Float32). Clip affine
     * samples near this origin: clipX = ax * x' + scale(xOffset).
     */
    xOffset?: number, 
    /**
     * Stacked mountain per-point yBottom / yTop. Forces private pack + stacked pipeline.
     */
    stackGeometry?: AreaStackGeometry, 
    /**
     * Dense fill LOD under `performance.lod: 'auto'` (draw-only; residency unchanged).
     */
    drawLod?: AreaDrawLodOptions): void;
    /**
     * Drop cached domain-space geometry so the next `prepare` re-packs vertices.
     *
     * Required when values mutate under a stable data array reference (update-transition
     * interpolation reuses one array and mutates in place — same rule as
     * `lastSetSeriesCache.clear()` in the coordinator).
     */
    invalidateGeometry(): void;
    /**
     * Draw into the **main** MSAA pass. Dense LOD fills may no-op here and draw via
     * {@link renderDense} into the post-resolve sampleCount:1 pass.
     */
    render(passEncoder: GPURenderPassEncoder): void;
    /**
     * True when the last prepare deferred dense fill out of the 4× MSAA main pass.
     */
    isDenseDeferred(): boolean;
    /**
     * Draw dense LOD fill into a **sampleCount:1** load-pass on the resolved main color.
     * No-op when the last prepare did not defer.
     */
    renderDense(passEncoder: GPURenderPassEncoder): void;
    dispose(): void;
}
export interface AreaRendererOptions {
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
export declare function createAreaRenderer(device: GPUDevice, options?: AreaRendererOptions): AreaRenderer;
//# sourceMappingURL=createAreaRenderer.d.ts.map