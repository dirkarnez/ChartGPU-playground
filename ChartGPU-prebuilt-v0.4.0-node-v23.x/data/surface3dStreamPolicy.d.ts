/**
 * Pure policy helpers for surface3d stream + setOption multi-layer state.
 * Single source of truth for coordinator domain / AABB / contour decisions —
 * unit-test truth tables without spinning up WebGPU.
 */
import type { AABB } from '../core/3d/aabb';
import type { Surface3DStreamResult } from './surface3dStream';
import type { Surface3DUpdate } from '../config/types';
/**
 * Whether a full-field height walk is required to refresh colormap domain.
 * False when update carries both yMin/yMax, or series config has explicit domain.
 */
export declare function shouldWalkSurfaceDomain(opts: {
    readonly recomputeDomain: boolean;
    readonly yDomainExplicit: boolean;
}): boolean;
/**
 * Single-column spectrogram scroll may expand domain from the new strip only.
 * Skipped when series has a user-fixed colormap domain.
 */
export declare function shouldExpandStripDomain(opts: {
    readonly mode: Surface3DUpdate['mode'];
    readonly scrollX?: boolean;
    readonly columns?: number;
    readonly recomputeDomain: boolean;
    readonly yDomainExplicit: boolean;
}): boolean;
/**
 * Contour geometry invalidate on full-field replace — only when isolines are shown.
 */
export declare function shouldInvalidateSurfaceContoursOnReplaceY(opts: {
    readonly mode: Surface3DUpdate['mode'];
    readonly contoursShow: boolean;
}): boolean;
/**
 * Resolve Y extent for replaceY AABB reuse (XZ retained from prior box).
 * Prefers update-level domain, then stream domain override, then series explicit domain.
 * Returns null when Y is unknown → coordinator invalidates AABB cache (full recompute later).
 */
export declare function resolveReplaceYAABBYextent(opts: {
    readonly resultYMin?: number;
    readonly resultYMax?: number;
    readonly streamDomain: {
        readonly yMin: number;
        readonly yMax: number;
    } | null | undefined;
    readonly yDomainExplicit: boolean;
    readonly seriesYMin: number;
    readonly seriesYMax: number;
}): {
    yMin: number;
    yMax: number;
} | null;
/**
 * Build replaceY AABB by reusing prior XZ and applying resolved Y (colormap/domain framing).
 * Returns null when prev AABB or Y extent is missing → invalidate cache.
 */
export declare function reuseReplaceYAABB(prev: AABB | null | undefined, yExtent: {
    readonly yMin: number;
    readonly yMax: number;
} | null, data: unknown, y: unknown): {
    data: unknown;
    y: unknown;
    aabb: AABB;
} | null;
/**
 * Clear stream colormap domain override on setOption.
 *
 * Product rule:
 * - Always clear when user data identity changes (stream teardown).
 * - Clear when series **transitions** into explicit domain (auto→explicit), so a prior
 *   auto stream override cannot sit over the new fixed series domain.
 * - Clear when series yMin/yMax values change (user retuned the fixed domain).
 * - Do **not** clear solely because `yDomainExplicit` is already true — style-only
 *   setOption (colormap/lighting/contours, same data) must preserve intentional
 *   update-level `replaceY` domain (`setFromUpdate`).
 */
export declare function shouldClearSurfaceDomainOnSetOption(opts: {
    readonly streamCleared: boolean;
    readonly yDomainExplicit: boolean;
    readonly seriesYMin: number;
    readonly seriesYMax: number;
    /** Previous resolved series domain from last setOption; null on first seed. */
    readonly prev: {
        readonly yDomainExplicit: boolean;
        readonly yMin: number;
        readonly yMax: number;
    } | null | undefined;
}): boolean;
/**
 * High-level domain action after applySurface3DUpdate (for tests / coordinator branching).
 */
export type SurfaceDomainAction = {
    readonly kind: 'setFromUpdate';
    readonly yMin: number;
    readonly yMax: number;
} | {
    readonly kind: 'expandStrip';
} | {
    readonly kind: 'clearToSeriesExplicit';
} | {
    readonly kind: 'autoFull';
} | {
    readonly kind: 'noop';
};
export declare function resolveSurfaceDomainAction(update: Surface3DUpdate, result: Surface3DStreamResult, yDomainExplicit: boolean): SurfaceDomainAction;
//# sourceMappingURL=surface3dStreamPolicy.d.ts.map