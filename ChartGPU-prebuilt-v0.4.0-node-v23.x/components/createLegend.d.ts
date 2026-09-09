import type { SeriesConfig } from '../config/types';
import type { ResolvedSeriesConfig } from '../config/OptionResolver';
import type { ThemeConfig } from '../themes/types';
export type LegendPosition = 'top' | 'bottom' | 'left' | 'right';
/** User or resolved series — legend only reads type/name/color/visible (+ pie slices). */
export type LegendSeriesInput = SeriesConfig | ResolvedSeriesConfig;
export interface Legend {
    update(series: ReadonlyArray<LegendSeriesInput>, theme: ThemeConfig): void;
    dispose(): void;
}
export declare function createLegend(container: HTMLElement, position?: LegendPosition, onSeriesToggle?: (seriesIndex: number, sliceIndex?: number) => void): Legend;
//# sourceMappingURL=createLegend.d.ts.map