/**
 * Pure helpers for 3D axis label placement (shared anchors for DOM + GPU paths)
 * and GPU glyph instance packing.
 */
import type { Mat4 } from './mat4';
import type { AABB } from './aabb';
import { type GlyphAtlas } from './glyphAtlas';
import type { Axes3DTickPlan } from '../../renderers/createAxisBox3DRenderer';
import type { ResolvedAxes3D } from '../../config/OptionResolver';
export type Axes3DLabelItem = Readonly<{
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly text: string;
    readonly title: boolean;
}>;
export type ResolvedAxes3DLabelMode = 'dom' | 'gpu';
/**
 * Resolve public `labelMode` to a concrete paint path.
 * - `dom` → always DOM
 * - `gpu` → GPU when atlas ready, else DOM (caller should warn on fallback)
 * - `auto` → prefer GPU when atlas init succeeded
 */
export declare function resolveAxes3DLabelMode(mode: 'auto' | 'dom' | 'gpu' | undefined, caps: Readonly<{
    readonly atlasReady: boolean;
}>): ResolvedAxes3DLabelMode;
/** Same world anchors as the P6 DOM path. */
export declare function buildAxes3DLabelItems(aabb: AABB, plan: Axes3DTickPlan, axes: ResolvedAxes3D): Axes3DLabelItem[];
/** Stable signature for camera-only skip of instance rebuild. */
export declare function axes3DLabelPlanSignature(aabb: AABB, plan: Axes3DTickPlan, axes: ResolvedAxes3D, viewportCssW: number, viewportCssH: number, tickCssPx: number, titleCssPx: number): string;
/**
 * Whether GPU label instances must be rebuilt (plan/AABB/viewport scale change).
 * Camera-only frames keep the same signature → false (uniforms-only).
 */
export declare function shouldRebuildAxes3DGpuLabelInstances(lastSignature: string, nextSignature: string, hasPrepared: boolean): boolean;
/** Exclusive paint targets for a resolved label mode (never both). */
export declare function exclusiveAxes3DLabelPaint(mode: ResolvedAxes3DLabelMode): Readonly<{
    readonly gpu: boolean;
    readonly dom: boolean;
}>;
/** One-line warn body for missing atlas glyphs (caller enforces warn-once). */
export declare function formatAxes3DMissingGlyphsWarning(missingChars: readonly string[]): string;
/** Instance stride in floats: world(3) + pxOffset(2) + halfSize(2) + uv(4) + pad(1) = 12. */
export declare const AXES3D_GPU_LABEL_INSTANCE_FLOATS = 12;
export declare const AXES3D_GPU_LABEL_INSTANCE_BYTES: number;
export type BuildAxes3DGpuLabelInstancesResult = Readonly<{
    /** Interleaved instance floats (length = instanceCount * 12). */
    readonly instances: Float32Array;
    readonly instanceCount: number;
    /** Labels that survived frustum + overlap (for tests). */
    readonly labelCount: number;
    readonly missingChars: readonly string[];
}>;
export type BuildAxes3DGpuLabelInstancesOptions = Readonly<{
    readonly atlas: GlyphAtlas;
    readonly viewProj: Mat4;
    readonly viewportCssW: number;
    readonly viewportCssH: number;
    /** Tick label CSS px height. Default 10. */
    readonly tickCssPx?: number;
    /** Title CSS px height. Default 12. */
    readonly titleCssPx?: number;
    /** Hard cap on glyph instances. Default 4096. */
    readonly maxGlyphs?: number;
    /** When true, collect missing codepoints (warn once at caller). */
    readonly trackMissing?: boolean;
}>;
/**
 * Build GPU billboard glyph instances from label items.
 * Overlap culling matches DOM heuristic (pixel distance) using current projection,
 * but is **frozen until the next plan/AABB/viewport rebuild** (camera orbit does not
 * re-cull — intentional FPS tradeoff vs DOM, which re-culls every frame).
 * Glyph pixel offsets are camera-independent so orbit can keep geometry (viewProj only).
 * No hard frustum cull — VS hides behind-camera anchors so camera-only frames stay valid.
 */
export declare function buildAxes3DGpuLabelInstances(items: readonly Axes3DLabelItem[], options: BuildAxes3DGpuLabelInstancesOptions): BuildAxes3DGpuLabelInstancesResult;
//# sourceMappingURL=axes3dLabelItems.d.ts.map