/**
 * Uniform heatmap / spectrogram GPU renderer.
 *
 * Data-space grid uploaded as an `r32float` texture + 256-entry colormap LUT,
 * drawn as a single quad with the same log/linear clip affine as other series.
 * Does **not** use DataStore XY packing.
 *
 * Dirty gates:
 * - z texture: size change, z array ref change, or content stamp change on setOption
 * - LUT: colormap key change
 * - uniforms only: zoom/pan, opacity (incl. opacityOverride), zMin/zMax, nullHandling, ringStart
 *
 * Streaming (updateHeatmap): modular GPU ring (strategy C) — single-column scroll
 * writes O(rows) via strip `writeTexture` and advances `ringStart` without memmoving
 * the texture. CPU field stays linear logical window. Full re-upload on replaceZ /
 * dimension change / multi-column batch.
 */
import type { ResolvedHeatmapSeriesConfig } from '../config/OptionResolver';
import type { ContinuousScale } from '../utils/scales';
import type { GridArea } from './createGridRenderer';
import type { PipelineCache } from '../core/PipelineCache';
export interface HeatmapPrepareOptions {
    /**
     * Multiplies series opacity for intro animation without changing series
     * config identity (avoids z re-upload thrash).
     */
    readonly opacityOverride?: number;
}
export interface HeatmapRenderer {
    prepare(seriesConfig: ResolvedHeatmapSeriesConfig, xScale: ContinuousScale, yScale: ContinuousScale, gridArea: GridArea, options?: HeatmapPrepareOptions): void;
    render(passEncoder: GPURenderPassEncoder): void;
    dispose(): void;
    /**
     * Spectrogram strip path (strategy C): write one (or few) columns into the
     * modular ring texture and advance ringStart. Does **not** full-pack the grid.
     * Payload is column-major: z[c * rows + r].
     *
     * @returns true when strip was applied; false if texture missing / dims invalid
     * (caller should fall back to full prepare upload).
     */
    uploadColumnStrip(columnMajorZ: ArrayLike<number>, colCount: number, rows: number, columns: number, logicalZ: Float32Array | ReadonlyArray<number>): boolean;
    /** Reset modular ring to 0 (replaceZ / dimension change / multi-col batch). */
    resetRing(): void;
    /** Current modular ring start (oldest column texel index). */
    getRingStart(): number;
    /** Test: full-grid z-texture uploads since create. */
    getZUploadCount(): number;
    /** Test: strip (O(rows)) column uploads since create. */
    getZStripUploadCount(): number;
    /** Test: total float elements written in strip uploads (approx GPU z traffic). */
    getZStripUploadFloats(): number;
    /** Test: LUT writeTexture calls since create. */
    getLutUploadCount(): number;
    hasZTexture(): boolean;
}
export interface HeatmapRendererOptions {
    readonly targetFormat?: GPUTextureFormat;
    readonly sampleCount?: number;
    readonly pipelineCache?: PipelineCache;
}
/** Pack z with row padding (bytesPerRow multiple of 256). Exported for tests. */
export declare function packZTextureData(z: Float32Array | ReadonlyArray<number>, columns: number, rows: number, paddedColumns: number): Float32Array<ArrayBuffer>;
/**
 * Pack a single column (height = rows) for a 1×rows writeTexture subrect.
 * bytesPerRow must be ≥ 4 and multiple of 256 → one float column still needs a
 * full 256-byte row stride in the staging layout (WebGPU rule).
 */
export declare function packColumnStripStaging(columnMajorZ: ArrayLike<number>, colOffset: number, rows: number): {
    data: Float32Array<ArrayBuffer>;
    paddedColumns: number;
    bytesPerRow: number;
};
export declare function paddedFloatColumns(columns: number): number;
export declare function createHeatmapRenderer(device: GPUDevice, options?: HeatmapRendererOptions): HeatmapRenderer;
//# sourceMappingURL=createHeatmapRenderer.d.ts.map