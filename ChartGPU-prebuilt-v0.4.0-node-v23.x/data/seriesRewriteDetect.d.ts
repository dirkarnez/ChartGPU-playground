/**
 * Detect full-series rewrite shapes for setOption fast paths.
 *
 * Used when harnesses regenerate a new data array every frame (e.g. scatter /
 * sorted-Y update stress paths). Detection must not false-positive Brownian scatter (x and y
 * both change) as y-only.
 *
 * @module seriesRewriteDetect
 * @internal
 */
import type { CartesianSeriesData, DataPoint } from '../config/types';
/**
 * True when every finite x equals its index (0..n-1) within a tight epsilon.
 * Matches index-sorted x (`x = i`) without matching Brownian scatter.
 *
 * Always fully verifies all points after a cheap endpoints/mid reject (plan 1.1:
 * no false positives for indexSorted O(k) remap or O(1) axis extents). Empty
 * series returns false.
 *
 * Cost: O(1) sample reject + O(n) full scan when samples pass.
 */
export declare function isIndexSortedX(data: CartesianSeriesData): boolean;
/** Kind of equal-N y-only rewrite, or `false` when not applicable. */
export type EqualNYOnlyKind = false | 'indexSorted' | 'equalX';
/**
 * Cheap multi-probe check that x looks like index (endpoints + quartiles).
 * Not a full proof — used for reject and sticky continuity only.
 */
export declare function sampleLooksIndexSortedX(data: CartesianSeriesData): boolean;
/**
 * Full x-channel fingerprint for sticky index-sorted continuity (issue 1.6).
 * O(n) over every finite x — sticky may skip `isIndexSortedX` only when this
 * matches the prior proven frame. Five quartile probes alone are not enough
 * for LTTB remap (interior mutations would freeze wrong indices).
 */
export declare function indexSortedXFingerprint(data: CartesianSeriesData): number;
/**
 * Classify equal-length y-only rewrites.
 *
 * - `indexSorted`: both series are `x = i` — safe for O(k)
 *   LTTB sample y-remap via {@link remapIndexSortedSampleY}
 * - `equalX`: every x matches prev but not index-sorted — y-only GPU pack OK;
 *   must not use index-as-x sample remap
 * - `false`: length mismatch, empty, or any x change (group 2 Brownian)
 *
 * Cost:
 * - Cheap sample reject always
 * - Cold path: one full O(n) `isIndexSortedX(next)` when samples look index-sorted
 * - Sticky path (`prevIndexSortedProven`): when a prior resolve fully proved x=i at
 *   the same N and samples still look index-sorted on both sides, skip re-scan.
 *   Sticky is cleared by length change, sample reject, or non-indexSorted classify.
 */
export declare function classifyEqualNYOnlyRewrite(prev: CartesianSeriesData | null | undefined, next: CartesianSeriesData, options?: Readonly<{
    prevIndexSortedProven?: boolean;
    /** Prior frame x fingerprint; sticky requires a match on `next`. */
    prevIndexSortedFingerprint?: number;
}>): EqualNYOnlyKind;
/**
 * Equal-length rewrite where every x matches `prev` (or both are `x = i`).
 * Y may differ. Empty / length mismatch / missing prev → false.
 *
 * Single boolean gate for tests; see {@link classifyEqualNYOnlyRewrite} for kind.
 */
export declare function isEqualNSortedXYOnlyRewrite(prev: CartesianSeriesData | null | undefined, next: CartesianSeriesData): boolean;
/**
 * Compare x channel of `next` against interleaved staging `[x0,y0,x1,y1,...]`
 * packed with the same `xOffset`. Returns true only when lengths match and every
 * finite x equals the prior packed x (y may differ).
 *
 * Used for y-only GPU rewrites without false-positiving Brownian xy updates.
 */
export declare function isYOnlyRewriteAgainstStaging(next: CartesianSeriesData, staging: Float32Array, pointCount: number, xOffset: number): boolean;
/**
 * Compare x of `next` against a packed per-point x staging (const-radius dual
 * buffer). Lengths must match; y is ignored.
 *
 * Cheap multi-probe reject first (group 2 Brownian fails without full O(n) scan),
 * then full verification.
 */
export declare function isYOnlyRewriteAgainstXStaging(next: CartesianSeriesData, xStaging: Float32Array, pointCount: number): boolean;
/**
 * Pack only the y channel into an existing interleaved staging buffer, leaving
 * x (and any padding beyond `pointCount`) untouched. `out` must already hold
 * valid x values for `pointCount` points.
 *
 * Returns `true` if any y float actually changed (issue 2.1: skip full FNV when
 * y-only already proved a content change; skip GPU write when y is identical).
 */
export declare function packYOnlyInto(out: Float32Array, src: CartesianSeriesData, pointCount: number): boolean;
/**
 * Pack only y into a dense y staging buffer (dual-buffer scatter const-radius).
 *
 * Returns:
 * - `true` if any y float changed
 * - `false` if every y is identical (skip GPU write)
 * - `null` if any y is non-finite (caller must fall through to full sparse pack)
 */
export declare function packYOnlyChannel(out: Float32Array, src: CartesianSeriesData, pointCount: number): boolean | null;
/**
 * For index-sorted (`x = i`) equal-N y-only rewrites under **LTTB** sampling:
 * rebuild a prior LTTB sample in O(k) by re-reading y at each retained x index.
 * Avoids full O(N) re-sampling every frame when only y changed on index-sorted x.
 *
 * Freezes the prior LTTB index set (approximate hold — newly emerging extrema
 * between retained indices will not appear until a full LTTB resumes on
 * length/x/sampling config change).
 *
 * `prevSampled` x values are treated as raw indices (rounded). Returns null when
 * any index is out of range (caller falls back to full sample).
 */
export declare function remapIndexSortedSampleY(prevSampled: CartesianSeriesData, nextRaw: CartesianSeriesData): DataPoint[] | null;
//# sourceMappingURL=seriesRewriteDetect.d.ts.map