import type { ResolvedCandlestickSeriesConfig, ResolvedOhlcSeriesConfig } from '../config/OptionResolver';
import type { OHLCDataPoint } from '../config/types';
import type { LinearScale } from '../utils/scales';
export interface CandlestickMatch {
    seriesIndex: number;
    dataIndex: number;
    point: OHLCDataPoint;
}
/**
 * Shared bar-width fields for candlestick and thin OHLC bar series
 * (finance family — same `barWidth` / min / max contract).
 */
export type FinanceBarWidthSeriesConfig = Pick<ResolvedCandlestickSeriesConfig | ResolvedOhlcSeriesConfig, 'barWidth' | 'barMinWidth' | 'barMaxWidth'>;
/** Finance series accepted by findCandlestick / body-width helpers. */
export type FinanceOhlcHitSeriesConfig = ResolvedCandlestickSeriesConfig | ResolvedOhlcSeriesConfig | (FinanceBarWidthSeriesConfig & {
    readonly data: ReadonlyArray<OHLCDataPoint>;
});
/** Y hit region: candle body (open/close) or full OHLC stem (low/high). */
export type OhlcYHitMode = 'openClose' | 'lowHigh';
/**
 * Computes finance bar category width in xScale **range-space** units.
 *
 * Notes:
 * - Mirrors candlestick / OHLC renderer bar width semantics, but stays in range units
 *   (CSS pixels in ChartGPU interaction usage).
 * - No DPR conversions are applied here.
 * - Same helper for `type: 'candlestick'` and `type: 'ohlc'`.
 */
export declare function computeCandlestickBodyWidthRange(series: FinanceBarWidthSeriesConfig, data: ReadonlyArray<OHLCDataPoint>, xScale: LinearScale, plotWidthFallback?: number): number;
/**
 * Finds a finance bar (candlestick or thin OHLC) under the given cursor position.
 *
 * Coordinate system contract:
 * - `x`/`y` MUST be in the same units as `xScale`/`yScale` **range-space**
 *   (ChartGPU interaction uses grid-local CSS pixels).
 *
 * Hit-test semantics (both modes require `abs(x - xCenter) <= barWidth / 2`):
 * - **`yHitMode: 'openClose'`** (default — candlestick / ChartGPU candle hitTest):
 *   body-only; Y between scaled open and close (wicks ignored).
 * - **`yHitMode: 'lowHigh'`** (OHLC bars — tooltip + ChartGPU.hitTest):
 *   stem range; Y between scaled low and high (open/close ticks still hit when inside stem).
 *
 * Call sites:
 * - Candlestick tooltips / candle hitTest → `'openClose'`
 * - OHLC tooltips (`findCandlestickAtPointer`) / OHLC hitTest → `'lowHigh'`
 *
 * Performance:
 * - Per-series lower-bound binary search on timestamp, then scans left/right while x-distance alone can still hit.
 * - If timestamps are not monotonic non-decreasing finite numbers, falls back to an O(n) scan for correctness.
 *
 * Edge cases:
 * - Skips non-finite timestamps / required Y fields for the active mode.
 * - If `barWidthClip` is non-finite or <= 0, returns null.
 * - Returns the closest in x (min abs dx) among hits; ties broken by smaller `dataIndex` (then smaller `seriesIndex`).
 */
export declare function findCandlestick(series: ReadonlyArray<FinanceOhlcHitSeriesConfig>, x: number, y: number, xScale: LinearScale, yScale: LinearScale, barWidthClip: number, options?: {
    readonly yHitMode?: OhlcYHitMode;
}): CandlestickMatch | null;
//# sourceMappingURL=findCandlestick.d.ts.map