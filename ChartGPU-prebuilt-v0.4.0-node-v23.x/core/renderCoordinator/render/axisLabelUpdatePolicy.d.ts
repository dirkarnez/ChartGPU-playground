/**
 * Pure helpers for axis label rebuild / position-only update policy (WS4).
 *
 * @module axisLabelUpdatePolicy
 * @internal
 */
type AxisLabelUpdateDecisionInput = {
    readonly lastFullSignature: string;
    readonly lastContentSignature: string;
    readonly nextFullSignature: string;
    readonly nextContentSignature: string;
    readonly nowMs: number;
    readonly lastUpdateMs: number;
    /** Previous content tick-hash segment (`th:…`) for tick-set detection; empty when unknown. */
    readonly lastTickHashSegment?: string;
    readonly nextTickHashSegment?: string;
};
type AxisLabelUpdateDecision = {
    readonly shouldUpdate: boolean;
    readonly positionOnly: boolean;
    readonly contentChanged: boolean;
    readonly epochChanged: boolean;
    readonly tickSetChanged: boolean;
    readonly reason: 'first' | 'position-only' | 'epoch' | 'tick-set' | 'structural-throttle' | 'skip-throttle' | 'unchanged';
};
/**
 * Decide whether to rebuild axis labels this paint.
 *
 * - **Position-only** (content same, affine/full changed): every paint.
 * - **Tick set / epoch change**: immediate (no throttle) so labels stay in sync with GPU ticks/grid.
 * - **Other structural** (theme/layout thrash without tick change): may throttle ~50 ms.
 */
export declare function shouldUpdateAxisLabels(input: AxisLabelUpdateDecisionInput): AxisLabelUpdateDecision;
export {};
//# sourceMappingURL=axisLabelUpdatePolicy.d.ts.map