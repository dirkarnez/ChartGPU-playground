/**
 * Overlay Rendering Utilities
 *
 * Prepares and renders GPU-based chart overlays (grid, axes, crosshair, highlight).
 * These overlays are rendered on top of the main chart series.
 *
 * @module renderOverlays
 */
import type { ResolvedChartGPUOptions } from '../../../config/OptionResolver';
import type { ContinuousScale } from '../../../utils/scales';
import type { GridRenderer } from '../../../renderers/createGridRenderer';
import type { AxisRenderer } from '../../../renderers/createAxisRenderer';
import type { CrosshairRenderer } from '../../../renderers/createCrosshairRenderer';
import type { HighlightRenderer } from '../../../renderers/createHighlightRenderer';
import type { GridArea } from '../../../renderers/createGridRenderer';
import { type NearestPointMatch } from '../../../interaction/findNearestPoint';
import { type OverlayPrepareMemo } from './overlayPrepareMemo';
interface OverlayRenderers {
    gridRenderer: GridRenderer;
    /** Optional sampleCount-1 grid for dense-only main (skip 4× MSAA clear+resolve). */
    gridRendererSS1?: GridRenderer | null;
    xAxisRenderer: AxisRenderer;
    yAxisRenderers: Map<string, AxisRenderer>;
    crosshairRenderer: CrosshairRenderer;
    highlightRenderer: HighlightRenderer;
}
/**
 * Shared nearest-point hit result for tooltip + highlight (P0-5).
 * Computed once per hover frame in the coordinator and reused by both consumers.
 */
type SharedNearestMatch = NearestPointMatch | null;
interface OverlayPrepareContext {
    currentOptions: ResolvedChartGPUOptions;
    xScale: ContinuousScale;
    yScales: Map<string, ContinuousScale>;
    gridArea: GridArea;
    xTickCount: number;
    /**
     * Explicit x-axis tick domain values (nice time ticks, log majors, or linear).
     * When non-empty, GPU axis marks use these values so they align with DOM labels.
     */
    xTickValues?: readonly number[];
    /**
     * Optional per-axis Y tick domain values (log majors or value nice ticks).
     * Keyed by y-axis id. When omitted, log Y uses densified majors; value Y uses
     * domain-clamped 1–2–5 nice ticks (`tickCount` hint).
     */
    yTickValuesByAxis?: ReadonlyMap<string, readonly number[]>;
    hasCartesianSeries: boolean;
    effectivePointer: {
        hasPointer: boolean;
        isInGrid: boolean;
        source: 'mouse' | 'sync';
        x: number;
        y: number;
        gridX: number;
        gridY: number;
    };
    interactionScales: {
        xScale: ContinuousScale;
        yScales: Map<string, ContinuousScale>;
    } | null;
    seriesForRender: ReadonlyArray<any>;
    withAlpha: (color: string, alpha: number) => string;
    /**
     * Optional precomputed nearest-point match for the current pointer.
     * When provided (including explicit `null`), highlight skips its own
     * `findNearestPoint` call and uses this result. When omitted, falls back
     * to an independent hit-test for backward compatibility.
     */
    nearestMatch?: SharedNearestMatch | undefined;
    /**
     * Optional persistent memo (P1-6). When provided, grid/axis prepare is skipped
     * when the signature matches the previous frame. Caller owns the object.
     */
    overlayPrepareMemo?: OverlayPrepareMemo | undefined;
}
/**
 * Prepares all overlay renderers with current frame data.
 *
 * This includes grid lines, axes, crosshair, and point highlights.
 * Grid/axis prepares are memoized when `context.overlayPrepareMemo` is set (P1-6).
 *
 * @param renderers - Overlay renderer instances
 * @param context - Rendering context with scales, options, and pointer state
 */
export declare function prepareOverlays(renderers: OverlayRenderers, context: OverlayPrepareContext): void;
export {};
//# sourceMappingURL=renderOverlays.d.ts.map