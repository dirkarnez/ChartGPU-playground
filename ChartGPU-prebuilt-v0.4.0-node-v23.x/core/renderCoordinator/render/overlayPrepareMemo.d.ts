/**
 * Overlay prepare memoization (P1-6).
 *
 * Grid and axis geometry only change when layout, counts, colors, scale affines,
 * or axis config change. When the memo signature matches the previous frame,
 * `prepareOverlays` skips grid/axis prepare (avoiding vertex rebuild + writeBuffer).
 * Crosshair and highlight always re-prepare (pointer-driven).
 *
 * @module overlayPrepareMemo
 */
import type { AxisConfig } from '../../../config/types';
import type { ContinuousScale, LinearScale } from '../../../utils/scales';
import type { GridArea } from '../../../renderers/createGridRenderer';
/** Compact layout + grid line inputs that affect grid vertex/color uploads. */
interface GridPrepareSignature {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
    readonly canvasWidth: number;
    readonly canvasHeight: number;
    readonly devicePixelRatio: number;
    readonly horizontalCount: number;
    readonly verticalCount: number;
    readonly horizontalColor: string;
    readonly verticalColor: string;
    readonly show: boolean;
    /** Tick-aligned clip Y positions (log grid); empty when even-count. */
    readonly horizontalClipYs: readonly number[];
    /** Tick-aligned clip X positions (log grid); empty when even-count. */
    readonly verticalClipXs: readonly number[];
    readonly xScaleKind: 'linear' | 'log';
    readonly yScaleKind: 'linear' | 'log';
    readonly logBase: number;
}
/** Compact axis inputs that affect axis vertex/color uploads. */
interface AxisPrepareSignature {
    readonly orientation: 'x' | 'y';
    readonly axisId: string;
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
    readonly canvasWidth: number;
    readonly canvasHeight: number;
    readonly devicePixelRatio: number;
    /** Affine sample: scale.scale(0) — linear; log uses domain endpoints via scaleKind. */
    readonly scaleAt0: number;
    /** Affine sample: scale.scale(1) */
    readonly scaleAt1: number;
    readonly scaleKind: 'linear' | 'log';
    readonly scaleBase: number;
    readonly domainMin: number;
    readonly domainMax: number;
    readonly tickCount: number;
    /**
     * Explicit tick domain values (e.g. nice time ticks). Empty when using linear-from-count only.
     * Must be compared element-wise so mark positions stay aligned with DOM labels.
     */
    readonly tickValues: readonly number[];
    readonly tickLength: number | undefined;
    readonly position: string | undefined;
    readonly min: number | undefined;
    readonly max: number | undefined;
    readonly axisLineColor: string;
    readonly axisTickColor: string;
}
/**
 * Mutable memo held by the coordinator across frames.
 * `prepareOverlays` updates these after a successful prepare (or when skipping).
 */
export interface OverlayPrepareMemo {
    grid: GridPrepareSignature | null;
    xAxis: AxisPrepareSignature | null;
    /** Keyed by y-axis id. */
    yAxes: Map<string, AxisPrepareSignature>;
}
export declare function createOverlayPrepareMemo(): OverlayPrepareMemo;
/** Reset memo (e.g. on dispose or hard layout invalidation). */
export declare function clearOverlayPrepareMemo(memo: OverlayPrepareMemo): void;
export declare function buildGridPrepareSignature(input: {
    readonly gridArea: GridArea;
    readonly show: boolean;
    readonly horizontalCount: number;
    readonly verticalCount: number;
    readonly horizontalColor: string;
    readonly verticalColor: string;
    readonly horizontalClipYs?: readonly number[];
    readonly verticalClipXs?: readonly number[];
    readonly xScaleKind?: 'linear' | 'log';
    readonly yScaleKind?: 'linear' | 'log';
    readonly logBase?: number;
}): GridPrepareSignature;
export declare function gridPrepareSignaturesEqual(a: GridPrepareSignature | null, b: GridPrepareSignature): boolean;
export declare function buildAxisPrepareSignature(input: {
    readonly axisConfig: AxisConfig;
    readonly scale: ContinuousScale | LinearScale;
    readonly orientation: 'x' | 'y';
    readonly axisId: string;
    readonly gridArea: GridArea;
    readonly axisLineColor: string;
    readonly axisTickColor: string;
    readonly tickCount: number;
    /** Explicit tick domain values; omit or empty for linear-from-count axes. */
    readonly tickValues?: readonly number[];
}): AxisPrepareSignature;
export declare function axisPrepareSignaturesEqual(a: AxisPrepareSignature | null | undefined, b: AxisPrepareSignature): boolean;
export {};
//# sourceMappingURL=overlayPrepareMemo.d.ts.map