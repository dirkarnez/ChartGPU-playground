/**
 * Production prepareSeries GPU-decimation gate (H2).
 *
 * Combines the pure {@link isGpuDecimationEligible} predicate with the intentional
 * extra hard-disables that exist only at prepare time:
 * - runtime stacked mountain geometry map entry (`hasStackGeometry`)
 * - resolved step mode already computed for draw policy (`stepMode != null`)
 *
 * Extra gates may only **disable** GPU; they never enable when the pure predicate is false.
 *
 * @module gpuDecimationPrepareGate
 * @internal
 */
import type { ResolvedSeriesConfig } from '../config/OptionResolver';
import type { StepMode } from '../config/types';
import type { CoordinatorCartesianData } from './cartesianData';
/**
 * True when prepareSeries should take the GPU compute-decimation path for this series.
 */
export declare function isPrepareSeriesGpuDecimationEligible(series: ResolvedSeriesConfig, rawData: CoordinatorCartesianData | null | undefined, extras?: {
    /** True when stacked mountain geometry is already built for this index. */
    readonly hasStackGeometry?: boolean;
    /** Resolved step mode from {@link resolveStepMode}; null = linear. */
    readonly stepMode?: StepMode | null;
}): boolean;
//# sourceMappingURL=gpuDecimationPrepareGate.d.ts.map