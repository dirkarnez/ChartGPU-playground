/**
 * Stable integer category key for stacked bar segments.
 *
 * Shared by bar domain packing (`createBarRenderer`) and bar hit-testing
 * (`findNearestPoint`) so drawn stacks and hit targets agree.
 *
 * Prefer domain `round(x / categoryStep)` (scale-independent). Fall back to
 * range-space category buckets, then quantized domain.
 */
export declare function bucketStackedXKey(xCenterPx: number, categoryWidthPx: number, xDomain: number, categoryStep: number): number;
//# sourceMappingURL=barStackKey.d.ts.map