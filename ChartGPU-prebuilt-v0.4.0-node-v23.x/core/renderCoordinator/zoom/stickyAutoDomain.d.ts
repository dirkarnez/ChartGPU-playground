/**
 * Sticky auto-range domain with optional grow-by headroom.
 *
 * **Y axes** use ~10% headroom so streaming amplitude noise does not rebuild
 * overlays every frame. **X axes** use zero headroom so unbounded `appendData`
 * (e.g. ultimate-benchmark streaming) keeps the series full-width: non-zero X
 * pad left an empty right gutter that filled then re-jumped on every breach.
 *
 * Opt-in continuous / animated modes track data every paint (see
 * {@link resolveAutoRangeMode} / {@link applyContinuousAutoDomain}).
 *
 * @module stickyAutoDomain
 * @internal
 */
/** Default sticky headroom for Y (and generic callers). */
export declare const DEFAULT_STICKY_DOMAIN_HEADROOM = 0.1;
/**
 * Sticky headroom for the **X** axis. Must stay 0 so auto-range streaming
 * tracks data max tightly (full plot width). Non-zero pad reintroduces the
 * empty-right grow/reset cycle under continuous `appendData`.
 */
export declare const DEFAULT_STICKY_X_DOMAIN_HEADROOM = 0;
/** Auto-range motion when both axis ends are free. */
type AutoRangeMode = 'sticky' | 'continuous' | 'animated';
/** Continuous/animated pad: single fraction or [minEdge, maxEdge]. */
type GrowBySpec = number | readonly [number, number];
/** Domain pair used by sticky/continuous/animated helpers and paint resolvers. */
export type StickyDomain = {
    min: number;
    max: number;
};
/**
 * Sticky auto-domain applies only when **both** axis ends are auto.
 * Any one-sided explicit min/max must not receive growBy headroom past that edge.
 */
export declare function shouldApplyStickyAutoDomain(explicitMin: number | undefined, explicitMax: number | undefined): boolean;
/**
 * Resolve public `autoRange` option; unknown / omitted → sticky (safe default).
 */
export declare function resolveAutoRangeMode(autoRange: unknown): AutoRangeMode;
/**
 * Continuous auto-range: visible domain tracks data bounds every paint with optional pad.
 * Does **not** freeze between breaches (unlike sticky). Call only when both ends are free.
 *
 * Cold start and stream use the same pad rule (unlike sticky's exact first establish).
 */
export declare function applyContinuousAutoDomain(dataDomain: {
    readonly min: number;
    readonly max: number;
}, growBy?: GrowBySpec, defaultGrowBy?: number): StickyDomain;
/**
 * Continuous auto-range with headroom applied in **log space** (for log axes).
 */
export declare function applyContinuousAutoLogDomain(dataDomain: {
    readonly min: number;
    readonly max: number;
}, base?: number, growBy?: GrowBySpec, defaultGrowBy?: number): StickyDomain;
/**
 * One step of animated auto-range: lerp display toward continuous target.
 * Returns `{ domain, settled }` — settled when within relative epsilon of target.
 *
 * @param alpha - Blend factor in [0, 1] (1 = snap to target)
 */
export declare function stepAnimatedAutoDomain(display: StickyDomain | null, target: StickyDomain, alpha: number): {
    domain: StickyDomain;
    settled: boolean;
};
/**
 * Coordinator gate for **X** sticky domain: skip when FIFO auto-scroll is on
 * (domain must track the sliding window) or when either X end is explicit.
 */
export declare function shouldSkipStickyAutoXDomain(autoScroll: boolean | undefined, explicitMin: number | undefined, explicitMax: number | undefined): boolean;
/**
 * Read-only sticky vs data domain for zoom→visible window, sampling, and slice.
 *
 * Must match paint's sticky / autoScroll / explicit-end gates so decimation
 * windows agree with GPU scales when sticky headroom is active. Does **not**
 * mutate sticky state — paint path uses {@link applyStickyAutoDomain} for that.
 *
 * @param dataDomain - Raw data (or explicit-axis) domain from computeBaseXDomain
 * @param sticky - Current sticky domain, or null when not established
 * @param opts.skipSticky - When true (autoScroll / explicit ends), always return dataDomain
 */
export declare function resolveStickyOrDataDomain(dataDomain: {
    readonly min: number;
    readonly max: number;
}, sticky: StickyDomain | null, opts: {
    readonly skipSticky: boolean;
}): {
    min: number;
    max: number;
};
/**
 * Expand sticky domain with headroom when data breaches; otherwise reuse sticky.
 *
 * **First establish:** exact data domain (no pad). Static suite charts (column /
 * mountain ascending X) must fill the plot — padding max by 10% on
 * establish left a permanent empty band on the right (100k pts → axis to ~110k).
 *
 * **Later breaches:** pad only the edge that moved (`headroom` growBy). Pass
 * {@link DEFAULT_STICKY_DOMAIN_HEADROOM} for Y; pass
 * {@link DEFAULT_STICKY_X_DOMAIN_HEADROOM} (0) for X so streaming max growth
 * stays full-width instead of oscillating empty-right gutters.
 *
 * **Sliding windows (FIFO / maxPoints):** when the data min moves *up* (oldest
 * points dropped), do **not** freeze the historical min — re-establish from the
 * current data domain. Freezing min at the series origin while max scrolls
 * compresses the entire waveform into a thin strip on the right edge of the
 * plot (FIFO/ECG visual regression). Unbounded compression keeps min stable at
 * 0; with X headroom 0 the sticky max tracks data max exactly while streaming.
 */
export declare function applyStickyAutoDomain(dataDomain: {
    readonly min: number;
    readonly max: number;
}, sticky: StickyDomain | null, headroom?: number): StickyDomain;
/**
 * Sticky auto-domain with headroom applied in **log space** (for log axes).
 *
 * Same breach / cold-start / window-slide semantics as {@link applyStickyAutoDomain},
 * but pad is a fraction of `log_b(max) - log_b(min)` so multi-decade ranges grow
 * symmetrically in decades rather than linear units.
 *
 * Requires strictly positive finite domain endpoints; non-positive inputs fall through
 * to a trivial `{ min, max }` copy (caller should sanitize first).
 */
export declare function applyStickyAutoLogDomain(dataDomain: {
    readonly min: number;
    readonly max: number;
}, sticky: StickyDomain | null, base?: number, headroom?: number): StickyDomain;
export {};
//# sourceMappingURL=stickyAutoDomain.d.ts.map