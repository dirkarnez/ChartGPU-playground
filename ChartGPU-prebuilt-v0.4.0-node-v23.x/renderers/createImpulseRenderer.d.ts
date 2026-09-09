/**
 * Impulse / stem series GPU renderer.
 *
 * One vertical stem per sample from baseline → y, optional center marker at (x, y).
 * Reuses errorBar.wgsl instance layout (x, y, high, low, rgba) with:
 * - high = y, low = baseline, errorMode both, vertical, connector on, whiskers off
 * - showCenter when series.showMarker
 *
 * Stem thickness in CSS px → domain X (error-bar / OHLC lesson).
 */
import type { ResolvedImpulseSeriesConfig } from '../config/OptionResolver';
import type { CartesianSeriesData } from '../config/types';
import type { ContinuousScale } from '../utils/scales';
import type { PipelineCache } from '../core/PipelineCache';
import type { GridArea } from './createGridRenderer';
export interface ImpulseRenderer {
    prepare(series: ResolvedImpulseSeriesConfig, data: CartesianSeriesData, xScale: ContinuousScale, yScale: ContinuousScale, gridArea: GridArea): void;
    /**
     * Drop cached domain-space instance geometry so the next `prepare` re-packs.
     * Required when values mutate under a stable data array reference.
     */
    invalidateGeometry(): void;
    render(passEncoder: GPURenderPassEncoder): void;
    dispose(): void;
}
export interface ImpulseRendererOptions {
    readonly targetFormat?: GPUTextureFormat;
    readonly sampleCount?: number;
    readonly pipelineCache?: PipelineCache;
}
/**
 * errorBar.wgsl drawFlags for impulse: connector on, whiskers off, vertical,
 * optional center marker (showCenter bit).
 * Exported for unit tests (must stay whisker-free).
 */
export declare function impulseDrawFlags(showMarker: boolean): number;
/**
 * Geometry dirty gate fingerprints last sample only (same class as errorBar).
 * Mid-buffer in-place mutation under a stable array reference will not re-pack
 * unless {@link ImpulseRenderer.invalidateGeometry} is called (animation path does).
 */
/**
 * Functional-first GPU impulse renderer (instanced stems + optional markers).
 */
export declare function createImpulseRenderer(device: GPUDevice, options?: ImpulseRendererOptions): ImpulseRenderer;
//# sourceMappingURL=createImpulseRenderer.d.ts.map