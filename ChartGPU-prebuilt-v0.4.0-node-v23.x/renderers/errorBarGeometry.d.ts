/**
 * Pure helpers for error-bar geometry (stem + whisker caps).
 * Shared by GPU pack path and unit tests.
 *
 * Domain-axis hygiene (OHLC lesson):
 * - Vertical: stem thickness in domain **X**; cap thickness in domain **Y**.
 * - Horizontal: stem thickness in domain **Y**; cap thickness in domain **X**.
 */
import type { ErrorBarDirection, ErrorBarMode } from '../config/types';
import type { ErrorBarPoint } from '../data/errorBarData';
export type DomainRect = Readonly<{
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}>;
/**
 * Resolve cap full width (whisker length) in domain units.
 *
 * - number with `capWidthAsDomain`: CSS px already converted to domain
 * - percent string: fraction of category step (vertical → domain X; horizontal → domain Y step)
 * - omitted: defaultFraction * categoryStep (default 0.4)
 *
 * Returns **full** cap width (tip-to-tip). Half is applied in quads.
 */
export declare function resolveErrorBarCapLengthDomain(args: {
    readonly capWidth: number | string | undefined;
    readonly categoryStep: number;
    /** When `capWidth` is a number, caller has already converted CSS→domain. */
    readonly capWidthAsDomain?: number;
    readonly defaultFraction?: number;
}): number;
/**
 * Stem full-width in domain units from CSS conversion result → half via *0.5 at call site.
 * Returns full domain thickness (caller halves).
 */
export declare function resolveErrorBarStemWidthDomain(stemWidthDomain: number): number;
export declare function resolveErrorBarStemHalfWidthDomain(stemWidthDomain: number): number;
/**
 * Stem endpoints for a sample under errorMode.
 * Locked v1:
 * - both: low → high
 * - high: y → high
 * - low: low → y
 */
export declare function errorBarStemRange(point: ErrorBarPoint, errorMode: ErrorBarMode): {
    readonly a: number;
    readonly b: number;
};
/**
 * Domain-space quads for one error bar.
 *
 * Vertical:
 * - stem at x, thickness stemHalf in domain X, from stem lo→hi in Y
 * - caps horizontal at high and/or low, half-length capHalf, thickness capHalfThick in domain Y
 *
 * Horizontal:
 * - stem at y, thickness stemHalf in domain Y, from stem lo→hi in X (high/low are X)
 * - caps vertical at high/low X, half-length capHalf in Y, thickness capHalfThick in domain X
 */
export declare function errorBarInstanceQuads(args: {
    readonly x: number;
    readonly y: number;
    readonly high: number;
    readonly low: number;
    readonly stemHalf: number;
    /** Half of tip-to-tip cap length. */
    readonly capHalf: number;
    /**
     * Half-thickness of caps in the cross-axis domain
     * (vertical bars → domain Y; horizontal → domain X).
     * Must not reuse domain stem width from the wrong axis.
     */
    readonly capHalfThick: number;
    readonly errorMode?: ErrorBarMode;
    readonly drawWhiskers?: boolean;
    readonly drawConnector?: boolean;
    readonly direction?: ErrorBarDirection;
}): {
    readonly stem: DomainRect | null;
    readonly highCap: DomainRect | null;
    readonly lowCap: DomainRect | null;
};
/** Expand rect by pad in both axes (domain units). */
export declare function expandDomainRect(r: DomainRect, padX: number, padY: number): DomainRect;
export declare function pointInDomainRect(x: number, y: number, r: DomainRect): boolean;
//# sourceMappingURL=errorBarGeometry.d.ts.map