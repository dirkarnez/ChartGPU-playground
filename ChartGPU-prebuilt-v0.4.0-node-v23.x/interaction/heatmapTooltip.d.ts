/**
 * Pure heatmap tooltip helpers (unit-testable without WebGPU).
 */
import type { TooltipParams } from '../config/types';
import type { HeatmapNullHandling } from '../config/types';
import type { HeatmapColormap } from '../config/types';
import type { HeatmapData } from '../config/types';
import { type HeatmapCellAnchor } from '../utils/heatmapLayout';
export type HeatmapTooltipSeries = Readonly<{
    readonly name?: string;
    readonly data: HeatmapData;
    readonly cellAnchor: HeatmapCellAnchor;
    readonly nullHandling: HeatmapNullHandling;
    readonly zMin: number;
    readonly zMax: number;
    readonly zScale: 'linear' | 'log';
    readonly colormap: HeatmapColormap;
    readonly drawable?: boolean;
    readonly visible?: boolean;
}>;
/**
 * Resolve a heatmap cell under data-space (x,y) into tooltip params.
 * Returns null when outside the grid, non-drawable, or transparent+non-finite z.
 */
export declare function resolveHeatmapTooltipParams(series: HeatmapTooltipSeries, seriesIndex: number, dataX: number, dataY: number): TooltipParams | null;
//# sourceMappingURL=heatmapTooltip.d.ts.map