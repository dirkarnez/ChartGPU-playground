/**
 * Axis and grid utilities for the RenderCoordinator.
 *
 * These pure functions handle coordinate transformations between different spaces:
 * - CSS pixels (DOM layout)
 * - Device pixels (canvas.width/height)
 * - Normalized device coordinates / clip space (WebGPU [-1, 1])
 *
 * @module axisUtils
 */
import type { GPUContextLike } from '../../createRenderCoordinator';
import type { ResolvedChartGPUOptions } from '../../../config/OptionResolver';
import type { GridArea } from '../../../renderers/createGridRenderer';
/**
 * Computes grid area with margins and canvas dimensions for rendering layout.
 * GridArea uses:
 * - Margins (left, right, top, bottom) in CSS pixels
 * - Canvas dimensions (canvasWidth, canvasHeight) in DEVICE pixels
 * - devicePixelRatio for CSS-to-device conversion
 *
 * @param gpuContext - GPU context with canvas and device pixel ratio
 * @param options - Resolved chart options with grid margins
 * @returns GridArea object with margins, canvas dimensions, and DPR
 * @throws If canvas is null or has invalid dimensions
 */
export declare const computeGridArea: (gpuContext: GPUContextLike, options: ResolvedChartGPUOptions) => GridArea;
/**
 * Applies alpha multiplier to CSS color.
 * Parses color, multiplies alpha channel, and returns new CSS rgba() string.
 *
 * @param cssColor - CSS color string
 * @param alphaMultiplier - Alpha multiplier in range [0, 1]
 * @returns CSS rgba() string with modified alpha, or original color if parse fails
 */
export declare const withAlpha: (cssColor: string, alphaMultiplier: number) => string;
/**
 * Converts grid margins to normalized device clip coordinates for WebGPU.
 * Output is in WebGPU clip space: [-1, 1] for both x and y.
 * Y-axis is flipped (top is positive, bottom is negative).
 *
 * @param gridArea - Grid area with margins and canvas dimensions
 * @returns Clip rect with left, right, top, bottom in range [-1, 1]
 */
export declare const computePlotClipRect: (gridArea: GridArea) => {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
};
/**
 * Clamps value to [0, 1] range.
 *
 * @param v - Value to clamp
 * @returns Clamped value
 */
/** Canonical implementation lives in animationHelpers — re-exported for coordinate/UI importers. */
export { clamp01 } from '../animation/animationHelpers';
/**
 * Computes scissor rect in device pixels from grid margins.
 * Used for WebGPU scissor testing to clip rendering to plot area.
 *
 * @param gridArea - Grid area with margins and canvas dimensions
 * @returns Scissor rect with x, y, w, h in device pixels
 */
export declare const computePlotScissorDevicePx: (gridArea: GridArea) => {
    readonly x: number;
    readonly y: number;
    readonly w: number;
    readonly h: number;
};
/**
 * Converts clip-space X to canvas CSS pixels (from normalized [-1, 1]).
 *
 * @param xClip - X coordinate in clip space [-1, 1]
 * @param canvasCssWidth - Canvas width in CSS pixels
 * @returns X coordinate in canvas CSS pixels
 */
export declare const clipXToCanvasCssPx: (xClip: number, canvasCssWidth: number) => number;
/**
 * Converts clip-space Y to canvas CSS pixels (from normalized [-1, 1]).
 * Y-axis is flipped (1 is top, -1 is bottom).
 *
 * @param yClip - Y coordinate in clip space [-1, 1]
 * @param canvasCssHeight - Canvas height in CSS pixels
 * @returns Y coordinate in canvas CSS pixels
 */
export declare const clipYToCanvasCssPx: (yClip: number, canvasCssHeight: number) => number;
//# sourceMappingURL=axisUtils.d.ts.map