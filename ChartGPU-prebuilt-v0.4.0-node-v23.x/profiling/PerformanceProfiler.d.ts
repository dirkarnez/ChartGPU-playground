/**
 * PerformanceProfiler - lightweight span-based performance profiler for ChartGPU.
 *
 * Records named timing spans with category tagging, counter time-series, and
 * exports to the Chrome DevTools Trace Event Format for visualisation with
 * chrome://tracing or Perfetto UI.
 *
 * Design principles:
 * - Zero dependencies beyond the browser Performance API
 * - Functional-first API (createProfiler / measure / record*)
 * - No-op when disabled so production bundles pay no overhead
 * - Circular span buffer to bound memory usage at configurable capacity
 */
import type { ProfilerSnapshot, TraceExport } from './types';
/**
 * Opaque handle returned by {@link createProfiler}.
 * Pass to every profiling function.
 */
export interface ProfilerHandle {
    readonly id: symbol;
}
/**
 * Options for {@link createProfiler}.
 */
export interface ProfilerOptions {
    /**
     * Whether profiling is active.
     * When false all calls are no-ops and no allocations occur.
     * Default: true.
     */
    readonly enabled?: boolean;
    /**
     * Maximum number of completed spans to retain in the circular buffer.
     * Older spans are overwritten when the buffer is full.
     * Default: 10 000.
     */
    readonly maxSpans?: number;
    /**
     * Maximum number of counter samples to retain.
     * Default: 5 000.
     */
    readonly maxCounters?: number;
}
/**
 * Creates a new profiler instance.
 *
 * @example
 * ```ts
 * const profiler = createProfiler({ enabled: true });
 *
 * const token = beginSpan(profiler, 'renderFrame', 'render');
 * // ... do work ...
 * endSpan(profiler, token);
 *
 * console.log(getSnapshot(profiler).stats);
 * ```
 */
export declare function createProfiler(options?: ProfilerOptions): ProfilerHandle;
/**
 * Destroys the profiler and frees internal state.
 */
export declare function destroyProfiler(handle: ProfilerHandle): void;
/**
 * Opens a span and returns an opaque scope token.
 * Call {@link endSpan} with the token to close the span.
 *
 * @returns Scope token — pass to {@link endSpan}.
 */
export declare function beginSpan(handle: ProfilerHandle, name: string, cat: string, args?: Readonly<Record<string, string | number | boolean>>): symbol;
/**
 * Closes an open span identified by its scope token.
 * Silently ignores unknown / already-closed tokens.
 */
export declare function endSpan(handle: ProfilerHandle, token: symbol): void;
/**
 * Records a complete span in a single call (no open/close token required).
 *
 * @example
 * ```ts
 * const t0 = performance.now();
 * doWork();
 * recordSpan(profiler, 'doWork', 'render', t0, performance.now());
 * ```
 */
export declare function recordSpan(handle: ProfilerHandle, name: string, cat: string, startMs: number, endMs: number, args?: Readonly<Record<string, string | number | boolean>>): void;
/**
 * Measures a synchronous function and records a span around it.
 *
 * @example
 * ```ts
 * const result = measure(profiler, 'computeLayout', 'render', () => computeLayout(data));
 * ```
 */
export declare function measure<T>(handle: ProfilerHandle, name: string, cat: string, fn: () => T, args?: Readonly<Record<string, string | number | boolean>>): T;
/**
 * Measures an async function and records a span around it.
 *
 * @example
 * ```ts
 * const buffer = await measureAsync(profiler, 'gpuMapRead', 'gpu', () => buffer.mapAsync(GPUMapMode.READ));
 * ```
 */
export declare function measureAsync<T>(handle: ProfilerHandle, name: string, cat: string, fn: () => Promise<T>, args?: Readonly<Record<string, string | number | boolean>>): Promise<T>;
/**
 * Records a counter sample (a named scalar value at a point in time).
 * Useful for tracking GPU buffer sizes, active series counts, etc.
 *
 * @example
 * ```ts
 * recordCounter(profiler, 'gpuBufferBytes', totalGPUBytes);
 * ```
 */
export declare function recordCounter(handle: ProfilerHandle, name: string, value: number): void;
/**
 * Returns an immutable snapshot of all recorded data including aggregated statistics.
 */
export declare function getSnapshot(handle: ProfilerHandle): ProfilerSnapshot;
/**
 * Clears all recorded spans and counters without destroying the profiler.
 */
export declare function clearProfiler(handle: ProfilerHandle): void;
/**
 * Exports all recorded spans as a Chrome DevTools Trace Event Format JSON object.
 *
 * The returned object can be serialised with `JSON.stringify` and loaded into
 * chrome://tracing or Perfetto UI for flame-graph visualisation.
 *
 * @example
 * ```ts
 * const trace = exportTrace(profiler);
 * const json = JSON.stringify(trace, null, 2);
 * // Save to file or copy to clipboard for chrome://tracing
 * ```
 */
export declare function exportTrace(handle: ProfilerHandle, metadata?: Readonly<Record<string, string | number>>): TraceExport;
/**
 * Serialises the trace to a JSON string ready for saving to disk or clipboard.
 * Load the resulting file in chrome://tracing or https://ui.perfetto.dev.
 */
export declare function exportTraceJSON(handle: ProfilerHandle, metadata?: Readonly<Record<string, string | number>>): string;
//# sourceMappingURL=PerformanceProfiler.d.ts.map