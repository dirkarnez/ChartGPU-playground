/**
 * Resync coordinator-owned OHLC from consumer series data on setOption.
 *
 * Streaming examples (e.g. candlestick-streaming) keep a stable OHLC array,
 * mutate the forming bar in place, and call setOption. The coordinator stores a
 * **sliced owned copy** for appendData, so presentation-only setOption (same
 * data ref → didSeriesDataLikelyChange false) would never update what the
 * candlestick renderer packs unless we copy user edits into the owned store.
 *
 * Prefers in-place mutation of the owned array so geometry identity can keep
 * the same data ref while length / last-candle fingerprints force re-upload.
 *
 * @module syncCandlestickRuntime
 * @internal
 */
import type { ResolvedSeriesConfig } from '../../../config/OptionResolver';
import type { OHLCDataPoint } from '../../../config/types';
type OhlcBounds = Readonly<{
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
}>;
type SyncCandlestickRuntimeResult = {
    /** True when any owned OHLC slot was written. */
    readonly didMutate: boolean;
    /** True when an owned array was replaced (new ref) — caller should recompute baseline. */
    readonly didReplaceRef: boolean;
    /** Series indices that were mutated. */
    readonly indices: readonly number[];
};
/**
 * Copy consumer candlestick OHLC into coordinator-owned runtime slots.
 *
 * @param extendBounds - Bounds helper (injected for testability)
 */
export declare function syncCandlestickOwnedFromUserSeries(input: {
    readonly series: ReadonlyArray<ResolvedSeriesConfig>;
    readonly runtimeRawDataByIndex: unknown[];
    readonly runtimeRawBoundsByIndex: Array<OhlcBounds | null>;
    readonly extendBounds: (bounds: OhlcBounds | null, points: ReadonlyArray<OHLCDataPoint>) => OhlcBounds | null;
}): SyncCandlestickRuntimeResult;
export {};
//# sourceMappingURL=syncCandlestickRuntime.d.ts.map