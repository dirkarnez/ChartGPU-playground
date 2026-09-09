/**
 * Frame-level DOM sync for the exchange-style last-price badge.
 *
 * Pure extract so createRenderCoordinatorImpl stays thin: ownership scan,
 * last-candle derivation from owned raw OHLC, clip→container-local coords,
 * OOD clamp/hide. No price line (PR4b). Countdown timer (PR5) is owned by
 * the coordinator; this module returns frame state so the timer can update
 * its closed-over barEndMs without calling requestRender.
 *
 * Must be called **every frame after scales/layout**, outside the axis-label
 * DOM signature skip block.
 *
 * @module syncPriceLabelFrame
 */
import type { PriceLabel } from '../../../components/createPriceLabel';
import type { AxisConfig } from '../../../config/types';
import type { ResolvedSeriesConfig } from '../../../config/OptionResolver';
import type { ContinuousScale } from '../../../utils/scales';
import { type PriceLabelCountdownDesired } from './createPriceLabelCountdownTimer';
type PlotClipRectClipSpace = Readonly<{
    left: number;
    right: number;
    top: number;
    bottom: number;
}>;
type SyncPriceLabelFrameArgs = Readonly<{
    /** Single badge instance; null when no overlay container (SSR / offscreen). */
    readonly priceLabelUi: PriceLabel | null;
    /** Resolved series (priceLabel attached on candlestick non-reuse path). */
    readonly series: ReadonlyArray<ResolvedSeriesConfig>;
    /**
     * Coordinator-owned raw OHLC slots (`runtimeRawDataByIndex`).
     * Badge uses `raw[raw.length - 1]` only — never sampled `series.data`.
     */
    readonly runtimeRawDataByIndex: ReadonlyArray<unknown>;
    /** Clip-space Y scales keyed by axis id (`currentYScales`). */
    readonly yScales: ReadonlyMap<string, ContinuousScale>;
    readonly yAxes: ReadonlyArray<AxisConfig>;
    /** Plot rect in WebGPU clip space (same as `computePlotClipRect`). */
    readonly plotClipRect: PlotClipRectClipSpace;
    /**
     * Canvas CSS size used for clip→canvas conversion.
     * Prefer device-pixel-derived size (annotation path) for Y consistency with the plot.
     */
    readonly canvasCssWidth: number;
    readonly canvasCssHeight: number;
    /** Canvas offset within overlay container (container-local = canvas-local + offset). */
    readonly offsetX: number;
    readonly offsetY: number;
    /**
     * Multi-badge ownership warn (at most once per call from selectPriceLabelSeries).
     * Coordinator should gate to one warn per chart lifetime.
     */
    readonly onWarn?: (message: string) => void;
}>;
/**
 * Countdown timer inputs derived during the frame sync.
 * Coordinator applies these to `createPriceLabelCountdownTimer` (DOM-only).
 */
type SyncPriceLabelFrameResult = Readonly<{
    readonly countdownDesired: PriceLabelCountdownDesired;
    /** Last bar end ms when known; null when no last candle / inactive. */
    readonly barEndMs: number | null;
}>;
/**
 * Resolve countdown desired from the owning priceLabel series (config only).
 * Used by setOptions when a full frame has not run yet.
 */
export declare function resolvePriceLabelCountdownDesired(series: ReadonlyArray<ResolvedSeriesConfig>, options?: {
    readonly onWarn?: (message: string) => void;
}): PriceLabelCountdownDesired;
/**
 * Sync the last-price badge DOM for the current frame.
 *
 * Hide paths: no UI, no owning series, missing raw/scale, non-finite close Y,
 * empty canvas, or out-of-domain with `outOfDomain: 'hide'`.
 *
 * @returns Countdown timer inputs (desired config + barEndMs). Always defined.
 */
export declare function syncPriceLabelFrame(args: SyncPriceLabelFrameArgs): SyncPriceLabelFrameResult;
export {};
//# sourceMappingURL=syncPriceLabelFrame.d.ts.map