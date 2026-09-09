/**
 * Pure hit-test for error-bar series (stem + caps in domain space, pad in CSS px).
 */
import type { ResolvedErrorBarSeriesConfig } from '../config/OptionResolver';
import { type ErrorBarPoint } from '../data/errorBarData';
import type { ContinuousScale } from '../utils/scales';
export type ErrorBarHitMatch = Readonly<{
    readonly seriesIndex: number;
    readonly dataIndex: number;
    readonly point: ErrorBarPoint;
    readonly series: ResolvedErrorBarSeriesConfig;
}>;
/**
 * Hit-test error bars under a pointer in plot CSS coordinates.
 * Prefer later series indices when multiple series are provided (caller orders).
 */
export declare function findErrorBarAtPointer(seriesList: ReadonlyArray<{
    readonly seriesIndex: number;
    readonly series: ResolvedErrorBarSeriesConfig;
}>, plotXCss: number, plotYCss: number, xScale: ContinuousScale, yScale: ContinuousScale, plotSizeCss: {
    readonly width: number;
    readonly height: number;
}, options?: {
    readonly padCssPx?: number;
}): ErrorBarHitMatch | null;
//# sourceMappingURL=findErrorBar.d.ts.map