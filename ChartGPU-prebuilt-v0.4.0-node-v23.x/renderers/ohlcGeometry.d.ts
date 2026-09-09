/**
 * Pure helpers for OHLC bar geometry (stem + open/close ticks).
 * Shared by OHLC and candlestick GPU pack paths and unit tests.
 */
import type { OHLCDataPoint, OHLCDataPointTuple } from '../config/types';
export type OhlcDirection = 'up' | 'down';
export declare const parsePercent: (value: string) => number | null;
export declare const isTupleDataPoint: (p: OHLCDataPoint) => p is OHLCDataPointTuple;
export declare const getOHLC: (p: OHLCDataPoint) => {
    readonly timestamp: number;
    readonly open: number;
    readonly close: number;
    readonly low: number;
    readonly high: number;
};
/** Minimum positive Δtimestamp between consecutive finite candles (sorted). */
export declare const computeOhlcCategoryStep: (data: ReadonlyArray<OHLCDataPoint>) => number;
/**
 * Direction color rule (match candlestick body fill): close > open → up.
 * Equal open/close (doji) counts as down for color.
 */
export declare function resolveOhlcDirection(open: number, close: number): OhlcDirection;
/**
 * Resolve tick half-length in domain units from `tickLength` config + body width.
 *
 * - number: CSS px already converted to domain via `cssWidthToDomainX`
 * - percent string of body width: `p * bodyWidthDomain` (full arm length, not half)
 * - default fraction when tickLength omitted: `defaultFraction * bodyWidthDomain`
 *
 * Returns the **full** tick arm length (center → tip). Open is left of center by
 * this amount; close is right by this amount.
 */
export declare function resolveOhlcTickLengthDomain(args: {
    readonly tickLength: number | string | undefined;
    readonly bodyWidthDomain: number;
    /** When `tickLength` is a number, caller has already converted CSS→domain. */
    readonly tickLengthAsDomain?: number;
    readonly defaultFraction?: number;
}): number;
/**
 * Stem half-width in domain units from CSS px conversion result.
 * Minimum 0; non-finite → 0.
 */
export declare function resolveOhlcStemHalfWidthDomain(stemWidthDomain: number): number;
/**
 * Domain-space quads for one OHLC bar (see goal Appendix A).
 *
 * - `stemHalf` is half-width in **domain X** (stem thickness).
 * - `tickHalfY` is half-height in **domain Y** (open/close tick thickness).
 *   Must not reuse domain-X stem units as Y thickness (time-axis X widths are
 *   enormous in price Y and paint full-height slabs).
 */
export declare function ohlcBarQuads(args: {
    readonly x: number;
    readonly open: number;
    readonly close: number;
    readonly low: number;
    readonly high: number;
    readonly stemHalf: number;
    readonly tickLength: number;
    /** Half-thickness of open/close ticks in domain Y. Defaults to `stemHalf` only for unit tests with isotropic domains. */
    readonly tickHalfY?: number;
}): {
    readonly stem: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    };
    readonly openTick: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    };
    readonly closeTick: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    };
};
//# sourceMappingURL=ohlcGeometry.d.ts.map