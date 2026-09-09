/**
 * GPU texture management for the RenderCoordinator.
 *
 * Handles lazy allocation of render target textures and MSAA overlay management.
 * Uses a **2-pass** rendering strategy (Phase 4b — no third single-sample top pass):
 * 1. Main scene → 4× MSAA texture, resolved to single-sample mainResolveTexture
 * 2. Overlay 4× MSAA: blit resolved main → above-series annotations → axes/crosshair/highlight
 *    → resolve to swapchain
 *
 * @module textureManager
 */
import type { PipelineCache } from '../../PipelineCache';
/**
 * MSAA sample count for the main scene render pass.
 * All series renderers (line, area, bar, scatter, etc.) and the grid
 * must create pipelines with this sample count.
 *
 * WebGPU only allows multisample counts of **1 or 4** (portable). A prior
 * residual attempt used 2× for fill-rate; that fails validation on Chrome
 * (`Invalid CommandBuffer` / invalid texture sampleCount) and is not legal.
 * Keep main + overlay at 4×. Dense high-N lines use a **post-resolve
 * sampleCount:1 hairline pass** (see `renderDenseHairlineLines`) so unsorted
 * full rewrites do not pay 4× MSAA overdraw on every segment.
 */
export declare const MAIN_SCENE_MSAA_SAMPLE_COUNT = 4;
/**
 * MSAA sample count for annotation overlay pass.
 * Higher values reduce aliasing but increase memory/performance cost.
 */
export declare const ANNOTATION_OVERLAY_MSAA_SAMPLE_COUNT = 4;
/**
 * Texture manager state exposed to the render coordinator.
 */
interface TextureManagerState {
    readonly mainColorView: GPUTextureView | null;
    /** Single-sample resolve target for the MSAA main pass. Used by the overlay blit. */
    readonly mainResolveView: GPUTextureView | null;
    readonly overlayMsaaView: GPUTextureView | null;
    readonly overlayBlitBindGroup: GPUBindGroup | null;
    readonly overlayBlitPipeline: GPURenderPipeline;
    readonly msaaSampleCount: number;
    /** MSAA sample count for the main scene render pass. */
    readonly mainSceneMsaaSampleCount: number;
}
/**
 * Configuration for texture manager creation.
 */
interface TextureManagerConfig {
    readonly device: GPUDevice;
    readonly targetFormat: GPUTextureFormat;
    readonly pipelineCache?: PipelineCache;
    /**
     * MSAA sample count for main + overlay targets (WebGPU portable: 1 or 4 only).
     * Defaults to {@link MAIN_SCENE_MSAA_SAMPLE_COUNT} (4). Pass 1 when
     * `options.antialias === false` for multi-chart / streaming grids.
     */
    readonly sampleCount?: 1 | 4;
}
/**
 * Texture manager interface returned by factory function.
 */
interface TextureManager {
    /**
     * Ensures textures are allocated for the given dimensions.
     * Reallocates if size or format changes.
     *
     * @param width - Canvas width in device pixels
     * @param height - Canvas height in device pixels
     * @param options.needResolveAndOverlay - When false (direct swapchain resolve path),
     *   only the main 4× MSAA color target is allocated. When true (dense-hairline /
     *   2-pass path), also allocate mainResolve + overlay MSAA + blit bind group.
     *   Default true for backward compatibility.
     */
    ensureTextures(width: number, height: number, options?: {
        readonly needResolveAndOverlay?: boolean;
        /** When false, skip main MSAA color (sampleCount-1 direct-to-swapchain path). Default true. */
        readonly needMainColor?: boolean;
    }): void;
    /**
     * Gets current texture manager state for rendering.
     *
     * @returns Current state with texture views and bind groups
     */
    getState(): TextureManagerState;
    /**
     * Disposes all GPU resources.
     * Textures, views, and bind groups are destroyed.
     */
    dispose(): void;
}
/**
 * Creates a texture manager for render target allocation and management.
 *
 * The texture manager uses lazy allocation: textures are only created when
 * first requested via ensureTextures(), and are reallocated if dimensions
 * or format change.
 *
 * **Architecture:**
 * - Main color texture: 4× MSAA render target for main scene
 * - Main resolve texture: Single-sample resolve target (read by overlay blit)
 * - Overlay MSAA texture: Multi-sample render target for annotations
 * - Blit pipeline: Copies resolved main scene to MSAA target for overlay pass
 *
 * @param config - Configuration with device and target format
 * @returns Texture manager instance
 */
export declare function createTextureManager(config: TextureManagerConfig): TextureManager;
export {};
//# sourceMappingURL=textureManager.d.ts.map