/**
 * DOM-only bar-close countdown timer for the last-price badge.
 *
 * Ticks call `setCountdown` only — never `requestRender` / GPU frames.
 * Clock: `nowMs ?? Date.now`. Headless (no `window`) is a no-op for the
 * interval; frame sync still writes countdown text via `update()`.
 *
 * @module createPriceLabelCountdownTimer
 */
export type PriceLabelCountdownDesired = Readonly<{
    /**
     * When true, timer should run: owner series has show + showCountdown and a
     * valid intervalMs (resolved config).
     */
    readonly active: boolean;
    /** Candle period; identity compared to decide clear+restart. */
    readonly intervalMs: number | null;
    /** Injectable clock; null → Date.now at tick. Identity compared for restart. */
    readonly nowMs: (() => number) | null;
}>;
type CreatePriceLabelCountdownTimerOptions = Readonly<{
    /** DOM-only countdown write (badge.setCountdown). */
    readonly setCountdown: (text: string | null) => void;
    /**
     * Inject for tests. Default: `window.setInterval` when `window` exists,
     * otherwise no-op (headless).
     */
    readonly setIntervalFn?: (handler: () => void, ms: number) => ReturnType<typeof setInterval>;
    readonly clearIntervalFn?: (id: ReturnType<typeof setInterval>) => void;
    /** Tick period in ms (default {@link PRICE_LABEL_COUNTDOWN_TICK_MS}). */
    readonly tickMs?: number;
}>;
export type PriceLabelCountdownTimer = {
    /**
     * Idempotent config transition (setOptions / frame).
     * - inactive → clear timer + setCountdown(null)
     * - active + (no timer | intervalMs/nowMs identity change) → clear + restart
     * - active + same identities → keep timer
     */
    setDesired(desired: PriceLabelCountdownDesired | null): void;
    /**
     * Update closed-over bar end for remaining time. Keeps timer running.
     * Immediate tick when timer is active so candle rolls feel snappy.
     */
    setBarEndMs(barEndMs: number | null): void;
    /** Clear timer; optional clear of countdown text (default true). */
    clear(options?: {
        clearText?: boolean;
    }): void;
    dispose(): void;
    /** Whether an interval handle is currently scheduled. */
    isRunning(): boolean;
};
/**
 * Create a countdown timer controller bound to a badge `setCountdown`.
 *
 * **Must never** schedule GPU renders — only DOM text updates.
 */
export declare function createPriceLabelCountdownTimer(options: CreatePriceLabelCountdownTimerOptions): PriceLabelCountdownTimer;
/**
 * Derive timer desired state from a resolved candlestick priceLabel + ownership.
 * Pure helper for setOptions / frame wiring.
 */
export declare function priceLabelCountdownDesiredFromConfig(args: {
    readonly show: boolean;
    readonly showCountdown: boolean;
    readonly intervalMs: number | null;
    readonly nowMs: (() => number) | null;
}): PriceLabelCountdownDesired;
export {};
//# sourceMappingURL=createPriceLabelCountdownTimer.d.ts.map