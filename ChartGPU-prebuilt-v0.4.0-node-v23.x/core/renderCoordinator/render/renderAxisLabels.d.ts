/**
 * Axis Label Rendering Utilities
 *
 * Generates DOM-based axis labels and titles for cartesian charts.
 * Labels are positioned using canvas-local CSS coordinates and rendered
 * into a text overlay element.
 *
 * @module renderAxisLabels
 */
import type { ResolvedChartGPUOptions } from '../../../config/OptionResolver';
import type { AxisConfig } from '../../../config/types';
import type { ContinuousScale, LinearScale } from '../../../utils/scales';
import type { TextOverlay } from '../../../components/createTextOverlay';
/** Context for rendering X-axis labels and titles. */
interface AxisLabelRenderContext {
    readonly gpuContext: {
        readonly canvas: HTMLCanvasElement | null;
    };
    readonly currentOptions: ResolvedChartGPUOptions;
    readonly xScale: ContinuousScale | LinearScale;
    readonly xTickValues: readonly number[];
    readonly plotClipRect: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    };
    readonly visibleXRangeMs: number;
}
/** Context for rendering a single Y-axis's tick labels, title, and optional header. */
interface YAxisLabelRenderContext {
    readonly axisLabelOverlay: TextOverlay | null;
    readonly overlayContainer: HTMLElement | null;
    readonly yAxisConfig: AxisConfig;
    readonly yScale: ContinuousScale | LinearScale;
    readonly plotClipRect: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    };
    readonly canvasCssWidth: number;
    readonly canvasCssHeight: number;
    readonly offsetX: number;
    readonly offsetY: number;
    readonly theme: ResolvedChartGPUOptions['theme'];
    /** Optional precomputed tick domain values (log majors). */
    readonly yTickValues?: readonly number[];
}
/**
 * Renders X-axis tick labels, titles and clears the overlay for re-use.
 * Y-axis labels are handled separately by renderYAxisLabels().
 */
export declare function renderAxisLabels(axisLabelOverlay: TextOverlay | null, overlayContainer: HTMLElement | null, context: AxisLabelRenderContext): void;
/**
 * Renders tick labels and a title for a single Y-axis into the shared overlay.
 * Called once per Y-axis after renderAxisLabels() has cleared the overlay.
 */
export declare function renderYAxisLabels(ctx: YAxisLabelRenderContext): void;
export {};
//# sourceMappingURL=renderAxisLabels.d.ts.map