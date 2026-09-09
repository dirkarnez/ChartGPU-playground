/**
 * Axis tick computation and formatting.
 *
 * Generates tick values and formatting for linear and logarithmic axes. Handles
 * decimal precision determination based on tick step size and provides number
 * formatting utilities.
 *
 * @module computeAxisTicks
 */
/**
 * Generates evenly-spaced tick values between domain min and max.
 *
 * Prefer {@link generateNiceAxisTicks} for value-axis **presentation** (labels,
 * GPU ticks, grid). Keep this for intentional equal splits / fallbacks.
 *
 * @param domainMin - Minimum value of the domain
 * @param domainMax - Maximum value of the domain
 * @param tickCount - Number of ticks to generate (must be >= 1)
 * @returns Array of tick values
 */
export declare function generateLinearTicks(domainMin: number, domainMax: number, tickCount: number): number[];
/**
 * Value-axis presentation ticks: 1–2–5 × 10ⁿ nice ladder **clamped to the domain**
 * so labels, GPU marks, and grid stay in-plot. Falls back to equal domain splits
 * when the nice generator is degenerate.
 */
export declare function generateValueAxisTicks(domainMin: number, domainMax: number, tickCountHint?: number): number[];
/**
 * Generates major log tick values at integer powers of `base` inside [min, max].
 *
 * Domain endpoints that are non-positive are replaced with a safe fallback
 * `[1, base]` before generation. If no integer power falls inside the domain
 * (intra-decade window, e.g. `[2, 3]`), domain endpoints are returned so grid
 * lines and labels stay inside the plot range.
 *
 * @param domainMin - Domain minimum (data space)
 * @param domainMax - Domain maximum (data space)
 * @param base - Logarithm base (default 10; invalid bases fall back to 10)
 * @returns Sorted major tick values in data space
 */
export declare function generateLogTicks(domainMin: number, domainMax: number, base?: number): number[];
/**
 * Generates log-axis ticks for the *visible* domain (e.g. after zoom/pan).
 *
 * Always places majors at integer powers of `base` that fall inside the window.
 * When few majors are present (zoomed into one decade or an intra-decade band),
 * densifies with intermediate mantissas (2×/5× then denser for base 10; log-spaced
 * samples for other bases) so labels and grid stay useful inside the plot.
 *
 * Ticks are filtered to the visible domain. Callers should pass the scale's
 * current domain (visible window), not the full explicit axis min/max.
 *
 * @param domainMin - Visible domain minimum (data space)
 * @param domainMax - Visible domain maximum (data space)
 * @param base - Logarithm base (default 10)
 * @param options - Optional maxTicks cap (default 12)
 * @returns Sorted tick values in data space, all within the visible domain
 */
export declare function generateLogTicksForVisibleDomain(domainMin: number, domainMax: number, base?: number, options?: {
    maxTicks?: number;
}): number[];
/**
 * Formats a log-axis tick value for display (data-space value, not the log exponent).
 *
 * Policy (base 10):
 * - Exact powers with |exp| ≥ 3 → scientific `1eN`
 * - Exact powers with |exp| ≤ 2 → plain decimal (`0.01`, `0.1`, `1`, `10`, `100`)
 * - Non-power / other bases → compact scientific or plain via Number formatting
 *
 * @param v - Data-space tick value
 * @param base - Logarithm base used for power detection
 */
export declare function formatLogTickValue(v: number, base?: number): string | null;
/**
 * Creates an Intl.NumberFormat for tick value formatting.
 *
 * Automatically determines the appropriate number of decimal places based on the
 * tick step size using `computeMaxFractionDigitsFromStep()`.
 *
 * @param tickStep - The step size between ticks
 * @returns Intl.NumberFormat configured for tick formatting
 */
export declare function createTickFormatter(tickStep: number): Intl.NumberFormat;
/**
 * Formats a numeric tick value using the provided number formatter.
 *
 * Handles edge cases:
 * - Non-finite values return null
 * - Values near zero (< 1e-12) are normalized to 0 to avoid "-0" display
 * - Unexpected "NaN" output from formatter is guarded against
 *
 * @param nf - Intl.NumberFormat to use for formatting
 * @param v - Numeric value to format
 * @returns Formatted string or null if value cannot be formatted
 */
export declare function formatTickValue(nf: Intl.NumberFormat, v: number): string | null;
//# sourceMappingURL=computeAxisTicks.d.ts.map