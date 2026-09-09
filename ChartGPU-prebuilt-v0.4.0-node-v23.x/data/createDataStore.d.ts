import type { CartesianSeriesData } from '../config/types';
export type SeriesRingLayout = Readonly<{
    /**
     * Physical index of the oldest retained point. `0` with `capacity === 0`
     * means linear layout in `[0, pointCount)`.
     */
    start: number;
    /**
     * Modular ring size in points. `0` means the buffer is chronological /
     * linear (decimation may index `raw[i]` directly).
     */
    capacity: number;
}>;
export interface DataStore {
    setSeries(index: number, data: CartesianSeriesData, options?: Readonly<{
        xOffset?: number;
        /**
         * When true, skip the O(N) FNV content hash after packing (issue 2.6).
         * Coordinator already decided content changed (e.g. cache miss, y-only).
         * contentVersion for decimation still updates via a cheap stamp.
         */
        skipContentHash?: boolean;
    }>): void;
    /**
     * Appends new points to an existing series without re-uploading the entire buffer when possible.
     *
     * - Reuses the same geometric growth policy as `setSeries` when unbounded.
     * - When no reallocation is needed and no points are dropped, writes only the appended byte
     *   range via `queue.writeBuffer(...)`.
     * - When `maxPoints` is set, applies the shared fixed-capacity **ring** policy
     *   (`planMaxPointsWindow` in `maxPointsWindow.ts`):
     *   - if the new batch alone is ≥ `maxPoints`, keep only that batch’s tail
     *     (strict replace — previous points discarded);
     *   - else fill up to `maxPoints`, then overwrite oldest slots modularly
     *     (O(append) `writeBuffer` only — no full retained-window rewrite).
     * - Peak GPU reservation under ring capacity is **`maxPoints`** points.
     * - Maintains `pointCount` for render path queries.
     *
     * **Cold seed:** when no series entry exists yet, callers may pass `{ maxPoints }` to
     * allocate a ring at capacity and pack once (empty chart → first `appendData`).
     * Without `maxPoints`, throws if the series has not been set yet (coordinator
     * dual-pack fallthrough must seed from series config + this batch).
     */
    appendSeries(index: number, newPoints: CartesianSeriesData, options?: Readonly<{
        maxPoints?: number;
    }>): void;
    removeSeries(index: number): void;
    getSeriesBuffer(index: number): GPUBuffer;
    /**
     * Returns the number of points last set for the given series index.
     *
     * Throws if the series has not been set yet.
     */
    getSeriesPointCount(index: number): number;
    /**
     * Modular ring layout for GPU consumers (decimation / line ring remap).
     *
     * - `capacity === 0`: unbounded linear storage (no maxPoints ring).
     * - `capacity > 0`: fixed-capacity ring mode. `start` is the physical index of
     *   logical 0. When `start === 0`, physical layout is chronological (identity
     *   map); area/line+areaStyle may share the GPU buffer. When `start !== 0`,
     *   storage is modular after wrap — consumers must remap or private-pack.
     *
     * Capacity is always exposed while ring mode is active (including pre-wrap
     * `start === 0`) so hierarchy maintain keeps a stable ringCap across FIFO
     * cycles. Use {@link isSeriesRingMode} for residency checks.
     */
    getSeriesRingLayout(index: number): SeriesRingLayout;
    /**
     * True when the series is under maxPoints modular-ring residency
     * (`ringCapacityPoints > 0`), including the pre-wrap fill phase.
     *
     * Callers must not linearize via `setSeries` while this is true unless an
     * intentional full rebuild is desired (issue 0.2).
     */
    isSeriesRingMode(index: number): boolean;
    /**
     * Effective fixed-capacity window for this series when ring mode is active
     * (caller `maxPoints` **or** device auto-window at storage binding limits).
     * Returns `null` when the series is unbounded linear storage.
     *
     * Hit-test / dual-store paths must apply the same window when this is non-null
     * even if the API caller omitted `options.maxPoints`.
     */
    getSeriesEffectiveMaxPoints(index: number): number | null;
    /**
     * Content version for GPU dirty-gating (WG-P0-2).
     *
     * - **`setSeries`**:
     *   - **Cold multi‑M** (no prior entry, `pointCount ≥ 1_000_000`): O(1)
     *     version stamp from N only (not FNV of packed floats). Setup tax for
     *     FIFO 5M/10M seeds; floats still pack/upload — only the hash path skips.
     *     Content-independent at equal N (equal-content early-out does not apply
     *     on cold first write anyway).
     *   - **Otherwise**: FNV-1a of the packed Float32 payload (equal-content
     *     early-out when a full rewrite matches the previous hash). Y-only and
     *     `skipContentHash` use an O(1) stamp bump when an entry already exists.
     * - **`appendSeries`**: O(1) version stamp (not FNV of the new floats). Append
     *   always mutates residency; hashing 250k×5 floats/frame was pure tax.
     *   Warm multi‑M strict replace / rebuild **chains** `bumpContentVersion(existing)`
     *   so successive equal-N replaces dirty decimation. Absolute multi‑M stamp
     *   (fixed base) is **only** for true cold first write.
     *
     * Changes whenever packed content is rewritten (including same-N appends),
     * except cold multi‑M first-write stamps which key on N/plan counts only.
     * Throws if the series has not been set yet.
     */
    getSeriesContentHash(index: number): number;
    /**
     * Capacity-sized CPU staging buffer retained for this series (WG-P1-9).
     * Same object identity across `setSeries` calls that do not grow capacity.
     * Under ring mode after wrap, layout is **modular** (oldest at `ringStart`).
     *
     * Throws if the series has not been set yet.
     */
    getSeriesStagingBuffer(index: number): Float32Array;
    /**
     * X-origin subtracted during packing (time-axis Float32 precision). Staging
     * stores `x - xOffset`; domain-space consumers must add this back.
     */
    getSeriesXOffset(index: number): number;
    dispose(): void;
}
export declare function createDataStore(device: GPUDevice): DataStore;
//# sourceMappingURL=createDataStore.d.ts.map