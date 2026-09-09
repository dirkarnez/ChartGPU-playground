/**
 * Frame render ownership — GPU pass planning + series prepare/draw + encode helpers.
 *
 * Coordinator impl owns domains/tooltips/DOM labels; this module owns:
 * - pass-graph planning (order, direct resolve, texture needs)
 * - series prepare / compute encode / series draw helpers
 *
 * @module frameRender
 * @internal
 */
import { prepareSeries, hasDenseHairlineLines, hasDenseDeferredArea, hasDenseDeferredScatter, hasNonDeferredMainSeriesContent, renderDenseHairlineLines, renderDenseDeferredArea, renderDenseDeferredScatter, renderAboveSeriesAnnotations, createStackedMountainCache, invalidateStackedMountainCache, createStepExpandCache, invalidateStepExpandCache, type SeriesRenderers, type SeriesPrepareContext, type SeriesRenderContext, type LastSetSeriesCache, type SeriesPreparationResult, type AnnotationRenderers } from './renderSeries';
export { prepareSeries, hasDenseHairlineLines, hasDenseDeferredArea, hasDenseDeferredScatter, hasNonDeferredMainSeriesContent, renderDenseHairlineLines, renderDenseDeferredArea, renderDenseDeferredScatter, renderAboveSeriesAnnotations, createStackedMountainCache, invalidateStackedMountainCache, createStepExpandCache, invalidateStepExpandCache, type LastSetSeriesCache, };
/**
 * Order of optional post-resolve dense pass relative to main resolve and overlay.
 * Pass id remains `denseHairline` for backward-compatible plan consumers; the pass
 * also hosts dense-compact scatter (sampleCount:1) when deferred.
 */
type FramePassId = 'main' | 'denseHairline' | 'annotationOverlay';
/**
 * Planned GPU frame graph for one chart. Drives texture ensure + pass encoding.
 */
type GpuFramePlan = {
    readonly passOrder: readonly FramePassId[];
    /** True when a post-resolve sampleCount:1 pass runs (dense hairline and/or dense scatter). */
    readonly needsDenseHairlinePass: boolean;
    readonly useDirectSwapchainResolve: boolean;
    readonly useSwapchainAsMainView: boolean;
    readonly needResolveAndOverlay: boolean;
    readonly needMainColor: boolean;
};
/**
 * Plan the GPU pass graph from MSAA sample count and post-resolve dense eligibility
 * (dense hairline lines and/or dense-compact scatter).
 * Callers must use the returned flags for ensureTextures / beginRenderPass — not re-derive.
 */
export declare function planGpuFrame(input: {
    readonly msaaSampleCount: 1 | 4;
    readonly hasDenseHairline: boolean;
    /** Dense-compact scatter deferred out of 4× MSAA main (group 2 ≥250k). */
    readonly hasDenseScatter?: boolean;
    /** Dense mountain/area fill deferred out of 4× MSAA main (group 8 multi-M). */
    readonly hasDenseArea?: boolean;
}): GpuFramePlan;
/**
 * Encode scatter-density + line-decimation compute before the main render pass.
 * Owned here so frame GPU work is not scattered without a single entry.
 */
export declare function encodeFrameComputePasses(poolState: SeriesRenderers, seriesForRender: SeriesPrepareContext['seriesForRender'], encoder: GPUCommandEncoder): void;
/**
 * Draw series layers into the main pass (grid is caller's responsibility before this).
 */
export declare function encodeMainSeriesPass(poolState: SeriesRenderers, annotationRenderers: AnnotationRenderers, renderCtx: SeriesRenderContext, seriesPreparation: SeriesPreparationResult): void;
/**
 * True when the planned graph includes a dense-hairline pass after main resolve.
 */
export declare function framePlanIncludesDenseHairline(plan: GpuFramePlan): boolean;
/**
 * True when the planned graph uses a separate annotation overlay MSAA pass.
 */
export declare function framePlanIncludesAnnotationOverlay(plan: GpuFramePlan): boolean;
//# sourceMappingURL=frameRender.d.ts.map