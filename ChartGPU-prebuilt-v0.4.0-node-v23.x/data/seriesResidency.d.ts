/**
 * Series residency + upload policy.
 *
 * Shared verb vocabulary for how series data lives on CPU staging / GPU and
 * which upload action the next prepare should take:
 * - **Line** (`prepareSeries` setSeriesIfChanged): skip / rangedAppend / fullRewrite
 * - **Scatter** / **candlestick**: geometry-cache skip + yOnlyRewrite
 *
 * @module seriesResidency
 * @internal
 */
/** Where the authoritative packed floats live for a series. */
export type SeriesResidencyKind = 'dataStore' | 'privateInstance' | 'privateStorage' | 'sharedStorage';
/**
 * Next upload action for a series prepare. Callers map renderer-specific
 * cache hits onto these verbs so policy can be logged/tested uniformly.
 */
export type UploadPolicy = 'skip' | 'rangedAppend' | 'fullRewrite' | 'growWithGpuCopy' | 'yOnlyRewrite';
export type SeriesResidency = {
    readonly kind: SeriesResidencyKind;
    /** GPU buffer currently bound for draw/compute (when known). */
    readonly gpuBuffer: GPUBuffer | null;
    /** Logical point / instance count. */
    readonly pointCount: number;
    /** DataStore FNV stamp or renderer-local content version. */
    readonly contentVersion: number;
    /** Last consumer data ref used for identity skip (may be null). */
    readonly lastRef: unknown | null;
};
/**
 * Decide upload policy from residency + frame inputs.
 * Pure helper — renderers may inline equivalent logic; this is the shared
 * contract for tests and future convergence.
 */
export declare function resolveUploadPolicy(input: {
    readonly residency: SeriesResidency;
    readonly dataRef: unknown | null;
    readonly geometryCacheHit: boolean;
    readonly appendedThisFrame: boolean;
    readonly needsGrowth: boolean;
    /** Equal-N x-stable y rewrite (scatter dual-buffer / partial GPU). */
    readonly yOnlyRewrite?: boolean;
}): UploadPolicy;
//# sourceMappingURL=seriesResidency.d.ts.map