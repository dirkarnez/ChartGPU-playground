import type { AreaStyleConfig, AnnotationConfig, AxisConfig, CandlestickItemStyleConfig, CandlestickSeriesConfig, CandlestickStyle, OhlcSeriesConfig, ChartGPUOptions, GridConfig, LineStyleConfig, AreaSeriesConfig, BarSeriesConfig, LineSeriesConfig, PieDataItem, PieSeriesConfig, ScatterSeriesConfig, SeriesSampling, SeriesType, PerformanceLod, HeatmapSeriesConfig, HeatmapData, HeatmapColormap, HeatmapNullHandling, BandSeriesConfig, BandSeriesData, ErrorBarSeriesData, ErrorBarHlcArraysData, ErrorBarMode, ErrorBarDirection, ImpulseSeriesConfig, StepMode, CoordinateSystem, PointCloud3DData, Surface3DGridData } from './types';
import { type HeatmapCellAnchor } from '../utils/heatmapLayout';
import { type ResolvedCandlestickPriceLabel } from './resolvePriceLabel';
import type { ThemeConfig } from '../themes/types';
export type { ResolvedCandlestickPriceLabel } from './resolvePriceLabel';
export { resolvePriceLabel } from './resolvePriceLabel';
export { isCandlePrimaryChart, isFinanceOhlcSeriesType, isFinanceOhlcSeries } from './isCandlePrimaryChart';
export type { FinanceOhlcSeriesType } from './isCandlePrimaryChart';
export type ResolvedGridConfig = Readonly<Required<GridConfig>>;
export type ResolvedLineStyleConfig = Readonly<Required<Omit<LineStyleConfig, 'color'>> & {
    readonly color: string;
}>;
export type ResolvedAreaStyleConfig = Readonly<Required<Omit<AreaStyleConfig, 'color'>> & {
    readonly color: string;
}>;
/**
 * Resolved grid lines direction configuration with all defaults applied.
 */
export type ResolvedGridLinesDirectionConfig = Readonly<{
    readonly show: boolean;
    readonly count: number;
    readonly color: string;
}>;
/**
 * Resolved grid lines configuration with all defaults and color resolution applied.
 */
export type ResolvedGridLinesConfig = Readonly<{
    readonly show: boolean;
    readonly color: string;
    readonly opacity: number;
    readonly horizontal: ResolvedGridLinesDirectionConfig;
    readonly vertical: ResolvedGridLinesDirectionConfig;
}>;
export type RawBounds = Readonly<{
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
}>;
/**
 * How `rawBounds` was derived. Prevents sticky synthetic bounds when axes switch
 * from explicit min/max back to auto under a stable data ref.
 * @internal
 */
export type RawBoundsMode = 'synthetic' | 'xDataYAxis' | 'data';
export type ResolvedLineSeriesConfig = Readonly<Omit<LineSeriesConfig, 'color' | 'lineStyle' | 'areaStyle' | 'sampling' | 'samplingThreshold' | 'data' | 'connectNulls'> & {
    readonly connectNulls: boolean;
    readonly color: string;
    readonly lineStyle: ResolvedLineStyleConfig;
    readonly areaStyle?: ResolvedAreaStyleConfig;
    readonly sampling: SeriesSampling;
    readonly samplingThreshold: number;
    /** Original (unsampled) series data. */
    readonly rawData: Readonly<LineSeriesConfig['data']>;
    readonly data: Readonly<LineSeriesConfig['data']>;
    readonly yAxis: string;
    /**
     * Bounds computed from the original (unsampled) data. Used for axis auto-bounds so sampling
     * cannot clip outliers.
     */
    readonly rawBounds?: RawBounds;
    /** @internal How rawBounds was derived (synthetic / xDataYAxis / data). */
    readonly rawBoundsMode?: RawBoundsMode;
}>;
export type ResolvedAreaSeriesConfig = Readonly<Omit<AreaSeriesConfig, 'color' | 'areaStyle' | 'sampling' | 'samplingThreshold' | 'data' | 'connectNulls'> & {
    readonly connectNulls: boolean;
    readonly color: string;
    readonly areaStyle: ResolvedAreaStyleConfig;
    readonly sampling: SeriesSampling;
    readonly samplingThreshold: number;
    /** Original (unsampled) series data (see `ResolvedLineSeriesConfig.rawData`). */
    readonly rawData: Readonly<AreaSeriesConfig['data']>;
    readonly data: Readonly<AreaSeriesConfig['data']>;
    readonly yAxis: string;
    /**
     * Bounds computed from the original (unsampled) data. Used for axis auto-bounds so sampling
     * cannot clip outliers.
     */
    readonly rawBounds?: RawBounds;
    /** @internal How rawBounds was derived (synthetic / xDataYAxis / data). */
    readonly rawBoundsMode?: RawBoundsMode;
}>;
export type ResolvedBarSeriesConfig = Readonly<Omit<BarSeriesConfig, 'color' | 'sampling' | 'samplingThreshold' | 'data'> & {
    readonly color: string;
    readonly sampling: SeriesSampling;
    readonly samplingThreshold: number;
    /** Original (unsampled) series data (see `ResolvedLineSeriesConfig.rawData`). */
    readonly rawData: Readonly<BarSeriesConfig['data']>;
    readonly data: Readonly<BarSeriesConfig['data']>;
    readonly yAxis: string;
    /**
     * Bounds computed from the original (unsampled) data. Used for axis auto-bounds so sampling
     * cannot clip outliers.
     */
    readonly rawBounds?: RawBounds;
    /** @internal How rawBounds was derived (synthetic / xDataYAxis / data). */
    readonly rawBoundsMode?: RawBoundsMode;
}>;
export type ResolvedScatterSeriesConfig = Readonly<Omit<ScatterSeriesConfig, 'color' | 'sampling' | 'samplingThreshold' | 'data' | 'mode' | 'binSize' | 'densityColormap' | 'densityNormalization'> & {
    readonly color: string;
    readonly sampling: SeriesSampling;
    readonly samplingThreshold: number;
    readonly mode: NonNullable<ScatterSeriesConfig['mode']>;
    readonly binSize: number;
    readonly densityColormap: NonNullable<ScatterSeriesConfig['densityColormap']>;
    readonly densityNormalization: NonNullable<ScatterSeriesConfig['densityNormalization']>;
    /** Original (unsampled) series data (see `ResolvedLineSeriesConfig.rawData`). */
    readonly rawData: Readonly<ScatterSeriesConfig['data']>;
    readonly data: Readonly<ScatterSeriesConfig['data']>;
    readonly yAxis: string;
    /**
     * Bounds computed from the original (unsampled) data. Used for axis auto-bounds so sampling
     * cannot clip outliers.
     */
    readonly rawBounds?: RawBounds;
    /**
     * @internal Full O(n) proved that raw data is x=i at {@link indexSortedPointCount}.
     * Sticky across equal-N y-only rewrites so subsequent frames skip re-proving.
     */
    readonly indexSortedProven?: boolean;
    /** @internal Point count when {@link indexSortedProven} was set. */
    readonly indexSortedPointCount?: number;
    /** @internal X fingerprint when {@link indexSortedProven} was set (issue 1.6). */
    readonly indexSortedFingerprint?: number;
    /** @internal How rawBounds was derived (synthetic / xDataYAxis / data). */
    readonly rawBoundsMode?: RawBoundsMode;
}>;
export type ResolvedPieDataItem = Readonly<Omit<PieDataItem, 'color' | 'visible'> & {
    readonly color: string;
    readonly visible: boolean;
}>;
export type ResolvedPieSeriesConfig = Readonly<Omit<PieSeriesConfig, 'color' | 'data'> & {
    readonly color: string;
    readonly data: ReadonlyArray<ResolvedPieDataItem>;
}>;
export type ResolvedHeatmapSeriesConfig = Readonly<Omit<HeatmapSeriesConfig, 'data' | 'colormap' | 'zMin' | 'zMax' | 'zScale' | 'opacity' | 'cellAnchor' | 'nullHandling' | 'cellGapPx' | 'color'> & {
    readonly type: 'heatmap';
    readonly data: HeatmapData;
    readonly colormap: HeatmapColormap;
    readonly zMin: number;
    readonly zMax: number;
    /**
     * True when the user supplied **both** finite `zMin` and `zMax` on the series config.
     * Stream append must keep this fixed colormap domain (no auto expand-from-strip).
     */
    readonly zDomainExplicit: boolean;
    readonly zScale: 'linear' | 'log';
    readonly opacity: number;
    readonly cellAnchor: HeatmapCellAnchor;
    readonly nullHandling: HeatmapNullHandling;
    readonly cellGapPx: number;
    /** Palette fallback for legend/tooltip; not used for cell coloring. */
    readonly color: string;
    readonly yAxis: string;
    /**
     * Grid extent in data space for axis auto-bounds.
     * Always set for valid geometry; omitted only when series is empty/invalid.
     */
    readonly rawBounds?: RawBounds;
    /**
     * When false, renderer should skip draw (invalid geometry or empty drawCells).
     */
    readonly drawable: boolean;
    /** Expected cells = columns * rows after coercion. */
    readonly cellCount: number;
}>;
export type ResolvedBandSeriesConfig = Readonly<Omit<BandSeriesConfig, 'color' | 'lineStyle' | 'lineStyleY1' | 'areaStyle' | 'sampling' | 'samplingThreshold' | 'data' | 'connectNulls'> & {
    readonly type: 'band';
    readonly connectNulls: boolean;
    readonly color: string;
    /**
     * Stroke for y curve. **Undefined when user omitted `lineStyle`** (fill-only).
     * When present, width defaults to 1; width 0 / opacity 0 also hides.
     */
    readonly lineStyle?: ResolvedLineStyleConfig;
    /** Stroke for y1 curve; undefined when user omitted lineStyleY1. */
    readonly lineStyleY1?: ResolvedLineStyleConfig;
    readonly areaStyle: ResolvedAreaStyleConfig;
    readonly sampling: Exclude<SeriesSampling, 'ohlc'>;
    readonly samplingThreshold: number;
    readonly rawData: BandSeriesData;
    readonly data: BandSeriesData;
    readonly yAxis: string;
    readonly rawBounds?: RawBounds;
    /** @internal How rawBounds was derived. */
    readonly rawBoundsMode?: RawBoundsMode;
}>;
export type ResolvedCandlestickItemStyleConfig = Readonly<Required<CandlestickItemStyleConfig>>;
export type ResolvedCandlestickSeriesConfig = Readonly<Omit<CandlestickSeriesConfig, 'color' | 'style' | 'itemStyle' | 'barWidth' | 'barMinWidth' | 'barMaxWidth' | 'sampling' | 'samplingThreshold' | 'data' | 'priceLabel'> & {
    readonly color: string;
    readonly style: CandlestickStyle;
    readonly itemStyle: ResolvedCandlestickItemStyleConfig;
    readonly barWidth: number | string;
    readonly barMinWidth: number;
    readonly barMaxWidth: number;
    readonly sampling: 'none' | 'ohlc';
    readonly samplingThreshold: number;
    /** Resolved last-price badge / line (always attached on the non-reuse path). */
    readonly priceLabel: ResolvedCandlestickPriceLabel;
    /** Original (unsampled) series data. */
    readonly rawData: Readonly<CandlestickSeriesConfig['data']>;
    readonly data: Readonly<CandlestickSeriesConfig['data']>;
    readonly yAxis: string;
    /**
     * Bounds computed from the original (unsampled) data. Used for axis auto-bounds so sampling
     * cannot clip outliers.
     */
    readonly rawBounds?: RawBounds;
    /** @internal How rawBounds was derived (synthetic / xDataYAxis / data). */
    readonly rawBoundsMode?: RawBoundsMode;
}>;
/** Resolved thin OHLC bar series (shared itemStyle / sampling / priceLabel with candlestick). */
export type ResolvedOhlcSeriesConfig = Readonly<Omit<OhlcSeriesConfig, 'color' | 'itemStyle' | 'barWidth' | 'barMinWidth' | 'barMaxWidth' | 'stemWidth' | 'tickLength' | 'sampling' | 'samplingThreshold' | 'data' | 'priceLabel'> & {
    readonly color: string;
    readonly itemStyle: ResolvedCandlestickItemStyleConfig;
    readonly barWidth: number | string;
    readonly barMinWidth: number;
    readonly barMaxWidth: number;
    readonly stemWidth: number;
    readonly tickLength: number | string;
    readonly sampling: 'none' | 'ohlc';
    readonly samplingThreshold: number;
    readonly priceLabel: ResolvedCandlestickPriceLabel;
    readonly rawData: Readonly<OhlcSeriesConfig['data']>;
    readonly data: Readonly<OhlcSeriesConfig['data']>;
    readonly yAxis: string;
    readonly rawBounds?: RawBounds;
    readonly rawBoundsMode?: RawBoundsMode;
}>;
export type ResolvedErrorBarItemStyleConfig = Readonly<{
    readonly color: string;
    readonly borderWidth: number;
    readonly opacity: number;
}>;
/** Resolved error-bar series — data is always owned absolute HLC columns. */
export type ResolvedErrorBarSeriesConfig = Readonly<{
    readonly type: 'errorBar';
    readonly name?: string;
    readonly visible: boolean;
    readonly color: string;
    readonly itemStyle: ResolvedErrorBarItemStyleConfig;
    readonly capWidth: number | string;
    readonly errorMode: ErrorBarMode;
    readonly direction: ErrorBarDirection;
    readonly drawWhiskers: boolean;
    readonly drawConnector: boolean;
    readonly showCenter: boolean;
    readonly symbolSize: number;
    readonly sampling: 'none';
    /** Original user payload (may be relative). */
    readonly rawData: ErrorBarSeriesData;
    /** Owned absolute HLC columns after relative→absolute resolve. */
    readonly data: ErrorBarHlcArraysData;
    readonly yAxis: string;
    readonly rawBounds?: RawBounds;
    readonly rawBoundsMode?: RawBoundsMode;
}>;
/** Resolved impulse / stem series — XY cartesian + baseline + stem style. */
export type ResolvedImpulseSeriesConfig = Readonly<{
    readonly type: 'impulse';
    readonly name?: string;
    readonly visible: boolean;
    readonly color: string;
    readonly baseline: number;
    readonly lineStyle: ResolvedLineStyleConfig;
    readonly showMarker: boolean;
    readonly symbolSize: number;
    /** Sampling is `'none'` only (sparse event series). */
    readonly sampling: 'none';
    readonly rawData: Readonly<ImpulseSeriesConfig['data']>;
    readonly data: Readonly<ImpulseSeriesConfig['data']>;
    readonly yAxis: string;
    readonly rawBounds?: RawBounds;
    readonly rawBoundsMode?: RawBoundsMode;
}>;
export type ResolvedPointCloud3DSeriesConfig = Readonly<{
    readonly type: 'pointCloud3d';
    readonly name?: string;
    readonly visible: boolean;
    readonly data: PointCloud3DData;
    readonly color: string;
    readonly pointStyle: Readonly<{
        readonly size: number;
        readonly color: string;
        readonly opacity: number;
    }>;
    readonly colorBy?: Readonly<{
        readonly values?: ArrayLike<number>;
        readonly colormap: HeatmapColormap;
        readonly min?: number;
        readonly max?: number;
    }>;
    /** False when empty / undrawable. */
    readonly drawable: boolean;
}>;
export type ResolvedSurface3DSeriesConfig = Readonly<{
    readonly type: 'surface3d';
    readonly name?: string;
    readonly visible: boolean;
    readonly data: Surface3DGridData;
    readonly colormap: HeatmapColormap;
    readonly yMin: number;
    readonly yMax: number;
    /**
     * True when the user supplied both finite `yMin` and `yMax` on the series config.
     * Stream `replaceY` without update-level domain can skip full-field domain walks.
     */
    readonly yDomainExplicit: boolean;
    readonly wireframe: boolean;
    readonly opacity: number;
    readonly lighting: number;
    readonly color: string;
    readonly drawable: boolean;
    readonly contours: ResolvedSurface3DContours;
}>;
export type ResolvedSeriesConfig2D = ResolvedLineSeriesConfig | ResolvedAreaSeriesConfig | ResolvedBarSeriesConfig | ResolvedScatterSeriesConfig | ResolvedPieSeriesConfig | ResolvedCandlestickSeriesConfig | ResolvedOhlcSeriesConfig | ResolvedHeatmapSeriesConfig | ResolvedBandSeriesConfig | ResolvedErrorBarSeriesConfig | ResolvedImpulseSeriesConfig;
export type ResolvedSeriesConfig = ResolvedSeriesConfig2D | ResolvedPointCloud3DSeriesConfig | ResolvedSurface3DSeriesConfig;
/** True for classic 2D series (excludes pointCloud3d / surface3d). */
export declare function isResolvedSeries2D(s: ResolvedSeriesConfig): s is ResolvedSeriesConfig2D;
export type ResolvedPerformanceConfig = Readonly<{
    readonly lod: PerformanceLod;
}>;
export type ResolvedCamera3D = Readonly<{
    readonly type: 'perspective' | 'orthographic';
    readonly fovY: number;
    readonly near: number;
    readonly far: number;
    readonly eye?: readonly [number, number, number];
    readonly target?: readonly [number, number, number];
    readonly up: readonly [number, number, number];
    readonly orthoSize: number;
}>;
export type ResolvedInteraction3D = Readonly<{
    readonly orbit: boolean;
    readonly pan: boolean;
    readonly zoom: boolean;
    readonly orbitSpeed: number;
    readonly zoomSpeed: number;
    readonly panSpeed: number;
}>;
export type ResolvedAxis3D = Readonly<{
    readonly name: string;
    readonly type: 'value';
    readonly min?: number;
    readonly max?: number;
    readonly tickCount: number;
    readonly visible: boolean;
}>;
export type ResolvedAxes3D = Readonly<{
    readonly x: ResolvedAxis3D;
    readonly y: ResolvedAxis3D;
    readonly z: ResolvedAxis3D;
    /** @deprecated use x.name — kept for back-compat reads in tests/docs */
    readonly xName: string;
    readonly yName: string;
    readonly zName: string;
    readonly showBox: boolean;
    readonly showGrid: boolean;
    readonly labelMode: 'auto' | 'dom' | 'gpu';
}>;
export type ResolvedSurface3DContours = Readonly<{
    readonly show: boolean;
    readonly levels: number | readonly number[];
    readonly color: string;
    readonly width: number;
    readonly opacity: number;
}>;
export interface ResolvedChartGPUOptions extends Omit<ChartGPUOptions, 'grid' | 'gridLines' | 'xAxis' | 'yAxis' | 'axes' | 'theme' | 'palette' | 'series' | 'legend' | 'performance' | 'camera' | 'interaction3d' | 'axes3d' | 'coordinateSystem'> {
    readonly coordinateSystem: CoordinateSystem;
    readonly camera: ResolvedCamera3D;
    readonly interaction3d: ResolvedInteraction3D;
    readonly axes3d: ResolvedAxes3D;
    readonly grid: ResolvedGridConfig;
    readonly gridLines: ResolvedGridLinesConfig;
    readonly xAxis: AxisConfig;
    readonly yAxes: ReadonlyArray<AxisConfig>;
    readonly autoScroll: boolean;
    readonly theme: ThemeConfig;
    readonly palette: ReadonlyArray<string>;
    readonly series: ReadonlyArray<ResolvedSeriesConfig>;
    readonly annotations?: ReadonlyArray<AnnotationConfig>;
    readonly legend?: import('./types').LegendConfig;
    readonly performance: ResolvedPerformanceConfig;
}
/**
 * Normalize public `step` to resolved StepMode | undefined (linear when omitted).
 * `true` → `'after'`; invalid strings warn once and treat as linear.
 */
export declare function normalizeSeriesStep(step: boolean | StepMode | string | undefined | null, seriesIndex: number): StepMode | undefined;
/**
 * Optional reuse of a prior resolve result (P1-7).
 * When raw data refs + sampling config match, skip O(n) bounds scan and sampleSeriesDataPoints.
 *
 * `previousUserOptions` + `lastUserSeriesElements` enable full-series-array reuse when:
 * - each series **element** matches the prior snapshot (detects `series[i] = {...}`),
 * - theme/palette refs match.
 *
 * Treat the outer `series` array **and each series config object** as immutable for this
 * fast path. Element replace is detected; property mutation under a stable element
 * (e.g. `series[i].data = newData`, `series[i].priceLabel = …`) is **not** re-resolved
 * (same as per-series data-ref contract). Changing candlestick `priceLabel` requires a
 * **new series element reference**. Axes-only y-range rewrites typically re-pass the same
 * stored series objects.
 */
export type ResolveOptionsReuse = Readonly<{
    readonly previousResolved?: ResolvedChartGPUOptions | null;
    /**
     * Prior **user** options object from the last `setOption` / create (not resolved).
     * Full resolved-series reuse requires **per-element** identity (+ theme/palette
     * identity); the outer `series` array may be a new array wrapping the same elements.
     * When user `theme`/`palette` refs match, the prior **resolved** theme object is
     * also reused (stable identity for legend / chrome skip paths).
     */
    readonly previousUserOptions?: ChartGPUOptions | null;
    /**
     * Snapshot of user series **element** refs captured after the last resolve.
     * Required to detect `series[i] = newConfig` under a stable outer array identity.
     * ChartGPU maintains this; unit tests should pass it for false-positive coverage.
     */
    readonly lastUserSeriesElements?: ReadonlyArray<unknown> | null;
}>;
/**
 * Gate for wholesale resolved-series reuse (axes-only multi-series).
 *
 * Requires:
 * 1. previous resolved series present and same length
 * 2. previousUserOptions present with a series array
 * 3. theme + palette identity match
 * 4. each next series element matches `lastUserSeriesElements[i]` (preferred) or,
 *    when no snapshot, each element matches `previousUserOptions.series[i]`
 *    (covers a new outer array wrapping the same element objects)
 *
 * **Immutable series contract:** Treat the outer `series` array and each config
 * object as immutable for this path. Mutating `series[i].data` / colors /
 * `priceLabel` under a stable element object is still not detected (same as
 * per-series data-ref contract); replace the series element or the whole array
 * when content/style/priceLabel changes.
 */
export declare function canReuseEntireUserSeriesArray(input: {
    readonly previousResolvedSeries: ReadonlyArray<unknown> | null | undefined;
    readonly previousUserOptions: ChartGPUOptions | null | undefined;
    readonly userOptions: ChartGPUOptions;
    readonly lastUserSeriesElements?: ReadonlyArray<unknown> | null;
}): boolean;
/**
 * True when the previous resolved series can supply `data` + `rawBounds` without re-sampling.
 * Requires stable raw data reference, identical sampling-related config, and a matching
 * content hash.
 *
 * **In-place mutation contract:** Mutating point values under a stable data array / columns
 * object reference (without replacing the array) is not detected by resolve. Callers must
 * pass a new data reference (or use `appendData` / other explicit paths) to force a re-hash
 * and re-sample. This matches high-performance chart APIs and axes-only update patterns.
 */
export declare function canReuseResolvedSeriesSample(prev: ResolvedSeriesConfig | undefined, nextType: SeriesType, rawData: unknown, sampling: SeriesSampling | undefined, samplingThreshold: number | undefined, connectNulls: boolean | undefined, contentHash: number): boolean;
/**
 * Content hash for a series resolve, O(1) when raw data identity is stable.
 *
 * When `previousResolved` has the same raw data reference (`prev.rawData ?? prev.data`)
 * and a stored `contentHash`, reuse that hash without scanning points.
 *
 * When the data reference changes, callers should pass an O(1) stamp
 * (`cheapCartesianContentStamp` / `cheapOHLCContentStamp`) via `hashData` —
 * full float scans are not needed because identity-reuse requires a stable ref.
 *
 * **In-place mutation:** Values mutated under a stable array ref are not detected until
 * a new data reference is provided.
 */
export declare function resolveSeriesContentHash(prev: ResolvedSeriesConfig | undefined, nextType: SeriesType, rawData: unknown, hashData: () => number): number;
export declare function resolveOptions(userOptions?: ChartGPUOptions, reuse?: ResolveOptionsReuse): ResolvedChartGPUOptions;
/**
 * Resolves chart options with slider bottom-space reservation.
 *
 * This function wraps `resolveOptions()` and applies additional grid bottom spacing
 * when a slider-type dataZoom is configured. The reservation ensures x-axis labels
 * and ticks are visible above the slider overlay.
 *
 * **Usage**: Use this function instead of `resolveOptions()` when creating charts
 * to ensure consistent slider layout.
 *
 * @param userOptions - User-provided chart options
 * @returns Resolved options with slider bottom-space applied if needed
 */
export declare function resolveOptionsForChart(userOptions?: ChartGPUOptions, reuse?: ResolveOptionsReuse): ResolvedChartGPUOptions;
export declare const OptionResolver: {
    readonly resolve: typeof resolveOptions;
};
//# sourceMappingURL=OptionResolver.d.ts.map