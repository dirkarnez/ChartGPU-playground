/**
 * Series Rendering Utilities
 *
 * Prepares and renders all chart series types (area, line, bar, scatter, candlestick, pie).
 * Handles intro animations, GPU buffer management, and multi-pass rendering with proper layering.
 *
 * @module renderSeries
 */
import type { ResolvedChartGPUOptions, ResolvedSeriesConfig, ResolvedBarSeriesConfig } from '../../../config/OptionResolver';
import type { LinearScale } from '../../../utils/scales';
import type { GridArea } from '../../../renderers/createGridRenderer';
import type { LineRenderer } from '../../../renderers/createLineRenderer';
import type { AreaRenderer } from '../../../renderers/createAreaRenderer';
import type { BarRenderer } from '../../../renderers/createBarRenderer';
import type { ScatterRenderer } from '../../../renderers/createScatterRenderer';
import type { ScatterDensityRenderer } from '../../../renderers/createScatterDensityRenderer';
import type { PieRenderer } from '../../../renderers/createPieRenderer';
import type { HeatmapRenderer } from '../../../renderers/createHeatmapRenderer';
import type { CandlestickRenderer } from '../../../renderers/createCandlestickRenderer';
import type { OhlcRenderer } from '../../../renderers/createOhlcRenderer';
import type { BandRenderer } from '../../../renderers/createBandRenderer';
import type { ErrorBarRenderer } from '../../../renderers/createErrorBarRenderer';
import type { ImpulseRenderer } from '../../../renderers/createImpulseRenderer';
import type { ReferenceLineRenderer } from '../../../renderers/createReferenceLineRenderer';
import type { AnnotationMarkerRenderer } from '../../../renderers/createAnnotationMarkerRenderer';
import type { DecimationCompute } from '../../../renderers/createDecimationCompute';
import type { DataStore } from '../../../data/createDataStore';
import { type FilterGapsCache } from './filterGapsCache';
import { type StackedMountainCache } from './stackedMountainCache';
import { type StepExpandCache } from './stepExpandCache';
export { createStackedMountainCache, invalidateStackedMountainCache } from './stackedMountainCache';
export { createStepExpandCache, invalidateStepExpandCache } from './stepExpandCache';
export interface SeriesRenderers {
    readonly lineRenderers: ReadonlyArray<LineRenderer>;
    readonly areaRenderers: ReadonlyArray<AreaRenderer>;
    readonly barRenderer: BarRenderer;
    readonly scatterRenderers: ReadonlyArray<ScatterRenderer>;
    readonly scatterDensityRenderers: ReadonlyArray<ScatterDensityRenderer>;
    readonly pieRenderers: ReadonlyArray<PieRenderer>;
    readonly heatmapRenderers: ReadonlyArray<HeatmapRenderer>;
    readonly bandRenderers: ReadonlyArray<BandRenderer>;
    readonly candlestickRenderers: ReadonlyArray<CandlestickRenderer>;
    readonly ohlcRenderers: ReadonlyArray<OhlcRenderer>;
    readonly errorBarRenderers: ReadonlyArray<ErrorBarRenderer>;
    readonly impulseRenderers: ReadonlyArray<ImpulseRenderer>;
    /** 1:1 with lineRenderers; unused slots are no-ops until prepared. */
    readonly decimationComputes: ReadonlyArray<DecimationCompute>;
}
export interface AnnotationRenderers {
    referenceLineRenderer: ReferenceLineRenderer;
    referenceLineRendererMsaa: ReferenceLineRenderer;
    annotationMarkerRenderer: AnnotationMarkerRenderer;
    annotationMarkerRendererMsaa: AnnotationMarkerRenderer;
}
/**
 * Per-series cache of the last `(data ref, xOffset)` passed to `dataStore.setSeries()`.
 * When both match the previous frame, `setSeries` is skipped entirely — avoiding the
 * O(n) pack + hash that would otherwise run before the content-hash early-return.
 * (P1-2)
 */
export type LastSetSeriesCache = Map<number, Readonly<{
    data: unknown;
    xOffset: number;
}>>;
export interface SeriesPrepareContext {
    currentOptions: ResolvedChartGPUOptions;
    seriesForRender: ReadonlyArray<ResolvedSeriesConfig>;
    xScale: LinearScale;
    yScales: Map<string, LinearScale>;
    gridArea: GridArea;
    dataStore: DataStore;
    appendedGpuThisFrame: Set<number>;
    gpuSeriesKindByIndex: Array<'fullRawLine' | 'gpuDecimationRaw' | 'other' | 'unknown'>;
    zoomState: {
        getRange(): {
            start: number;
            end: number;
        } | null;
    } | null;
    visibleXDomain: {
        min: number;
        max: number;
    };
    introPhase: 'pending' | 'running' | 'done';
    introProgress01: number;
    withAlpha: (color: string, alpha: number) => string;
    maxRadiusCss: number;
    /**
     * Persistent cache of the last `setSeries()` data reference + xOffset per series index.
     * Caller owns the Map and must clear it when update animations mutate data in-place
     * under a stable array reference.
     */
    lastSetSeriesCache: LastSetSeriesCache;
    /**
     * Persistent cache of filterGaps results for connectNulls series (P2-12).
     * Caller owns the Map and must clear it with lastSetSeriesCache when data mutates
     * under a stable reference.
     */
    filterGapsCache: FilterGapsCache;
    /**
     * Per-chart stacked mountain baseline cache (not process-global).
     * Caller owns and must {@link invalidateStackedMountainCache} with lastSetSeriesCache.
     */
    stackedMountainCache: StackedMountainCache;
    /**
     * Per-chart step (digital) expand cache. Identity-keyed on source data + mode.
     * Caller should clear with lastSetSeriesCache when data mutates in place.
     */
    stepExpandCache?: StepExpandCache;
}
export interface SeriesRenderContext {
    hasCartesianSeries: boolean;
    gridArea: GridArea;
    mainPass: GPURenderPassEncoder;
    plotScissor: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    introPhase: 'pending' | 'running' | 'done';
    introProgress01: number;
    referenceLineBelowCount: number;
    markerBelowCount: number;
}
interface AboveSeriesAnnotationContext {
    hasCartesianSeries: boolean;
    gridArea: GridArea;
    overlayPass: GPURenderPassEncoder;
    plotScissor: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    /** Layer-only prepare: MSAA above render always starts at instance 0. */
    referenceLineAboveCount: number;
    markerAboveCount: number;
}
export interface SeriesPreparationResult {
    visibleSeriesForRender: ReadonlyArray<{
        series: ResolvedSeriesConfig;
        originalIndex: number;
    }>;
    barSeriesConfigs: ResolvedBarSeriesConfig[];
    visibleBarSeriesConfigs: ResolvedBarSeriesConfig[];
}
/**
 * Prepares all series renderers with current frame data.
 *
 * This loop prepares ALL series (including hidden) to maintain correct renderer indices.
 * Visibility filtering happens after preparation for rendering.
 *
 * @param renderers - Series renderer instances
 * @param context - Preparation context with scales, options, and state
 * @returns Preparation result with visibility-filtered series arrays
 */
export declare function prepareSeries(renderers: SeriesRenderers, context: SeriesPrepareContext): SeriesPreparationResult;
/**
 * Encodes scatter density compute passes before rendering.
 *
 * Must be called before beginRenderPass() for the main pass.
 *
 * @param renderers - Series renderer instances
 * @param seriesForRender - All series configurations
 * @param encoder - Command encoder for compute passes
 */
export declare function encodeScatterDensityCompute(renderers: SeriesRenderers, seriesForRender: ReadonlyArray<ResolvedSeriesConfig>, encoder: GPUCommandEncoder): void;
/**
 * Encodes GPU compute-shader decimation before rendering (P0-2).
 *
 * Batches all dirty series into a **single** compute pass (bind-group / pipeline
 * switches only). Safe to call unconditionally — each instance is dirty-gated
 * and no-ops when no eligible `prepare()` ran this frame.
 */
export declare function encodeDecimationCompute(renderers: SeriesRenderers, seriesForRender: ReadonlyArray<ResolvedSeriesConfig>, encoder: GPUCommandEncoder): void;
/**
 * Renders all series to the main render pass with proper layering.
 *
 * Render order (from back to front):
 * 1. Pies (non-cartesian, behind cartesian series)
 * 2. Annotations below series (reference lines, markers)
 * 3. Heatmaps (data-grid fill; series array order among heatmaps)
 * 4. Area fills
 * 5. Bars
 * 6. Candlesticks
 * 7. Scatter points
 * 8. Line strokes
 *
 * Heatmaps draw before strokes so overlays/lines stay readable when mixed.
 * Relative order among heatmaps follows `series[]` order.
 *
 * @param renderers - Series renderer instances
 * @param annotationRenderers - Annotation renderer instances
 * @param context - Render pass context with pass encoders and state
 */
export declare function renderSeries(renderers: SeriesRenderers, annotationRenderers: AnnotationRenderers, context: SeriesRenderContext, prepResult: SeriesPreparationResult): void;
/**
 * True when any visible line series will draw via the dense hairline path.
 * Used to open the post-resolve single-sample pass only when needed.
 */
export declare function hasDenseHairlineLines(renderers: SeriesRenderers, seriesPreparation: SeriesPreparationResult): boolean;
/**
 * True when any visible area / mountain fill deferred dense LOD out of the
 * 4× MSAA main pass (group 8 multi-M mountain fill cliff).
 */
export declare function hasDenseDeferredArea(renderers: SeriesRenderers, seriesPreparation: SeriesPreparationResult): boolean;
/**
 * True when any visible series will draw into the **main** (typically 4× MSAA) pass.
 * Used to skip main MSAA entirely when every series layer is deferred to the
 * post-resolve sampleCount:1 pass (group 8 mountain: dense fill + dense hairline).
 */
export declare function hasNonDeferredMainSeriesContent(renderers: SeriesRenderers, seriesPreparation: SeriesPreparationResult): boolean;
/**
 * True when any visible const-radius scatter series deferred denseCompact draws
 * out of the 4× MSAA main pass (group 2 ≥250k fill cliff).
 */
export declare function hasDenseDeferredScatter(renderers: SeriesRenderers, seriesPreparation: SeriesPreparationResult): boolean;
/**
 * Draw deferred dense mountain/area fills into a **sampleCount:1** pass on the
 * resolved main color (loadOp: load). Must run **before** dense hairline strokes
 * so fill stays under the stroke (main-pass z-order: area then line).
 */
export declare function renderDenseDeferredArea(renderers: SeriesRenderers, context: {
    readonly gridArea: GridArea;
    readonly densePass: GPURenderPassEncoder;
    readonly plotScissor: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    readonly introPhase: 'pending' | 'running' | 'done';
    readonly introProgress01: number;
}, seriesPreparation: SeriesPreparationResult): void;
/**
 * Draw deferred dense hairline lines into a **sampleCount:1** pass on the
 * resolved main color (loadOp: load). Avoids 4× MSAA overdraw on high-N
 * unsorted full rewrites (group 3 @ 50k DoD).
 */
export declare function renderDenseHairlineLines(renderers: SeriesRenderers, context: {
    readonly gridArea: GridArea;
    readonly hairlinePass: GPURenderPassEncoder;
    readonly plotScissor: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    readonly introPhase: 'pending' | 'running' | 'done';
    readonly introProgress01: number;
}, seriesPreparation: SeriesPreparationResult): void;
/**
 * Draw deferred dense-compact scatter into a **sampleCount:1** pass on the
 * resolved main color (loadOp: load). Avoids 4× MSAA overdraw on high-N
 * Brownian full rewrites (group 2 @ 500k hard gate).
 */
export declare function renderDenseDeferredScatter(renderers: SeriesRenderers, context: {
    readonly gridArea: GridArea;
    readonly densePass: GPURenderPassEncoder;
    readonly plotScissor: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    readonly introPhase: 'pending' | 'running' | 'done';
    readonly introProgress01: number;
}, seriesPreparation: SeriesPreparationResult): void;
/**
 * Renders above-series annotations to the MSAA overlay pass.
 *
 * Must be called during the MSAA overlay pass (after blit).
 *
 * @param annotationRenderers - Annotation renderer instances
 * @param context - Render pass context with overlay pass and state
 */
export declare function renderAboveSeriesAnnotations(annotationRenderers: AnnotationRenderers, context: AboveSeriesAnnotationContext): void;
//# sourceMappingURL=renderSeries.d.ts.map