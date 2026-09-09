/**
 * Canvas-baked glyph atlas for 3D axis labels (ticks + titles).
 * Pure metrics packing is unit-testable; bake uses OffscreenCanvas / canvas2D.
 */
export type GlyphMetrics = Readonly<{
    /** Atlas UV [0,1], top-left origin matching canvas. */
    readonly u0: number;
    readonly v0: number;
    readonly u1: number;
    readonly v1: number;
    /** Glyph bitmap size in atlas pixels. */
    readonly widthPx: number;
    readonly heightPx: number;
    /** Horizontal advance in atlas pixels (for layout). */
    readonly advancePx: number;
    /** Left bearing from pen position (atlas px). */
    readonly bearingXPx: number;
    /** Top of bitmap relative to baseline (positive up, atlas px). */
    readonly bearingYPx: number;
}>;
export type GlyphAtlas = Readonly<{
    readonly width: number;
    readonly height: number;
    /** RGBA8 row-major. */
    readonly pixels: Uint8ClampedArray;
    readonly glyphs: ReadonlyMap<string, GlyphMetrics>;
    /** Font size used when baking (CSS px * pixelScale). */
    readonly bakeFontPx: number;
    readonly lineHeightPx: number;
    /** Baseline from top of cell row (atlas px). */
    readonly baselineFromTopPx: number;
    readonly charset: string;
    readonly pixelScale: number;
}>;
export type BakeGlyphAtlasOptions = Readonly<{
    /** Characters to pack (duplicates ignored). Default: ASCII printable + common units. */
    readonly charset?: string;
    /** Reference CSS font size before pixelScale. Default 16. */
    readonly fontSizePx?: number;
    /** Supersample factor when baking. Default 2. */
    readonly pixelScale?: number;
    readonly fontFamily?: string;
    readonly fontWeight?: string | number;
    /** Atlas max edge (power-of-two preferred). Default 512. */
    readonly maxAtlasSize?: number;
    /** Padding around each glyph. Default 2. */
    readonly padPx?: number;
}>;
/** Latin printable + units / scientific notation punctuation used by axis ticks & titles. */
export declare const DEFAULT_AXES3D_GLYPH_CHARSET = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\u00B0\u00B1\u00B5\u2014\u2013\u2026\u00B7";
export type MeasuredGlyph = Readonly<{
    readonly ch: string;
    readonly advancePx: number;
    readonly bearingXPx: number;
    readonly bearingYPx: number;
    readonly widthPx: number;
    readonly heightPx: number;
}>;
/**
 * Pack measured glyphs into atlas rects (shelf packing). Pure — no canvas.
 * Returns null if they cannot fit in maxAtlasSize².
 */
export declare function packGlyphRects(measured: readonly MeasuredGlyph[], options: Readonly<{
    readonly maxAtlasSize: number;
    readonly padPx: number;
    readonly lineHeightPx: number;
}>): {
    readonly width: number;
    readonly height: number;
    readonly glyphs: Map<string, GlyphMetrics>;
    readonly placements: ReadonlyArray<Readonly<{
        ch: string;
        x: number;
        y: number;
        w: number;
        h: number;
        m: MeasuredGlyph;
    }>>;
} | null;
/**
 * Measure + bake a white-on-transparent RGBA atlas.
 * Returns null when canvas 2D is unavailable or packing fails.
 */
export declare function bakeGlyphAtlas(options?: BakeGlyphAtlasOptions): GlyphAtlas | null;
/**
 * Look up a glyph; maps common missing substitutes.
 * Returns undefined when truly absent (caller may warn + skip).
 */
export declare function lookupGlyph(atlas: GlyphAtlas, ch: string): GlyphMetrics | undefined;
//# sourceMappingURL=glyphAtlas.d.ts.map