/**
 * 3D axes: AABB edge box + wall/floor grids + tick marks (line-list GPU).
 * Numeric labels / titles: GPU atlas or DOM (see createAxes3DGpuLabelsRenderer / axes3dLabels).
 */
import type { AABB } from '../core/3d/aabb';
import type { Mat4 } from '../core/3d/mat4';
import type { PipelineCache } from '../core/PipelineCache';
import type { ResolvedAxes3D } from '../config/OptionResolver';
export type Axes3DTickPlan = Readonly<{
    readonly xTicks: readonly number[];
    readonly yTicks: readonly number[];
    readonly zTicks: readonly number[];
    readonly xDomain: Readonly<{
        min: number;
        max: number;
    }>;
    readonly yDomain: Readonly<{
        min: number;
        max: number;
    }>;
    readonly zDomain: Readonly<{
        min: number;
        max: number;
    }>;
}>;
export interface AxisBox3DRenderer {
    /**
     * Prepare box / grid / ticks for the scene AABB and axes options.
     * Returns the tick plan used for GPU/DOM axis labels.
     */
    prepare(aabb: AABB, viewProj: Mat4, colorRgba: readonly [number, number, number, number], axes: ResolvedAxes3D, gridColorRgba?: readonly [number, number, number, number]): Axes3DTickPlan;
    render(passEncoder: GPURenderPassEncoder): void;
    dispose(): void;
}
export interface AxisBox3DRendererOptions {
    readonly targetFormat?: GPUTextureFormat;
    readonly sampleCount?: number;
    readonly pipelineCache?: PipelineCache;
}
/** Build line-list positions (xyz float triples) for box + optional grid + ticks. */
export declare function buildAxes3DLines(aabb: AABB, axes: ResolvedAxes3D, plan: Axes3DTickPlan): Float32Array;
export declare function planAxes3DTicks(aabb: AABB, axes: ResolvedAxes3D): Axes3DTickPlan;
export declare function createAxisBox3DRenderer(device: GPUDevice, options?: AxisBox3DRendererOptions): AxisBox3DRenderer;
//# sourceMappingURL=createAxisBox3DRenderer.d.ts.map