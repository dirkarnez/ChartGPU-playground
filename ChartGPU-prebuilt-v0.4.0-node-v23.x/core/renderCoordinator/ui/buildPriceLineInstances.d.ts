/**
 * Build GPU reference-line instances for the exchange-style last-price line.
 *
 * Coordinator-owned (not user annotations): merge into `linesAbove` **before**
 * setting `referenceLineAboveCount` and a single `prepare()`.
 *
 * Coordinate contract: canvas-local CSS px Y (no container offset) — same as
 * `ReferenceLineInstance` / processAnnotations lineY path.
 *
 * OOD policy (K8):
 * - `clamp`: always draw at **true** data Y; plot scissor clips if outside
 * - `hide`: omit the line when close is outside the Y domain
 *
 * @module buildPriceLineInstances
 */
import type { ContinuousScale } from '../../../utils/scales';
import type { ReferenceLineInstance } from '../../../renderers/createReferenceLineRenderer';
import type { LastCandleState } from './priceLabelHelpers';
type BuildPriceLineInstancesArgs = Readonly<{
    /** null → no line (empty / non-finite last candle). */
    readonly last: LastCandleState | null;
    /**
     * When false, return []. Caller should pass `resolved.show && resolved.showLine`
     * so show:false never draws a line.
     */
    readonly showLine: boolean;
    readonly outOfDomain: 'clamp' | 'hide';
    /** Clip-space Y scale for the series' yAxis (`currentYScales`). */
    readonly yScale: ContinuousScale;
    /**
     * Canvas CSS height for clip→canvas conversion.
     * Prefer device-pixel-derived size (annotation path) — no offsetLeft/Top.
     */
    readonly canvasCssHeight: number;
    readonly lineWidth: number;
    /**
     * Optional CSS override for the **line** only (badge stays direction color).
     * null → use `last.directionColor`.
     */
    readonly lineColor: string | null;
}>;
/**
 * Pure builder: 0 or 1 horizontal ReferenceLineInstance at last close.
 *
 * Does **not** inject into user `annotations[]`. Color via `parseCssColorToRgba01`
 * from `lineColor` then direction, then white fallback.
 */
export declare function buildPriceLineInstances(args: BuildPriceLineInstancesArgs): ReferenceLineInstance[];
export {};
//# sourceMappingURL=buildPriceLineInstances.d.ts.map