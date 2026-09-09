/**
 * Heatmap streaming helpers: replaceZ + appendColumns (column-major strips) + appendRows.
 *
 * Full field layout (replaceZ / stored grid): row-major z[j * columns + i]
 * appendColumns payload: column-major strips z[c * rows + r] for each new column.
 * appendRows payload: row-major blocks z[r * columns + i].
 *
 * Non-finite values are preserved as NaN (holes); match packZTextureData / hit-test policy.
 * Never mutates caller-owned z arrays — always allocates a fresh Float32Array for owned field.
 */
import type { HeatmapData, HeatmapUpdate } from '../config/types';
export type { HeatmapUpdate };
export type HeatmapStreamResult = Readonly<{
    readonly data: HeatmapData;
    /** True when dimensions changed (grow path). */
    readonly dimsChanged: boolean;
    readonly scrolled: boolean;
    /** Explicit colormap domain from replaceZ; undefined → recompute/expand. */
    readonly zMin?: number;
    readonly zMax?: number;
    /** True when domain should be recomputed from the full field. */
    readonly recomputeDomain: boolean;
    /**
     * GPU modular ring: advance oldest-column index by this many columns after a
     * scrollX append that preserves dimensions (0 when full re-upload needed).
     * Single-column spectrogram scroll → 1; multi-column batch → 0 (full upload).
     */
    readonly ringAdvanceCols: number;
}>;
/**
 * Whether `updateHeatmap` stream override should be cleared on setOption.
 *
 * Policy (single source of truth for coordinator + tests):
 * - Keep stream while user reuses the **same** `data` object identity (style-only setOption).
 * - Clear when user supplies a **new** data identity (even after scrollX changed xStart).
 * - Do not clear on first seed (`prevUser == null`).
 */
export declare function shouldClearHeatmapStream(prevUserData: HeatmapData | null | undefined, nextUserData: HeatmapData | null | undefined): boolean;
/** @internal Test helper: reset short-payload warn gate. */
export declare function __resetHeatmapStreamWarnForTests(): void;
/**
 * Auto z extent from field (finite samples only). Fallback [0, 1] if empty/flat NaN.
 */
export declare function computeHeatmapStreamDomain(z: ArrayLike<number>, length: number): {
    zMin: number;
    zMax: number;
};
/**
 * Apply replaceZ: new full field, same grid meta.
 * Missing cells → NaN. Optional zMin/zMax pass through for colormap domain.
 */
export declare function applyHeatmapReplaceZ(data: HeatmapData, update: Extract<HeatmapUpdate, {
    mode: 'replaceZ';
}>): HeatmapStreamResult;
/**
 * Append columns on +X side. Payload is column-major: for each new column c, values for r=0..rows-1
 * at z[c * rows + r]. When scrollX (default true), drop oldest columns and
 * xStart += drop * xStep so window width stays constant.
 */
export declare function applyHeatmapAppendColumns(data: HeatmapData, update: Extract<HeatmapUpdate, {
    mode: 'appendColumns';
}>): HeatmapStreamResult;
/**
 * Append rows on +Y side. Payload is row-major block of length columns * rows_new.
 */
export declare function applyHeatmapAppendRows(data: HeatmapData, update: Extract<HeatmapUpdate, {
    mode: 'appendRows';
}>): HeatmapStreamResult;
export declare function applyHeatmapUpdate(data: HeatmapData, update: HeatmapUpdate): HeatmapStreamResult;
/**
 * Resolve colormap domain override after a stream update (D5 single source of truth).
 *
 * - replaceZ with both zMin/zMax → lock override
 * - series zDomainExplicit → null override (use series zMin/zMax; no strip expand)
 * - auto + single-col scroll → expand from strip
 * - auto + recompute → full field
 * - otherwise leave prior override unchanged
 */
export declare function resolveHeatmapStreamDomainOverride(args: {
    readonly zDomainExplicit: boolean;
    readonly seriesZMin: number;
    readonly seriesZMax: number;
    readonly prevOverride: {
        zMin: number;
        zMax: number;
    } | null;
    readonly result: HeatmapStreamResult;
    readonly update: HeatmapUpdate;
}): {
    zMin: number;
    zMax: number;
} | null;
//# sourceMappingURL=heatmapStream.d.ts.map