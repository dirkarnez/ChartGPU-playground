/**
 * Visible Y-bounds helpers for autoBounds + zoom.
 *
 * Full-span zoom uses O(1) raw bounds (caller). Zoomed GPU-decimation series
 * may still hold full raw — callers pass an X window so extrema reflect the
 * visible slice, not the entire series.
 *
 * Full-span detection is the single shared predicate {@link isFullSpanZoom} from
 * `zoomHelpers` (0.5% edge tolerance for UI/float imprecision). Re-exported as
 * `isFullSpanZoomRange` for call-site naming; do not reintroduce a strict
 * start≤0/end≥100 duplicate.
 *
 * @module visibleYBounds
 * @internal
 */
import type { CartesianSeriesData } from '../../../config/types';
import { isFullSpanZoom } from './zoomHelpers';
/** @see isFullSpanZoom — single source of truth (0.5% tolerance). */
export declare const isFullSpanZoomRange: typeof isFullSpanZoom;
/**
 * Scan cartesian points for y min/max, optionally restricted to an X window.
 * Returns null when no finite points contribute (caller aggregates / falls back).
 */
export declare function scanCartesianVisibleYBounds(data: CartesianSeriesData, xWindow?: {
    readonly min: number;
    readonly max: number;
} | null): {
    yMin: number;
    yMax: number;
} | null;
/**
 * Scan cartesian points for **strictly positive** y min/max (log-axis auto domain).
 * Optionally restricted to an X window — same window used for visible Y under zoom
 * so positives outside the view do not pull the log domain.
 * Returns null when no positive finite y contributes (caller falls back).
 */
export declare function scanCartesianPositiveYBounds(data: CartesianSeriesData, xWindow?: {
    readonly min: number;
    readonly max: number;
} | null): {
    yMin: number;
    yMax: number;
} | null;
//# sourceMappingURL=visibleYBounds.d.ts.map