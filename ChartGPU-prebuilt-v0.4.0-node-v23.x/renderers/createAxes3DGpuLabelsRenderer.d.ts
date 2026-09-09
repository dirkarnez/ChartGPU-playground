/**
 * WebGPU 3D axis tick numbers + titles via glyph atlas billboard quads.
 * Camera-only frames update viewProj (+ color) uniforms — no atlas rebuild.
 */
import type { Mat4 } from '../core/3d/mat4';
import type { AABB } from '../core/3d/aabb';
import { type GlyphAtlas } from '../core/3d/glyphAtlas';
import type { Axes3DTickPlan } from './createAxisBox3DRenderer';
import type { ResolvedAxes3D } from '../config/OptionResolver';
import type { PipelineCache } from '../core/PipelineCache';
import type { Rgba01 } from '../utils/colors';
export interface Axes3DGpuLabelsRenderer {
    /** True when atlas + pipeline resources are ready. */
    readonly ready: boolean;
    /**
     * Prepare labels for the current tick plan / camera.
     * Rebuilds instance buffer only when plan/AABB/names/viewport scale changes.
     */
    prepare(aabb: AABB, plan: Axes3DTickPlan, axes: ResolvedAxes3D, viewProj: Mat4, viewportCssW: number, viewportCssH: number, textColorRgba: Rgba01): void;
    render(passEncoder: GPURenderPassEncoder): void;
    dispose(): void;
    /** Test/debug: last instance count. */
    getInstanceCount(): number;
    /** Test/debug: number of instance rebuilds (not camera-only). */
    getInstanceRebuildCount(): number;
}
export interface Axes3DGpuLabelsRendererOptions {
    readonly targetFormat?: GPUTextureFormat;
    readonly sampleCount?: number;
    readonly pipelineCache?: PipelineCache;
    /** Optional pre-baked atlas (tests / shared devices). */
    readonly atlas?: GlyphAtlas | null;
    readonly tickCssPx?: number;
    readonly titleCssPx?: number;
    readonly maxGlyphs?: number;
}
/**
 * Create GPU axis label renderer. Returns `ready: false` (no-op prepare/render)
 * when atlas bake fails — caller should fall back to DOM.
 */
export declare function createAxes3DGpuLabelsRenderer(device: GPUDevice, options?: Axes3DGpuLabelsRendererOptions): Axes3DGpuLabelsRenderer;
//# sourceMappingURL=createAxes3DGpuLabelsRenderer.d.ts.map