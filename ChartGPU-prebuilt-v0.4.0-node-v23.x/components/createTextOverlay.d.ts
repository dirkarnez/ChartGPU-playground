export type TextOverlayAnchor = 'start' | 'middle' | 'end';
export interface TextOverlayLabelOptions {
    readonly fontSize?: number;
    readonly color?: string;
    readonly fontFamily?: string;
    /**
     * CSS/canvas font-weight (e.g. `'600'`, `bold`). Applied in the canvas
     * `ctx.font` string when set.
     */
    readonly fontWeight?: string | number;
    readonly anchor?: TextOverlayAnchor;
    /**
     * Rotation in degrees (CSS `rotate(<deg>deg)`).
     */
    readonly rotation?: number;
}
export interface TextOverlayOptions {
    /**
     * When true, clip labels to the overlay bounds (default: false).
     * Prevents labels from overflowing outside the container.
     */
    readonly clip?: boolean;
    /**
     * Canvas backing-store pixel ratio. Defaults to `window.devicePixelRatio`.
     * Pass the chart's resolved DPR (e.g. `options.devicePixelRatio ?? 1`) so
     * multi-chart dashboards at DPR 1 do not oversample labels vs the plot.
     */
    readonly devicePixelRatio?: number;
}
export interface TextOverlay {
    clear(): void;
    addLabel(text: string, x: number, y: number, options?: TextOverlayLabelOptions): HTMLSpanElement;
    dispose(): void;
}
/**
 * Canvas-backed text overlay for high-frequency axis label updates.
 *
 * Auto-ranging multi-chart / series compression rebuilds labels every frame.
 * DOM `createElement` + layout was a steady-state tax under multi-chart label churn.
 * A single canvas `fillText` pass matches the TextOverlay API (addLabel still
 * returns a dummy span for callers that style it — styles are applied via
 * options on the next fill). Anchors use canvas `textAlign` (not CSS transforms).
 */
export declare function createTextOverlay(container: HTMLElement, options?: TextOverlayOptions): TextOverlay;
//# sourceMappingURL=createTextOverlay.d.ts.map