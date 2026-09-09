export interface ContinuousScale {
    /**
     * Sets the scale domain (data range). Returns self for chaining.
     */
    domain(min: number, max: number): ContinuousScale;
    /**
     * Sets the scale range (pixel / clip range). Returns self for chaining.
     */
    range(min: number, max: number): ContinuousScale;
    /**
     * Maps a domain value to a range value.
     *
     * Notes:
     * - No clamping (will extrapolate outside the domain).
     * - If the domain span is 0 (min === max), returns the midpoint of the range.
     * - Log scales return NaN for non-positive inputs.
     */
    scale(value: number): number;
    /**
     * Maps a range value (pixel) back to a domain value.
     *
     * Notes:
     * - No clamping (will extrapolate outside the range).
     * - If the domain span is 0 (min === max), returns domain min for any input.
     * - Log scales always return a positive domain value when the mapping is defined.
     */
    invert(pixel: number): number;
    /** Discriminator for GPU projection / affine helpers. */
    readonly kind: 'linear' | 'log';
    /** Present when `kind === 'log'`. Logarithm base (> 0, ≠ 1). */
    readonly base?: number;
    /** Current domain endpoints (data space). */
    getDomain(): {
        readonly min: number;
        readonly max: number;
    };
    /** Current range endpoints (pixel / clip space). */
    getRange(): {
        readonly min: number;
        readonly max: number;
    };
}
/**
 * Linear continuous scale. Alias of {@link ContinuousScale} for backward compatibility;
 * instances from {@link createLinearScale} always have `kind: 'linear'`.
 */
export type LinearScale = ContinuousScale;
export interface CategoryScale {
    /**
     * Sets the category domain (ordered list of unique category names).
     * Returns self for chaining.
     *
     * Throws if duplicates exist (ambiguous mapping).
     */
    domain(categories: string[]): CategoryScale;
    /**
     * Sets the scale range (pixel range). Returns self for chaining.
     */
    range(min: number, max: number): CategoryScale;
    /**
     * Returns the center x-position for a category.
     *
     * Edge cases:
     * - Unknown category: returns NaN
     * - Empty domain: returns midpoint of range
     */
    scale(category: string): number;
    /**
     * Width allocated per category (always non-negative).
     *
     * Edge cases:
     * - Empty domain: returns 0
     * - Reversed ranges allowed
     */
    bandwidth(): number;
    /**
     * Returns the index of a category in the current domain.
     *
     * Edge cases:
     * - Unknown category: returns -1
     */
    categoryIndex(category: string): number;
}
/** Default log base when omitted or invalid. */
export declare const DEFAULT_LOG_BASE = 10;
/**
 * Normalize a user-provided log base. Invalid bases (non-finite, ≤0, or 1) fall back to 10.
 */
export declare function normalizeLogBase(base: number | undefined | null): number;
/**
 * Creates a linear scale for mapping a numeric domain to a numeric range.
 *
 * Defaults to an identity mapping:
 * domain [0, 1] -> range [0, 1]
 */
export declare function createLinearScale(): ContinuousScale;
/**
 * Creates a logarithmic continuous scale.
 *
 * Mapping: range = lerp(log_b(value), log_b(domainMin), log_b(domainMax)).
 * Non-positive inputs to `scale` return NaN. Domain endpoints must be strictly positive;
 * non-positive domain values are clamped to a safe positive fallback on `domain()`.
 *
 * Defaults:
 * - base: 10 (or normalized from argument)
 * - domain: [1, 10]
 * - range: [0, 1]
 */
export declare function createLogScale(base?: number): ContinuousScale;
/**
 * Factory: build a continuous scale for an axis config.
 * Log axes use {@link createLogScale}; all other continuous types use linear.
 */
export declare function createAxisScale(axis: {
    readonly type: string;
    readonly logBase?: number;
}): ContinuousScale;
/**
 * Creates a category scale for mapping string categories to evenly spaced
 * x-positions across a numeric range.
 *
 * Defaults:
 * - domain: []
 * - range: [0, 1]
 */
export declare function createCategoryScale(): CategoryScale;
//# sourceMappingURL=scales.d.ts.map