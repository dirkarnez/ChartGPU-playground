/**
 * Shared "nice number" tick generation for 2D and 3D value axes.
 *
 * Classic Graphics Gems / d3-array style 1–2–5 × 10ⁿ ladder.
 * Single implementation — 3D re-exports via {@link generateNiceAxisTicks3D}.
 *
 * @module niceAxisTicks
 */
/**
 * Classic "nice number" for axis domains (Graphics Gems / d3-array style).
 *
 * @param range - Positive span to round/ceil
 * @param round - When true, round to nearest ladder step; when false, ceil
 */
export declare function niceNum(range: number, round: boolean): number;
export type GenerateNiceAxisTicksOptions = {
    /**
     * When true (default for 2D presentation via {@link generateValueAxisTicks}),
     * drop majors strictly outside [min, max] so labels/grid stay in-plot.
     * When false (3D default), include nice endpoints slightly outside the raw domain.
     */
    readonly clampToDomain?: boolean;
};
/**
 * Generate ascending nice tick values covering [min, max] with ~tickCountHint majors.
 *
 * Always returns at least 2 values when domain is finite.
 * Degenerate (equal / non-finite) domains fall back to a padded pair or [0, 1].
 *
 * @param min - Domain minimum (data space)
 * @param max - Domain maximum (data space)
 * @param tickCountHint - Preferred major count (clamped 2–20; default 5)
 * @param options.clampToDomain - Filter to [min,max] (2D); false keeps slightly-outside nice ends (3D)
 */
export declare function generateNiceAxisTicks(min: number, max: number, tickCountHint?: number, options?: GenerateNiceAxisTicksOptions): number[];
//# sourceMappingURL=niceAxisTicks.d.ts.map