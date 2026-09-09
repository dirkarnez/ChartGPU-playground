import type { ChartGPUOptions } from './types';
/**
 * Finance OHLC family series types that share candlestick data / sampling /
 * priceLabel / append infrastructure.
 */
export type FinanceOhlcSeriesType = 'candlestick' | 'ohlc';
/** True when `type` is candlestick or thin OHLC bars. */
export declare function isFinanceOhlcSeriesType(type: string | undefined | null): type is FinanceOhlcSeriesType;
/**
 * Narrows a series object to finance OHLC family (`candlestick` | `ohlc`).
 * Prefer this over `isFinanceOhlcSeriesType(s.type)` when you need property access
 * under the discriminant (TypeScript does not re-narrow `s` from a type-string guard alone).
 */
export declare function isFinanceOhlcSeries<T extends {
    readonly type: string;
}>(s: T | null | undefined): s is T & {
    readonly type: FinanceOhlcSeriesType;
};
/**
 * True iff `series[0]` exists and is type `'candlestick'` or `'ohlc'`.
 *
 * Only the first series is considered. Overlay/indicator lines as `series[0]`
 * mean the chart is **not** finance-primary (consumers must set axis position /
 * gutters explicitly).
 *
 * Name kept as `isCandlePrimaryChart` for API stability; behavior includes OHLC bars.
 */
export declare function isCandlePrimaryChart(user: ChartGPUOptions): boolean;
//# sourceMappingURL=isCandlePrimaryChart.d.ts.map