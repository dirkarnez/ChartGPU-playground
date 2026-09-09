/**
 * Pure hit-test for impulse / stem series (vertical stem + optional marker).
 */
import type { ResolvedImpulseSeriesConfig } from '../config/OptionResolver';
import type { ContinuousScale } from '../utils/scales';
export type ImpulseHitMatch = Readonly<{
    readonly seriesIndex: number;
    readonly dataIndex: number;
    readonly x: number;
    readonly y: number;
    readonly baseline: number;
    readonly series: ResolvedImpulseSeriesConfig;
}>;
/**
 * Hit-test impulse stems under a pointer in plot CSS coordinates.
 * Prefer later series indices when multiple series are provided.
 */
export declare function findImpulseAtPointer(seriesList: ReadonlyArray<{
    readonly seriesIndex: number;
    readonly series: ResolvedImpulseSeriesConfig;
}>, plotXCss: number, plotYCss: number, xScale: ContinuousScale, yScale: ContinuousScale, plotSizeCss: {
    readonly width: number;
    readonly height: number;
}, options?: {
    readonly padCssPx?: number;
}): ImpulseHitMatch | null;
//# sourceMappingURL=findImpulse.d.ts.map