import type { ResolvedLineSeriesConfig } from '../config/OptionResolver';
import type { ContinuousScale } from '../utils/scales';
import type { PipelineCache } from '../core/PipelineCache';
export interface LineRenderer {
    /**
     * Prepare uniforms + bind groups for the next frame's draw.
     *
     * @param pointCountOverride - Optional explicit point count. When supplied,
     *   overrides the count derived from `seriesConfig.data`. Used by the GPU
     *   compute-decimation path where the bound `dataBuffer` holds decimated
     *   output whose length is not reflected in `seriesConfig.data`.
     */
    prepare(seriesConfig: ResolvedLineSeriesConfig, dataBuffer: GPUBuffer, xScale: ContinuousScale, yScale: ContinuousScale, xOffset?: number, devicePixelRatio?: number, canvasWidthDevicePx?: number, canvasHeightDevicePx?: number, pointCountOverride?: number, 
    /**
     * Visible line series count for multi-series hairline budget
     * ({@link resolveLineDrawPolicy} / group 1).
     */
    lineSeriesCount?: number, 
    /**
     * Modular ring layout when `dataBuffer` is DataStore raw storage after FIFO
     * wrap. Logical instance `i` maps to physical `(ringStart + i) % ringCapacity`
     * in `line.wgsl` (matches decimation). Omit or pass `ringCapacity: 0` for
     * linear / decimated chronological buffers.
     */
    ringLayout?: Readonly<{
        start: number;
        capacity: number;
    }>, 
    /**
     * Force standard AA quads (honor configured line width) when true — used by
     * `performance.lod: 'strict'`. When false/omitted, dense hairline policy applies.
     */
    forceStandardDraw?: boolean, 
    /**
     * Plot width in device pixels for dense multi-M hairline segment budget.
     * When omitted, falls back to canvas width (slightly more segments).
     * Share with area fill LOD so mountain stroke/fill stride stay aligned.
     */
    plotWidthDevicePx?: number, 
    /**
     * Optional residency / pre-sample point count for **draw policy only**
     * (dense hairline entry). Applied only when raw residency is multi‑M
     * (≥ {@link DENSE_DRAW_POINT_THRESHOLD} / 1M): GPU-decimated multi‑M FIFO
     * exits 4× MSAA AA-quad fill while draw instance count still uses
     * {@link pointCountOverride} / series data length. Mid-N residency
     * (e.g. 50k–500k raw LTTB’d to a few k buckets) is ignored so low draw N
     * keeps full AA quads + configured width.
     */
    policyPointCount?: number): void;
    /**
     * Drop identity-cached dense compact geometry so the next prepare re-packs.
     * Required when update animation mutates series values under a stable data ref
     * (same contract as area / scatter `invalidateGeometry`).
     */
    invalidateGeometry(): void;
    /**
     * Draw into the **main** MSAA pass. Dense hairline series are deferred
     * ({@link isDenseHairline}) and must be drawn with {@link renderHairline}
     * into a sampleCount:1 load-pass on the resolved main texture.
     */
    render(passEncoder: GPURenderPassEncoder): void;
    /**
     * True when the last prepare selected dense hairline (line-list @ 1 device px).
     * Main-pass `render` is a no-op for these; draw via {@link renderHairline}.
     */
    isDenseHairline(): boolean;
    /**
     * Draw dense hairline into a **single-sample** pass (sampleCount 1) on the
     * resolved main color. No-op when the last prepare was standard AA quads.
     *
     * @param options.skipSetPipeline - When true, assumes the hairline pipeline
     *   is already bound (multi-series batch: set once, then N draw calls).
     */
    renderHairline(passEncoder: GPURenderPassEncoder, options?: Readonly<{
        skipSetPipeline?: boolean;
    }>): void;
    /**
     * Bind the dense-hairline pipeline (for multi-series batching).
     * Safe to call even when this instance is not hairline this frame.
     */
    bindHairlinePipeline(passEncoder: GPURenderPassEncoder): void;
    dispose(): void;
}
export interface LineRendererOptions {
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
     * Opt-in only: if omitted, behavior is identical to the uncached path.
     */
    readonly pipelineCache?: PipelineCache;
}
/**
 * Line renderers use a **private** VS uniform buffer with dirty-skip.
 * Device-global shared VS was removed: multi-chart deferred submit made shared
 * buffers unsafe across charts on one GPUDevice.
 */
export declare function createLineRenderer(device: GPUDevice, options?: LineRendererOptions): LineRenderer;
//# sourceMappingURL=createLineRenderer.d.ts.map