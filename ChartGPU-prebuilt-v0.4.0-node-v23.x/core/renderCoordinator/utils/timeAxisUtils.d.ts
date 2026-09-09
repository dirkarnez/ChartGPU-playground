/**
 * Time axis and formatting utilities for the RenderCoordinator.
 *
 * These pure functions handle time-based tick generation, adaptive label formatting,
 * and number/percentage parsing for pie chart configuration.
 *
 * @module timeAxisUtils
 */
import type { LinearScale } from '../../../utils/scales';
import type { PieCenter, PieRadius } from '../../../config/types';
export declare const DEFAULT_TICK_COUNT = 5;
/**
 * Resolves pie center from mixed number/string/percent format.
 * Defaults to center of plot area (50%, 50%).
 *
 * @param center - Pie center configuration or undefined
 * @param plotWidthCss - Plot area width in CSS pixels
 * @param plotHeightCss - Plot area height in CSS pixels
 * @returns Resolved center coordinates in CSS pixels
 */
export declare const resolvePieCenterPlotCss: (center: PieCenter | undefined, plotWidthCss: number, plotHeightCss: number) => {
    readonly x: number;
    readonly y: number;
};
/**
 * Resolves pie inner/outer radii with defaults, bounds checking.
 * Default outer radius is 70% of max, inner radius is 0 (full pie).
 *
 * @param radius - Pie radius configuration or undefined
 * @param maxRadiusCss - Maximum radius in CSS pixels
 * @returns Resolved inner and outer radii in CSS pixels
 */
export declare const resolvePieRadiiCss: (radius: PieRadius | undefined, maxRadiusCss: number) => {
    readonly inner: number;
    readonly outer: number;
};
/**
 * Formats millisecond timestamps with adaptive precision based on visible range.
 * Format tiers (local timezone via `Date`):
 * - &lt; 2 s: HH:mm:ss.SSS
 * - &lt; 5 min: HH:mm:ss (covers deep zoom ~2–5 min without duplicate HH:mm)
 * - &lt; 1 day: HH:mm
 * - 1–7 days: MM/DD HH:mm
 * - 1–12 weeks (up to ~3 months): MM/DD
 * - 3–12 months: MMM DD
 * - &gt; 1 year: YYYY/MM
 *
 * @param timestampMs - Timestamp in milliseconds
 * @param visibleRangeMs - Visible range width in milliseconds
 * @returns Formatted time string or null if invalid
 */
export declare const formatTimeTickValue: (timestampMs: number, visibleRangeMs: number) => string | null;
/**
 * Computes optimal tick count + values to avoid label overlap on time x-axis.
 * Uses nice time steps ({@link generateTimeTicks}) and text measurement to test
 * label widths. Tries target counts from MAX (9) down to MIN (1); when a candidate
 * set overlaps, also tries stride-2 / stride-3 subsamples of that nice set before
 * dropping further. Density control is therefore **step-wise** (ladder rung +
 * within-set subsample), not an exact linear tick count.
 *
 * @param params - Configuration object with axis, scale, canvas, and measurement settings
 * @returns Object with tickCount (actual tickValues.length) and tickValues
 */
export declare const computeAdaptiveTimeXAxisTicks: (params: {
    readonly axisMin: number | null;
    readonly axisMax: number | null;
    readonly xScale: LinearScale;
    readonly plotClipLeft: number;
    readonly plotClipRight: number;
    readonly canvasCssWidth: number;
    readonly visibleRangeMs: number;
    readonly measureCtx: CanvasRenderingContext2D | null;
    readonly measureCache?: Map<string, number>;
    readonly fontSize: number;
    readonly fontFamily: string;
    readonly tickFormatter?: (value: number) => string | null;
}) => {
    readonly tickCount: number;
    readonly tickValues: readonly number[];
};
//# sourceMappingURL=timeAxisUtils.d.ts.map