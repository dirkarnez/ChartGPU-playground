/**
 * Pure step (digital) connection geometry for line / area mountain.
 *
 * Expands source samples into an owned polyline of stair corners.
 * Never mutates caller-owned arrays. Hit-test/tooltip use source samples;
 * only GPU prepare consumes the expanded polyline.
 *
 * @module stepGeometry
 * @internal
 */
import type { CartesianSeriesData, StepMode } from '../config/types';
import { type CoordinatorCartesianData } from './cartesianData';
/** Re-export public StepMode so internal modules import from one place. */
export type { StepMode };
/** Owned expanded polyline as XY columns (CartesianSeriesData shape). */
export type StepPolyline = Readonly<{
    readonly x: Float64Array;
    readonly y: Float64Array;
}>;
/** Owned stacked step expand (shared x, stepped yBottom/yTop). */
export type StepStackedPolyline = Readonly<{
    readonly x: Float64Array;
    readonly yBottom: Float64Array;
    readonly yTop: Float64Array;
}>;
/**
 * Normalize public `step` option to a mode, or null for linear geometry.
 * Invalid strings return null (caller may warn).
 */
export declare function resolveStepMode(step: boolean | StepMode | string | undefined | null): StepMode | null;
/** True when a string was provided but is not a valid StepMode. */
export declare function isInvalidStepValue(step: unknown): boolean;
/**
 * Count output vertices for a gap-free run of `n` finite samples under `mode`.
 * n<=0 → 0; n===1 → 1; else after/before: 2n-1, middle: 3n-2.
 */
export declare function stepExpandedCount(sampleCount: number, mode: StepMode): number;
/**
 * Expand consecutive finite samples into a stair polyline.
 *
 * - Non-finite x/y break the path (new run) unless `connectNulls` is true
 *   (gaps are stripped first by the caller when connectNulls — this function
 *   still treats non-finite as breaks if they remain).
 * - Never mutates input. Returns owned Float64Array columns.
 * - Single isolated finite sample → one-point polyline (no stroke segments).
 */
export declare function expandStepPolyline(data: CoordinatorCartesianData, mode: StepMode, options?: Readonly<{
    readonly connectNulls?: boolean;
}>): StepPolyline;
/**
 * Expand stacked mountain yBottom/yTop with the same step x-policy.
 * `data` supplies x (and gap structure); yBottom/yTop are parallel arrays
 * of length getPointCount(data). Non-finite x or either y breaks the run
 * (unless connectNulls — caller should pre-filter).
 */
export declare function expandStepStacked(data: CoordinatorCartesianData, yBottom: ArrayLike<number>, yTop: ArrayLike<number>, mode: StepMode, options?: Readonly<{
    readonly connectNulls?: boolean;
}>): StepStackedPolyline;
/**
 * Expand when step is active; otherwise return null so callers keep linear path.
 */
export declare function maybeExpandStepPolyline(data: CoordinatorCartesianData, step: boolean | StepMode | string | undefined | null, options?: Readonly<{
    readonly connectNulls?: boolean;
}>): StepPolyline | null;
/** XY-columns CartesianSeriesData from a step polyline (view over owned arrays). */
export declare function stepPolylineAsCartesian(poly: StepPolyline): CartesianSeriesData;
//# sourceMappingURL=stepGeometry.d.ts.map