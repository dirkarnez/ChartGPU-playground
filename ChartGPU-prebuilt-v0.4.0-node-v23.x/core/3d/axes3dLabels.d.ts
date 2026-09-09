/**
 * DOM-projected 3D axis tick labels + titles (`labelMode: 'dom'`, and fallback).
 * Host must be (or becomes) `position: relative|absolute|fixed` so absolute labels lay out correctly.
 * If we set `relative` on a previously static host, dispose restores the prior inline position.
 * GPU path: see createAxes3DGpuLabelsRenderer — exclusive with this overlay.
 */
import type { Mat4 } from './mat4';
import type { AABB } from './aabb';
import type { Axes3DTickPlan } from '../../renderers/createAxisBox3DRenderer';
import type { ResolvedAxes3D } from '../../config/OptionResolver';
export interface Axes3DLabels {
    update(host: HTMLElement, aabb: AABB, plan: Axes3DTickPlan, axes: ResolvedAxes3D, viewProj: Mat4, viewportCssW: number, viewportCssH: number, textColor: string): void;
    clear(): void;
    dispose(): void;
}
export declare function createAxes3DLabels(): Axes3DLabels;
//# sourceMappingURL=axes3dLabels.d.ts.map