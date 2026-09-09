/**
 * 3D chart create path — isolated from the 2D ChartGPU instance body.
 * Invoked when `coordinateSystem: 'cartesian3d'`.
 */
import type { ChartGPUOptions } from './config/types';
import type { ChartGPUCreateContext, ChartGPUInstance } from './ChartGPU';
export declare function createChartGPU3D(container: HTMLElement, options: ChartGPUOptions, context: ChartGPUCreateContext | undefined, registerActive: (inst: {
    dispose(): void;
    disposed: boolean;
}) => void): Promise<ChartGPUInstance>;
//# sourceMappingURL=createChartGPU3D.d.ts.map