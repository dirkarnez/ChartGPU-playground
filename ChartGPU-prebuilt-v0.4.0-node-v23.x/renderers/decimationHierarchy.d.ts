/**
 * Pure helpers for GPU tile hierarchy decimation (Phase B multi‑M FIFO).
 *
 * Tile layout is **physical** (buffer index space): modular FIFO append only
 * invalidates tiles covering the overwritten physical range. Present path maps
 * logical bucket ranges → physical tiles via ringStart/ringCapacity.
 *
 * TILE = 1024 (literal; keep in sync with decimationHierarchy.wgsl /
 * decimation.wgsl). Do not reintroduce multi-frame present amortization.
 */
/** Fixed physical tile width (points). Power of two; matches WGSL literals. */
export declare const HIERARCHY_TILE = 1024;
/**
 * Enable hierarchy present when raw residency is at least this many points
 * (avoids hierarchy overhead on tiny series). Modular FIFO multi‑K+ also
 * enables above this floor even when pts/bucket ≤ 512.
 */
export declare const HIERARCHY_ENABLE_MIN_RAW = 8192;
/** Bytes per tile struct in WGSL (`Tile`: 8 × 4). */
export declare const HIERARCHY_TILE_BYTES = 32;
export interface TileAggregate {
    minY: number;
    maxY: number;
    /** Physical index of argmin y (or physStart if empty). */
    minIdx: number;
    /** Physical index of argmax y (or physStart if empty). */
    maxIdx: number;
    sumX: number;
    sumY: number;
    count: number;
}
export declare function tileCountForCapacity(physicalCapacity: number, tileSize?: number): number;
export declare function tileIndexForPhysical(physIdx: number, tileSize?: number): number;
/**
 * Inclusive tile range covering physical indices [physStart, physEnd).
 * Returns null when the range is empty.
 */
export declare function tilesOverlappingPhysical(physStart: number, physEnd: number, tileSize?: number): {
    startTile: number;
    endTileExclusive: number;
} | null;
/**
 * Physical ranges overwritten when a full modular ring advances `ringStart`
 * from `oldRingStart` to `newRingStart` (capacity fixed). Length k steps
 * forward; wraps into at most two half-open intervals.
 */
export declare function modularOverwriteRanges(oldRingStart: number, newRingStart: number, ringCapacity: number): Array<{
    start: number;
    end: number;
}>;
/**
 * Map a half-open logical index range to physical half-open ranges (≤2).
 * Mirrors WGSL `rawAt` / ring layout: phys = (ringStart + logical) % cap.
 */
export declare function logicalRangeToPhysicalRanges(logicalStart: number, logicalEnd: number, ringStart: number, ringCapacity: number): Array<{
    start: number;
    end: number;
}>;
/**
 * Whether hierarchy present should be used for this prepare signature.
 * Legacy full-scan remains for small N / sparse buckets when not modular multi‑K.
 *
 * Suite G7 1M×5 @ samplingThreshold 2500 ≈ 400 pts/bucket (≤512 exact band) but
 * still needs hierarchy for interactive FPS — enable on modular multi‑K **and**
 * near-M+ raw residency even when pts/bucket ≤ 512.
 */
export declare function shouldUseHierarchyPresent(opts: {
    rawPointCount: number;
    targetBuckets: number;
    visibleStart: number;
    visibleEnd: number;
    ringCapacity: number;
    hierarchyReady: boolean;
}): boolean;
/**
 * CPU reference tile builder over interleaved xy Float32 (or {x,y} pairs).
 * Physical indices [0, physicalCapacity); points beyond `liveCount` are ignored.
 */
export declare function buildTilesCpuReference(xy: ArrayLike<number>, liveCount: number, physicalCapacity: number, tileSize?: number): TileAggregate[];
/**
 * Apply range maintain on top of existing tiles (CPU). Rebuilds only tiles
 * overlapping the given physical ranges — used to assert O(touched) policy.
 */
export declare function maintainTilesCpuRange(xy: ArrayLike<number>, liveCount: number, physicalCapacity: number, tiles: TileAggregate[], ranges: Array<{
    start: number;
    end: number;
}>, tileSize?: number): {
    tiles: TileAggregate[];
    tilesTouched: number;
};
//# sourceMappingURL=decimationHierarchy.d.ts.map