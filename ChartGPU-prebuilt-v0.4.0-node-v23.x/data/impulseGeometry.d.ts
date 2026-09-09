/**
 * Pure impulse / stem geometry helpers.
 *
 * One vertical stem per sample from baseline → y. Not error-bar HLC.
 * Shared by GPU pack path, bounds, hit-test, and unit tests.
 *
 * @module impulseGeometry
 * @internal
 */
import type { CartesianSeriesData } from '../config/types';
import { type Bounds, type CoordinatorCartesianData } from './cartesianData';
export type ImpulseStem = Readonly<{
    readonly x: number;
    readonly y: number;
    readonly baseline: number;
    /** True when |y - baseline| is effectively zero — skip zero-length stem. */
    readonly zeroLength: boolean;
}>;
/** Domain rect for a vertical stem with half-thickness in domain X. */
export type ImpulseStemRect = Readonly<{
    readonly minX: number;
    readonly maxX: number;
    readonly minY: number;
    readonly maxY: number;
}>;
/**
 * Stem endpoints for one sample. Returns null when x or y is non-finite.
 * Degenerate (y ≈ baseline) stems are still returned with zeroLength=true
 * so callers can skip the stem body but still draw a marker.
 */
export declare function impulseStemForSample(x: number, y: number, baseline: number): ImpulseStem | null;
/**
 * Domain-space axis-aligned rect for a vertical stem at x from baseline→y,
 * with half-thickness `stemHalf` in domain X.
 * Returns null for non-finite / zero-length stems.
 */
export declare function impulseStemRect(stem: ImpulseStem, stemHalf: number): ImpulseStemRect | null;
/**
 * Iterate drawable stems from cartesian data. Skips non-finite samples.
 */
export declare function forEachImpulseStem(data: CoordinatorCartesianData, baseline: number, visit: (stem: ImpulseStem, dataIndex: number) => void): void;
/**
 * Bounds for auto domain: include all finite y and baseline when it lies
 * outside the data y range (or when no finite y exists).
 */
export declare function impulseBounds(data: CartesianSeriesData | CoordinatorCartesianData, baseline: number): Bounds | null;
/**
 * Point-in-rect with optional domain padding (hit-test pad already folded in).
 */
export declare function pointInImpulseRect(domainX: number, domainY: number, rect: ImpulseStemRect): boolean;
/**
 * Expand a domain rect by padX / padY (domain units).
 */
export declare function expandImpulseRect(rect: ImpulseStemRect, padX: number, padY: number): ImpulseStemRect;
/**
 * Marker hit square centered at (x, y) with half-size in domain (max of X/Y).
 */
export declare function impulseMarkerRect(x: number, y: number, halfDomain: number): ImpulseStemRect;
//# sourceMappingURL=impulseGeometry.d.ts.map