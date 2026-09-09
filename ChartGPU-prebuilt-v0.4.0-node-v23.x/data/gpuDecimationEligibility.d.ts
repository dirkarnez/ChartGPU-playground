/**
 * Eligibility gate for GPU-side compute-shader decimation.
 *
 * A single predicate consumed by both the coordinator's sampling-skip decision
 * (`recomputeRuntimeBaseSeries` / `recomputeRenderSeries` in
 * `createRenderCoordinator.ts`) and `prepareSeries`'s buffer-swap decision
 * (`renderCoordinator/render/renderSeries.ts`).
 *
 * A series is eligible when **all** hold:
 *   1. Series type is `'line'` — pure `'area'` is out of scope (different
 *      rawData/data flow). Line series with `areaStyle` **are** eligible
 *      (issue 1.4): the area renderer binds the same storage / decimation
 *      output as the stroke (no dual CPU pack).
 *   2. `sampling` is one of the three CPU modes we have GPU kernels for:
 *      `'lttb'`, `'min'`, `'max'`. `'none'`, `'average'`, and `'ohlc'` fall
 *      back to the CPU path.
 *   3. Raw data is null-gap-free. Null entries denote segmentation breaks for
 *      the line renderer; the compute shader cannot reason about those, so we
 *      stay on the CPU path (which already has established gap handling).
 */
import type { SeriesSampling } from '../config/types';
import type { ResolvedSeriesConfig } from '../config/OptionResolver';
import { type CoordinatorCartesianData } from './cartesianData';
import type { DecimationAlgorithm } from '../renderers/createDecimationCompute';
/**
 * Sampling modes that route to the GPU compute decimation path.
 */
export declare const GPU_DECIMATION_SAMPLING_MODES: ReadonlySet<SeriesSampling>;
/**
 * Maps a CPU `SeriesSampling` value to the GPU compute algorithm that will
 * handle it.
 *
 * Returns `null` for modes that have no GPU kernel (caller falls back to CPU).
 */
export declare function mapSamplingToDecimationAlgorithm(sampling: SeriesSampling): DecimationAlgorithm | null;
/**
 * Returns `true` when the given series + raw-data pair should run through the
 * GPU compute decimation path instead of CPU `sampleSeriesDataPoints`.
 *
 * The predicate is reference-cheap when earlier gates fail; the only potentially
 * O(n) check is `hasNullGaps` (null + non-finite x/y across all cartesian formats,
 * sticky per data identity after first true — H1).
 *
 * **Single gate:** all coordinator sites (baseline recompute, zoom recompute,
 * prepareSeries buffer-swap) must call this predicate (or a thin wrapper that
 * only adds intentional extra gates documented in the agreement matrix test).
 */
export declare function isGpuDecimationEligible(series: ResolvedSeriesConfig, rawData: CoordinatorCartesianData | null | undefined): boolean;
//# sourceMappingURL=gpuDecimationEligibility.d.ts.map