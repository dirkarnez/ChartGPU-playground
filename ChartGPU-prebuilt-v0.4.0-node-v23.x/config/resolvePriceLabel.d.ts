import type { CandlestickPriceLabelConfig } from './types';
/**
 * Fully resolved last-price badge / line settings attached to each resolved
 * candlestick series (non-reuse OptionResolver path).
 */
export type ResolvedCandlestickPriceLabel = Readonly<{
    show: boolean;
    showLine: boolean;
    intervalMs: number | null;
    showCountdown: boolean;
    /** null → use `Date.now` at the countdown use site */
    nowMs: (() => number) | null;
    formatter: ((close: number) => string) | null;
    outOfDomain: 'clamp' | 'hide';
    color: string | null;
    lineColor: string | null;
    lineWidth: number;
}>;
export type ResolvePriceLabelContext = Readonly<{
    readonly candlePrimary: boolean;
}>;
/**
 * Resolve candlestick `priceLabel` sugar / config into a stable runtime shape.
 *
 * Truth table (locked):
 * 1. `undefined` → `show = candlePrimary`
 * 2. `false` → all off
 * 3. `true` → show true + field defaults
 * 4. object → `show = input.show ?? true`
 * 5. `showLine = input.showLine ?? show` (false when `!show`)
 * 6. `intervalMs` finite `> 0` else null
 * 7. `showCountdown = show && intervalMs != null && (input.showCountdown ?? true)`
 * 8. `outOfDomain` default `'clamp'`; `lineWidth` default `1`
 * 9. `nowMs` / `formatter` / colors pass through or null
 */
export declare function resolvePriceLabel(input: boolean | CandlestickPriceLabelConfig | undefined, ctx: ResolvePriceLabelContext): ResolvedCandlestickPriceLabel;
//# sourceMappingURL=resolvePriceLabel.d.ts.map