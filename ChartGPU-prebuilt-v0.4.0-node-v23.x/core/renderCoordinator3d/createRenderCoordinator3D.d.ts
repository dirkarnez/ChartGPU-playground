/**
 * 3D render coordinator — separate from the 2D RenderCoordinator.
 * Frame graph: clear color+depth → surface meshes → contours → point clouds → axes (box/grid/ticks) → GPU labels.
 * sampleCount 1 (depth path; MSAA deferred).
 *
 * Labeled axes: GPU box/grid/ticks; tick numbers/titles via GPU atlas (`labelMode: 'gpu'|'auto'`) or DOM (`'dom'`).
 */
import type { ResolvedChartGPUOptions } from '../../config/OptionResolver';
import type { PointCloud3DData, Surface3DUpdate } from '../../config/types';
import { GPUContext } from '../GPUContext';
import type { PipelineCache } from '../PipelineCache';
import { type ResolvedCamera } from '../3d/camera';
export type RenderCoordinator3DCallbacks = Readonly<{
    readonly onRequestRender?: () => void;
    readonly pipelineCache?: PipelineCache;
    /** Fire click / mouseover / mouseout with pick payload (createChartGPU3D wires listeners). */
    readonly onPickEvent?: (name: 'click' | 'mouseover' | 'mouseout', payload: Chart3DPickResult | null) => void;
}>;
export type PointCloudPickResult = Readonly<{
    readonly kind: 'pointCloud3d';
    readonly seriesIndex: number;
    readonly dataIndex: number;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly value: number;
    readonly seriesName: string | null;
    readonly color: string;
    readonly screenDistancePx: number;
}>;
export type SurfacePickResult = Readonly<{
    readonly kind: 'surface3d';
    readonly seriesIndex: number;
    readonly i: number;
    readonly j: number;
    readonly dataIndex: number;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly height: number;
    readonly seriesName: string | null;
    readonly color: string;
}>;
export type Chart3DPickResult = PointCloudPickResult | SurfacePickResult;
export type AppendPointCloudResult = Readonly<{
    readonly appended: number;
    readonly totalCount: number;
    readonly xExtent: {
        readonly min: number;
        readonly max: number;
    };
}>;
export interface RenderCoordinator3D {
    setOptions(resolved: ResolvedChartGPUOptions): void;
    render(): void;
    dispose(): void;
    resetCamera(): void;
    setCamera(partial: import('../../config/types').Chart3DCameraOptions): void;
    getCamera(): ResolvedCamera;
    /** Nearest pick (surface or point cloud) in screen space (CSS px). */
    pick(cssX: number, cssY: number, thresholdPx?: number): Chart3DPickResult | null;
    /**
     * Append points to a resolved-index pointCloud3d series.
     * Durable across setOption when that series' `data` identity is unchanged.
     * `maxPoints` applies FIFO window via pack rewrite.
     */
    appendPointCloudData(seriesIndex: number, newPoints: PointCloud3DData, opts?: {
        readonly maxPoints?: number;
    }): AppendPointCloudResult | null;
    /** Streaming / partial surface update (replaceY, appendColumns, appendRows). */
    updateSurface3D(seriesIndex: number, update: Surface3DUpdate): boolean;
    /** Test/debug: packed point count for series (includes appends). */
    getPointCloudCount(seriesIndex: number): number;
    getCanvas(): HTMLCanvasElement | null;
}
export declare function createRenderCoordinator3D(gpuContext: GPUContext, initialOptions: ResolvedChartGPUOptions, callbacks?: RenderCoordinator3DCallbacks): RenderCoordinator3D;
//# sourceMappingURL=createRenderCoordinator3D.d.ts.map