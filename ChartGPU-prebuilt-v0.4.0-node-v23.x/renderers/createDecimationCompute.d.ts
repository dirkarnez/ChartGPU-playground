/**
 * GPU compute-shader decimation for line-series data.
 *
 * Replaces CPU-side LTTB / min / max sampling with a compute pipeline that reads
 * raw series points from a storage buffer (owned by `DataStore`) and writes the
 * decimated point set into its own output storage buffer. The renderer consumes
 * the output buffer directly — no readback to CPU, no repacking per frame.
 *
 * Wired identically to scatter-density: the caller invokes {@link prepare} to
 * update uniforms and dirty-gate, then {@link encodeCompute} from the render
 * loop just before `beginRenderPass()` (see `encodeScatterDensityCompute` in
 * `renderCoordinator/render/renderSeries.ts` for the sibling pattern).
 *
 * Supported `sampling` modes (match the existing CPU API 1:1):
 *   - `'min'` / `'max'` — per-bucket argmin/argmax on y. One kernel dispatch.
 *   - `'lttb'` / `'auto'` — two-phase parallel LTTB (per-bucket averages, then
 *     triangle-area maximization against the neighboring bucket averages).
 *
 * **Dense-bucket candidate cap (WGSL):** when a bucket's raw range exceeds 512
 * points, LTTB / min / max evaluate a uniform **128**-sample candidate set
 * (including endpoints) instead of every raw point; the averages pre-pass uses
 * **64** samples for coarse triangle anchors. Below 512 pts/bucket the scan is
 * exact (covers 1M × 2500 ≈ 400). At extreme N (5M–10M / 2500 buckets) min/max
 * are approximate extrema, not guaranteed true bucket min/max. Cap is a G4
 * residual — still period=1 honest recompute for this frame's `SIG` (G0–G2).
 *
 * **Tile hierarchy (Phase B multi‑M FIFO):** physical tiles of size 1024 store
 * min/max/sum aggregates. Maintain is O(touched tiles) on append/wrap; present
 * reads hierarchy when policy enables it (modular multi‑K or pts/bucket > 512).
 * Hierarchy never skips present encode when `SIG ≠ lastEncodedSIG`.
 *
 * All entry points live in `src/shaders/decimation.wgsl` (+ maintain in
 * `decimationHierarchy.wgsl`).
 *
 * ---
 *
 * ## Golden encode-signature / temporal present fidelity (G0–G2)
 *
 * **G0 — Present-time encode-signature fidelity:** never present decimation
 * output whose last successful encode `SIG` differs from this frame’s prepare
 * inputs. `SIG` fields: algorithm, rawBuffer, rawPointCount, visibleStart,
 * visibleEnd, targetBuckets, contentVersion, ringStart, ringCapacity.
 *
 * **G1 — Lifecycle:** three concepts stay distinct:
 * - **Current prepare `SIG`** — this frame’s inputs (every `prepare`).
 * - **`lastEncodedSIG`** — updated **only after successful `encodeCompute`**
 *   that wrote output for that `SIG`. Never on prepare entry.
 * - **Present** — draw binds output only when current `SIG == lastEncodedSIG`
 *   (coordinator: prepare → encode if needsEncode → draw same frame).
 *
 * **G2 — No multi-frame streaming amortization:** whenever prepare `SIG`
 * differs from `lastEncodedSIG`, encode this frame (period effectively 1 for
 * all pure streaming: modular FIFO **and** linear growth). Density period
 * tables, skip streaks, and intentional present lag are **forbidden**
 * (period-flash class). Equal-N version bumps and `resourcesChanged` still
 * force encode.
 *
 * **Illegal forever:**
 * 1. `SIG != lastEncodedSIG` and draw binds decimation output.
 * 2. Update lastEncoded / clear dirty without encode (permanent stale).
 * 3. Dirty/encode without rewriting uniforms for the new `SIG`.
 * 4. Skip present because hierarchy is warm while SIG changed.
 */
import type { PipelineCache } from '../core/PipelineCache';
/**
 * Algorithm selected by the caller. Mirrors the CPU `SeriesSampling` values
 * that this module can accelerate. The coordinator is responsible for mapping
 * `'auto'` to `'lttb'` before calling in (we do not re-encode that decision
 * here so the module stays policy-free).
 */
export type DecimationAlgorithm = 'lttb' | 'min' | 'max';
export interface DecimationComputePrepareParams {
    readonly algorithm: DecimationAlgorithm;
    /**
     * Raw (unsampled) series data on the GPU. Must be a storage buffer of
     * interleaved `vec2<f32>` points, identical to the buffer `DataStore`
     * maintains for line/area renderers.
     */
    readonly rawBuffer: GPUBuffer;
    /**
     * Total number of raw points in {@link rawBuffer}. The compute shader only
     * indexes `[0, rawPointCount)` regardless of the buffer's byte capacity.
     */
    readonly rawPointCount: number;
    /**
     * Inclusive-start, exclusive-end raw-index window to decimate. The caller
     * normally derives this from a binary search over the raw x-column keyed on
     * the visible x-domain (identical to what `findVisibleRangeIndicesByX` does
     * for scatter-density).
     */
    readonly visibleStart: number;
    readonly visibleEnd: number;
    /**
     * Desired output point count. Typically `plotWidthPx * samplingDensity` in
     * the same spirit as the CPU `samplingThreshold` logic.
     */
    readonly targetBuckets: number;
    /**
     * Monotonic or content-derived version of the packed raw payload (WG-P0-2).
     * DataStore's FNV-1a `hash32` is the usual source. Same buffer identity +
     * same point count + rewritten floats must change this so compute re-runs.
     * Omit (or keep stable) when content is known unchanged so pure pan/window
     * skips still work via the other signature fields.
     */
    readonly contentVersion?: number;
    /**
     * Fixed-capacity ring FIFO layout for `rawBuffer`. When `ringCapacity` is
     * 0/omitted, storage is linear chronological. When set, logical index `i`
     * maps to physical `(ringStart + i) % ringCapacity` in WGSL.
     */
    readonly ringStart?: number;
    readonly ringCapacity?: number;
}
/** @internal Harness / unit diagnostics for hierarchy maintain + present path. */
export interface DecimationHierarchyDebug {
    readonly hierarchyReady: boolean;
    readonly lastPresentHierarchy: boolean;
    readonly lastMaintainTileCount: number;
    readonly preparedRawPointCount: number;
    readonly preparedRingCapacity: number;
}
export interface DecimationCompute {
    /**
     * Updates uniforms + dirty-gating for the next call to {@link encodeCompute}.
     *
     * Safe to call on every frame; compute work is only dispatched when the
     * input signature actually changes.
     *
     * @returns Presentable point count for this frame: the bucket count when the
     * output will (or already does) represent this prepare's `SIG`, or **0** when
     * the visible span is empty / not current so the coordinator must not draw a
     * prior encode as current (G0).
     */
    prepare(params: DecimationComputePrepareParams): number;
    /**
     * True when the next {@link encodeCompute} will dispatch work — present SIG
     * dirty **or** hierarchy maintain still pending (cold chunk / range dirty).
     * Used by the coordinator to open a shared compute pass only when needed.
     */
    needsEncode(): boolean;
    /**
     * Encodes the compute pass(es) onto {@link encoder}. No-op if no eligible
     * `prepare()` has been called and hierarchy does not need maintain.
     *
     * When `intoPass` is provided, dispatches into that shared pass (caller owns
     * begin/end). Used by the coordinator to batch all series decimation into one
     * compute pass instead of 5× beginComputePass per frame.
     *
     * Order: (1) hierarchy maintain if dirty, (2) present select into output when
     * present SIG is dirty, (3) set lastEncodedSIG only after present write.
     * Maintain-only encodes (cold chunk while present SIG clean) do **not**
     * advance lastEncodedSIG.
     */
    encodeCompute(encoder: GPUCommandEncoder, intoPass?: GPUComputePassEncoder): void;
    /**
     * GPU storage buffer holding the decimated `vec2<f32>` points. Stable across
     * frames except when the target bucket count grows past capacity (geometric
     * growth). Renderers should cache their bind group by buffer identity.
     */
    getOutputBuffer(): GPUBuffer;
    /**
     * Number of points actually written to {@link getOutputBuffer} by the most
     * recent {@link prepare} call. Returns `0` until the first prepare.
     */
    getOutputPointCount(): number;
    /**
     * @internal Hierarchy path diagnostics for unit tests / harness — not a public API.
     */
    getHierarchyDebug(): DecimationHierarchyDebug;
    dispose(): void;
}
export interface DecimationComputeOptions {
    readonly pipelineCache?: PipelineCache;
}
export declare function createDecimationCompute(device: GPUDevice, options?: DecimationComputeOptions): DecimationCompute;
//# sourceMappingURL=createDecimationCompute.d.ts.map