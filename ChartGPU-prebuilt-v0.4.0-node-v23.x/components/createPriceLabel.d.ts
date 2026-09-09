/**
 * Exchange-style last-price badge DOM overlay.
 *
 * Mirrors createTooltip / createLegend: absolute-positioned root inside the
 * chart overlay container, pointer-events none, dispose() removes DOM.
 *
 * K14: natural content width, no ellipsis, no grid auto-expand.
 * K15: public package export for advanced hosts / React bindings.
 */
export interface PriceLabelUpdateState {
    readonly visible: boolean;
    /** Container-local CSS px — horizontal anchor (see side). */
    readonly x: number;
    /** Container-local CSS px — vertical center of the badge. */
    readonly y: number;
    readonly priceText: string;
    /** Secondary countdown line; null hides the line. */
    readonly countdownText: string | null;
    /** Direction color (green/red). Always solid badge background. */
    readonly background: string;
    /** Badge text color (default typically `#ffffff`). */
    readonly color: string;
    /**
     * `'right'` — badge left edge at `x` (right price rail).
     * `'left'` — badge right edge at `x` (left price rail).
     */
    readonly side: 'left' | 'right';
    /** Opacity (e.g. 0.85 when out-of-domain clamp). Default 1. */
    readonly opacity?: number;
}
export interface PriceLabel {
    update(state: PriceLabelUpdateState): void;
    /** Countdown-only DOM text update (no full layout if height stable). */
    setCountdown(text: string | null): void;
    dispose(): void;
}
export declare function createPriceLabel(container: HTMLElement): PriceLabel;
//# sourceMappingURL=createPriceLabel.d.ts.map