/**
 * Pure helpers for the exchange-style last-price badge (priceLabel).
 *
 * Config resolution (`resolvePriceLabel`, types) lives in `src/config/` — single
 * source of truth. This module owns last-candle derivation, ownership scan,
 * default price/countdown formatters used by the coordinator frame sync.
 *
 * @module priceLabelHelpers
 */
import type { OHLCDataPoint, CandlestickPriceLabelConfig } from '../../../config/types';
import type { ResolvedCandlestickPriceLabel } from '../../../config/resolvePriceLabel';
export type LastCandleState = Readonly<{
    seriesIndex: number;
    yAxisId: string;
    open: number;
    close: number;
    timestamp: number;
    /**
     * Badge direction: close >= open (flat counts as up per design).
     * Note: candlestick renderer body fill still uses strict close > open;
     * flat body height is zero so the visual difference is negligible.
     */
    isUp: boolean;
    upColor: string;
    downColor: string;
    directionColor: string;
    /** timestamp + intervalMs when interval set; else null. */
    barEndMs: number | null;
}>;
/** Minimal series shape for ownership scan (resolved or raw). */
export type PriceLabelOwnershipSeries = Readonly<{
    type: string;
    visible?: boolean;
    /**
     * Resolved `{ show }`, boolean sugar, full config object, or undefined
     * (undefined + candlePrimary → treated as show when scanning ownership).
     */
    priceLabel?: boolean | CandlestickPriceLabelConfig | Pick<ResolvedCandlestickPriceLabel, 'show'> | null;
}>;
/**
 * Default badge number formatter (K12).
 * Plain string only — more precision than sparse axis ticks; never HTML.
 */
export declare function formatPriceLabelValue(close: number): string;
/**
 * Format remaining bar time as `HH:MM:SS` (always three fields).
 * Past end / non-finite → `00:00:00`.
 */
export declare function formatCountdown(remainingMs: number): string;
/**
 * Remaining ms until bar close; clamped at 0.
 */
export declare function remainingMsToBarClose(barEndMs: number | null | undefined, nowMs: number): number;
/**
 * Derive last-candle state from coordinator-owned raw OHLC.
 *
 * Data source (locked):
 * - Only `runtimeRawDataByIndex[seriesIndex]` (never sampled `series.data`)
 * - Always `raw[raw.length - 1]`
 * - Empty / non-finite open or close → null (hide badge + line)
 */
export declare function resolveLastCandleState(args: {
    readonly seriesIndex: number;
    readonly yAxisId: string;
    readonly raw: ReadonlyArray<OHLCDataPoint> | null | undefined;
    readonly upColor: string;
    readonly downColor: string;
    readonly intervalMs: number | null;
}): LastCandleState | null;
/**
 * Ownership (v1 — one badge per chart): first visible candlestick series with
 * resolved/raw `priceLabel.show` wins. Later candidates are ignored with at most
 * one warn per call (design: “one warn”).
 */
export declare function selectPriceLabelSeries(series: ReadonlyArray<PriceLabelOwnershipSeries>, options?: {
    readonly candlePrimary?: boolean;
    readonly onWarn?: (message: string) => void;
}): number | null;
//# sourceMappingURL=priceLabelHelpers.d.ts.map