/**
 * Tooltip and legend helper utilities.
 *
 * Provides utilities for managing tooltip state, caching content to avoid
 * unnecessary DOM updates, and computing tooltip anchor positions for special
 * chart types like candlesticks.
 *
 * @module tooltipLegendHelpers
 */
import type { OHLCDataPoint } from '../../../config/types';
import type { LinearScale } from '../../../utils/scales';
import type { GridArea } from '../../../renderers/createGridRenderer';
/**
 * Cached tooltip state for content deduplication.
 *
 * Tracks the last displayed content and position to avoid unnecessary DOM updates
 * when the tooltip hasn't actually changed.
 */
interface TooltipCache {
    content: string | null;
    x: number | null;
    y: number | null;
}
/**
 * Creates a new empty tooltip cache.
 *
 * @returns Fresh tooltip cache with null values
 */
export declare function createTooltipCache(): TooltipCache;
/**
 * Checks if tooltip content or position has changed.
 *
 * Returns true if any of the values differ from the cache, indicating that
 * a DOM update is needed.
 *
 * @param cache - Current cached state
 * @param content - New content to display
 * @param x - New X position in CSS pixels
 * @param y - New Y position in CSS pixels
 * @returns True if update is needed (values differ from cache)
 */
export declare function shouldUpdateTooltip(cache: TooltipCache, content: string, x: number, y: number): boolean;
/**
 * Updates the tooltip cache with new values.
 *
 * Should be called after successfully updating the DOM to keep cache in sync.
 *
 * @param cache - Tooltip cache to update (mutated)
 * @param content - New content that was displayed
 * @param x - New X position that was set
 * @param y - New Y position that was set
 */
export declare function updateTooltipCache(cache: TooltipCache, content: string, x: number, y: number): void;
/**
 * Clears the tooltip cache.
 *
 * Should be called when the tooltip is hidden to ensure fresh state
 * when it's shown again.
 *
 * @param cache - Tooltip cache to clear (mutated)
 */
export declare function clearTooltipCache(cache: TooltipCache): void;
/**
 * Determines if a data point is an OHLC/candlestick point.
 *
 * Checks if the point is a 5-element tuple (timestamp, open, close, low, high)
 * or an object with OHLC properties.
 *
 * @param point - Data point to check
 * @returns True if point is OHLC format
 */
export declare function isOHLCDataPoint(point: any): point is OHLCDataPoint;
export declare function computeCandlestickTooltipAnchorFromMatch(match: {
    readonly point: OHLCDataPoint;
    readonly yAxisId?: string;
}, xScale: LinearScale, yScales: Map<string, LinearScale>, gridArea: GridArea, canvas: HTMLCanvasElement): Readonly<{
    x: number;
    y: number;
}> | null;
export {};
//# sourceMappingURL=tooltipLegendHelpers.d.ts.map