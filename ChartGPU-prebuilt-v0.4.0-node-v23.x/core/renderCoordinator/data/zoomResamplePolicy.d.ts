/**
 * Zoom re-sample scheduling policy (M4).
 *
 * Period=1 honesty: continuous zoom must recompute CPU samples on the next flush
 * rather than debouncing ~100ms while interim frames present a slice of prior
 * full-span samples as the zoomed window.
 *
 * @module zoomResamplePolicy
 * @internal
 */
/**
 * Action taken when the zoom range changes.
 * - `immediate`: mark resample due and schedule flush (period=1).
 * - `debounce`: arm a timer (forbidden for present-fidelity).
 */
type ZoomResampleScheduleAction = {
    readonly kind: 'immediate';
} | {
    readonly kind: 'debounce';
    readonly ms: number;
};
/**
 * Pure policy: how zoom range changes schedule honest CPU re-sampling.
 * Always `immediate` (period=1). Multi-frame debounce is a G2 violation.
 */
export declare function zoomResampleScheduleAction(): ZoomResampleScheduleAction;
/**
 * Apply a zoom re-sample schedule action to coordinator state.
 *
 * **Period=1 contract:** only the `immediate` branch is legal. A `debounce`
 * action throws — callers must never reintroduce timer-based multi-frame lag.
 * This function never calls `setTimeout` (behavioral lock for tests).
 */
export declare function applyZoomResampleScheduleAction(action: ZoomResampleScheduleAction, state: {
    zoomResampleDue: boolean;
}, scheduleFlush: () => void): void;
export {};
//# sourceMappingURL=zoomResamplePolicy.d.ts.map