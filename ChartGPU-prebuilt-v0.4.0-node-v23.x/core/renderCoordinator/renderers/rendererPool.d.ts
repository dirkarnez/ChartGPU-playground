/**
 * Renderer pool management for the RenderCoordinator.
 *
 * Manages dynamic arrays of chart renderers with lazy instantiation and proper disposal.
 * Each chart type (line, area, scatter, etc.) maintains a pool of renderer instances
 * that grows/shrinks based on the number of series.
 *
 * @module rendererPool
 */
import { createAreaRenderer } from '../../../renderers/createAreaRenderer';
import { createLineRenderer } from '../../../renderers/createLineRenderer';
import { createScatterRenderer } from '../../../renderers/createScatterRenderer';
import { createScatterDensityRenderer } from '../../../renderers/createScatterDensityRenderer';
import { createPieRenderer } from '../../../renderers/createPieRenderer';
import { createHeatmapRenderer } from '../../../renderers/createHeatmapRenderer';
import { createCandlestickRenderer } from '../../../renderers/createCandlestickRenderer';
import { createOhlcRenderer } from '../../../renderers/createOhlcRenderer';
import { createBarRenderer } from '../../../renderers/createBarRenderer';
import { createBandRenderer } from '../../../renderers/createBandRenderer';
import { createErrorBarRenderer } from '../../../renderers/createErrorBarRenderer';
import { createImpulseRenderer } from '../../../renderers/createImpulseRenderer';
import { createDecimationCompute } from '../../../renderers/createDecimationCompute';
import type { PipelineCache } from '../../PipelineCache';
import type { ResolvedSeriesConfig } from '../../../config/OptionResolver';
/**
 * Configuration for renderer pool creation.
 */
interface RendererPoolConfig {
    readonly device: GPUDevice;
    readonly targetFormat: GPUTextureFormat;
    readonly pipelineCache?: PipelineCache;
    /**
     * Multisample count for all renderer pipelines.
     *
     * Must match the render pass color attachment sampleCount.
     * Defaults to 1 (no MSAA).
     */
    readonly sampleCount?: number;
}
/**
 * Renderer pool state exposed to the render coordinator.
 */
interface RendererPoolState {
    readonly areaRenderers: ReadonlyArray<ReturnType<typeof createAreaRenderer>>;
    readonly lineRenderers: ReadonlyArray<ReturnType<typeof createLineRenderer>>;
    readonly scatterRenderers: ReadonlyArray<ReturnType<typeof createScatterRenderer>>;
    readonly scatterDensityRenderers: ReadonlyArray<ReturnType<typeof createScatterDensityRenderer>>;
    readonly pieRenderers: ReadonlyArray<ReturnType<typeof createPieRenderer>>;
    readonly heatmapRenderers: ReadonlyArray<ReturnType<typeof createHeatmapRenderer>>;
    readonly candlestickRenderers: ReadonlyArray<ReturnType<typeof createCandlestickRenderer>>;
    readonly ohlcRenderers: ReadonlyArray<ReturnType<typeof createOhlcRenderer>>;
    readonly bandRenderers: ReadonlyArray<ReturnType<typeof createBandRenderer>>;
    readonly errorBarRenderers: ReadonlyArray<ReturnType<typeof createErrorBarRenderer>>;
    readonly impulseRenderers: ReadonlyArray<ReturnType<typeof createImpulseRenderer>>;
    /**
     * Per-line-series GPU decimation compute instances. Sized 1:1 with
     * `lineRenderers`. Ineligible series simply never call `.prepare()`.
     */
    readonly decimationComputes: ReadonlyArray<ReturnType<typeof createDecimationCompute>>;
    readonly barRenderer: ReturnType<typeof createBarRenderer>;
}
/**
 * Renderer pool interface returned by factory function.
 */
interface RendererPool {
    /**
     * Ensures area renderer count matches the given count.
     * Grows or shrinks the pool as needed, disposing excess renderers.
     *
     * @param count - Desired number of area renderers
     */
    ensureAreaRendererCount(count: number): void;
    /**
     * Ensures line renderer count matches the given count.
     * Grows or shrinks the pool as needed, disposing excess renderers.
     *
     * @param count - Desired number of line renderers
     */
    ensureLineRendererCount(count: number): void;
    /**
     * Ensures scatter renderer count matches the given count.
     * Grows or shrinks the pool as needed, disposing excess renderers.
     *
     * @param count - Desired number of scatter renderers
     */
    ensureScatterRendererCount(count: number): void;
    /**
     * Ensures scatter density renderer count matches the given count.
     * Grows or shrinks the pool as needed, disposing excess renderers.
     *
     * @param count - Desired number of scatter density renderers
     */
    ensureScatterDensityRendererCount(count: number): void;
    /**
     * Ensures pie renderer count matches the given count.
     * Grows or shrinks the pool as needed, disposing excess renderers.
     *
     * @param count - Desired number of pie renderers
     */
    ensurePieRendererCount(count: number): void;
    /**
     * Ensures heatmap renderer count matches the given count.
     * Grows or shrinks the pool as needed, disposing excess renderers.
     *
     * @param count - Desired number of heatmap renderers
     */
    ensureHeatmapRendererCount(count: number): void;
    /**
     * Ensures band renderer count matches the given count.
     * Grows or shrinks the pool as needed, disposing excess renderers.
     *
     * @param count - Desired number of band renderers
     */
    ensureBandRendererCount(count: number): void;
    /**
     * Ensures candlestick renderer count matches the given count.
     * Grows or shrinks the pool as needed, disposing excess renderers.
     *
     * @param count - Desired number of candlestick renderers
     */
    ensureCandlestickRendererCount(count: number): void;
    /**
     * Ensures OHLC bar renderer count matches the given count.
     */
    ensureOhlcRendererCount(count: number): void;
    /**
     * Ensures error-bar renderer count matches the given count.
     */
    ensureErrorBarRendererCount(count: number): void;
    /**
     * Ensures impulse / stem renderer count matches the given count.
     */
    ensureImpulseRendererCount(count: number): void;
    /**
     * Ensures decimation compute count matches the given count. Kept in lock-step
     * with `ensureLineRendererCount` so `decimationComputes[i]` pairs with
     * `lineRenderers[i]`.
     */
    ensureDecimationComputeCount(count: number): void;
    /**
     * Gets current renderer pool state for rendering.
     * Returns readonly arrays to prevent external mutation.
     *
     * @returns Current state with all renderer arrays
     */
    getState(): RendererPoolState;
    /**
     * Disposes all renderers in the pool.
     * Clears all arrays and destroys GPU resources.
     */
    dispose(): void;
}
/**
 * Per-type pool sizes for index-aligned renderer arrays.
 *
 * Arrays are still indexed by **series index** (not dense-by-type). When any
 * series of a type exists, that type's pool is sized to `series.length` so
 * `renderers.lineRenderers[i]` matches series i. Types that never appear get
 * size **0** — critical for group 1 pure multi-line (avoids allocating
 * area/scatter/pie/candle/decimation × N at create time).
 */
type RendererPoolNeeds = Readonly<{
    readonly seriesCount: number;
    readonly area: number;
    readonly line: number;
    readonly scatter: number;
    readonly scatterDensity: number;
    readonly pie: number;
    readonly heatmap: number;
    readonly band: number;
    readonly candlestick: number;
    readonly ohlc: number;
    readonly errorBar: number;
    readonly impulse: number;
    readonly decimation: number;
}>;
/**
 * Grow/shrink all type pools to match {@link computeRendererPoolNeeds}.
 */
export declare function ensureRendererPoolsForSeries(pool: RendererPool, series: ReadonlyArray<ResolvedSeriesConfig>): RendererPoolNeeds;
/**
 * Creates a renderer pool for dynamic renderer management.
 *
 * The renderer pool uses lazy instantiation: renderers are only created when
 * the pool grows, and are disposed when the pool shrinks. This allows the
 * render coordinator to efficiently handle varying numbers of series.
 *
 * **Architecture:**
 * - Each chart type has a dedicated renderer array
 * - Bar renderer is a singleton (not pooled)
 * - Renderers are disposed when removed from the pool
 * - Arrays are cleared to release references
 * - Prefer {@link ensureRendererPoolsForSeries} so unused types stay at size 0
 *
 * @param config - Configuration with device and target format
 * @returns Renderer pool instance
 */
export declare function createRendererPool(config: RendererPoolConfig): RendererPool;
export {};
//# sourceMappingURL=rendererPool.d.ts.map