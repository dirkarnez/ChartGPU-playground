/**
 * Coalesce `device.queue.submit` across ChartGPU instances that share one
 * GPUDevice (multi-chart dashboards sharing one device).
 *
 * Without batching, N charts → N queue.submit calls per frame. WebGPU drivers
 * pay non-trivial validation / fence cost per submit; a single microtask-batched
 * submit([cb0..cbN]) amortizes multi-surface present cost.
 *
 * **Submit is deferred** to a `queueMicrotask` after `renderFrame()` / `render()`
 * returns. Callers that need GPU work on the queue before
 * `device.queue.onSubmittedWorkDone()` must either:
 * - `await Promise.resolve()` once after the last `renderFrame()` in the turn, or
 * - call {@link flushDeviceSubmit}(device) explicitly.
 *
 * Order is preserved: buffers are submitted FIFO in the order charts finished
 * encoding. DataStore self-submits (buffer growth copies) remain independent and
 * still happen before render encodes, so queue order stays correct.
 *
 * Dispose **must** {@link flushDeviceSubmit} before destroying GPU resources so a
 * pending microtask cannot submit command buffers that reference freed textures.
 *
 * Series buffer growth uses {@link destroyBufferAfterSubmit} so replacing a buffer
 * does not force an immediate multi-chart submit flush — destroy waits until after
 * any pending batched command buffers that may still reference the old buffer.
 *
 * Lives under `src/core/gpu/` (neutral layer) so both DataStore and
 * RenderCoordinator can depend on it without inverting data → renderCoordinator.
 *
 * @module submitBatcher
 * @internal
 */
/**
 * Enqueue a finished command buffer for the next batched submit on this device.
 * Flushes via `queueMicrotask` so all `renderFrame()` calls in the same JS turn
 * (multi-chart harness phase-2 loop) collapse into one `queue.submit`.
 */
export declare function enqueueDeviceSubmit(device: GPUDevice, commandBuffer: GPUCommandBuffer): void;
/**
 * Immediately submit any pending buffers for the device and cancel the pending
 * microtask drain (via epoch bump). Also destroys any buffers queued via
 * {@link destroyBufferAfterSubmit}, even when no command buffers are pending.
 *
 * Required on chart dispose before destroying textures/buffers, and for callers
 * that need synchronous queue visibility after encode.
 */
export declare function flushDeviceSubmit(device: GPUDevice): void;
/**
 * Destroy `buffer` immediately if no command buffers are pending submit for
 * this device; otherwise queue destroy until after the next batched submit
 * (or flushDeviceSubmit). Preserves multi-chart submit coalescing while
 * avoiding use-after-destroy on pending CBs.
 */
export declare function destroyBufferAfterSubmit(device: GPUDevice, buffer: GPUBuffer): void;
/** Test helper: pending command-buffer count for a device (0 if none). */
export declare function getPendingSubmitCountForTests(device: GPUDevice): number;
/** Test helper: number of buffers deferred for destroy on this device. */
export declare function getDeferredDestroyCountForTests(device: GPUDevice): number;
//# sourceMappingURL=submitBatcher.d.ts.map