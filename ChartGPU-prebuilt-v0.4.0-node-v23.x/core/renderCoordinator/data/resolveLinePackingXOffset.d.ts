/**
 * Time-axis packing origin for line DataStore uploads.
 *
 * Shared by GPU-decimation and CPU prepare paths so FIFO time-axis offset
 * cannot drift between branches after the original oldest sample is dropped.
 *
 * @module resolveLinePackingXOffset
 * @internal
 */
import { type CoordinatorCartesianData } from '../../../data/cartesianData';
import type { DataStore } from '../../../data/createDataStore';
type ResolveLinePackingXOffsetInput = {
    readonly data: CoordinatorCartesianData;
    readonly dataStore: Pick<DataStore, 'getSeriesXOffset'>;
    readonly seriesIndex: number;
    readonly xAxisType: string | undefined;
};
/**
 * Resolve the xOffset used for pack/setSeries and the line VS affine.
 */
export declare function resolveLinePackingXOffset(input: ResolveLinePackingXOffsetInput): {
    readonly packingXOffset: number;
    readonly xOffset: number;
};
export {};
//# sourceMappingURL=resolveLinePackingXOffset.d.ts.map