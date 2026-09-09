import type { CandlestickStyle } from './types';
export declare const defaultGrid: {
    readonly left: 60;
    readonly right: 20;
    readonly top: 40;
    readonly bottom: 40;
};
/**
 * Soft grid gutter defaults for candle-primary charts (first series is candlestick).
 * Applied only when the corresponding `grid.left` / `grid.right` key is unset.
 * Left depends on whether any Y axis ends up on the left after position defaults.
 */
export declare const candlePrimaryGridDefaults: {
    /** No left-positioned Y (price on right only). */
    readonly leftNoLeftY: 20;
    /** At least one left-positioned Y (e.g. volume dual-Y). */
    readonly leftWithLeftY: 60;
    /**
     * Room for right-side price ladder labels + last-price badge.
     * ~70 was tight for 6-sig badge text (padding + tick) and clipped at the canvas edge.
     */
    readonly right: 80;
};
export declare const defaultPalette: readonly ["#5470C6", "#91CC75", "#FAC858", "#EE6666", "#73C0DE", "#3BA272", "#FC8452", "#9A60B4", "#EA7CCC"];
export declare const defaultLineStyle: {
    readonly width: 2;
    readonly opacity: 1;
};
export declare const defaultAreaStyle: {
    readonly opacity: 0.25;
};
export declare const candlestickDefaults: {
    readonly style: CandlestickStyle;
    readonly itemStyle: {
        readonly upColor: "#22c55e";
        readonly downColor: "#ef4444";
        readonly upBorderColor: "#22c55e";
        readonly downBorderColor: "#ef4444";
        readonly borderWidth: 1;
    };
    readonly barWidth: "80%";
    readonly barMinWidth: 1;
    readonly barMaxWidth: 50;
    readonly sampling: "ohlc";
    readonly samplingThreshold: 5000;
};
/** Defaults for thin OHLC bars (`type: 'ohlc'`). Sampling matches candlestick. */
export declare const ohlcDefaults: {
    readonly itemStyle: {
        readonly upColor: "#22c55e";
        readonly downColor: "#ef4444";
        readonly upBorderColor: "#22c55e";
        readonly downBorderColor: "#ef4444";
        readonly borderWidth: 1;
    };
    readonly barWidth: "60%";
    readonly barMinWidth: 1;
    readonly barMaxWidth: 50;
    /** Stem thickness in CSS px. */
    readonly stemWidth: 1;
    /**
     * Open/close tick length as fraction of resolved body width when a percent string,
     * or absolute CSS px when a number. Default ~half-category arms.
     */
    readonly tickLength: "45%";
    readonly sampling: "ohlc";
    readonly samplingThreshold: 5000;
};
/** Defaults for error bar series (`type: 'errorBar'`). */
export declare const errorBarDefaults: {
    readonly itemStyle: {
        readonly borderWidth: 1.5;
        readonly opacity: 1;
    };
    /** Cap full width as fraction of category step when percent omitted. */
    readonly capWidth: "40%";
    readonly errorMode: "both";
    readonly direction: "vertical";
    readonly drawWhiskers: true;
    readonly drawConnector: true;
    readonly showCenter: false;
    readonly symbolSize: 6;
    readonly sampling: "none";
};
/** Defaults for impulse / stem series (`type: 'impulse'`). */
export declare const impulseDefaults: {
    readonly baseline: 0;
    /** Stem stroke width in CSS px. */
    readonly lineStyle: {
        readonly width: 2;
        readonly opacity: 1;
    };
    readonly showMarker: true;
    readonly symbolSize: 6;
    readonly sampling: "none";
};
export declare const scatterDefaults: {
    readonly mode: "points";
    readonly binSize: 2;
    readonly densityColormap: "viridis";
    readonly densityNormalization: "log";
};
export declare const heatmapDefaults: {
    readonly colormap: "viridis";
    readonly zScale: "linear";
    readonly opacity: 1;
    readonly cellAnchor: "corner";
    readonly nullHandling: "transparent";
    readonly cellGapPx: 0;
};
export declare const pointCloud3dDefaults: {
    readonly pointSize: 3;
    readonly opacity: 0.9;
    readonly color: "#38bdf8";
};
export declare const surface3dDefaults: {
    readonly colormap: "viridis";
    readonly opacity: 1;
    readonly wireframe: false;
    readonly lighting: 0.65;
    readonly contoursShow: false;
    readonly contoursLevels: 12;
    readonly contoursColor: "#e2e8f0";
    readonly contoursWidth: 1.5;
    readonly contoursOpacity: 0.85;
};
export declare const axes3dDefaults: {
    readonly showBox: true;
    readonly showGrid: true;
    readonly labelMode: "auto";
    readonly tickCount: 5;
};
export declare const camera3dDefaults: {
    type: "perspective";
    fovY: number;
    near: number;
    far: number;
    orthoSize: number;
    up: readonly [0, 1, 0];
};
export declare const interaction3dDefaults: {
    readonly orbit: true;
    readonly pan: true;
    readonly zoom: true;
    readonly orbitSpeed: 0.005;
    readonly zoomSpeed: 1;
    readonly panSpeed: 1;
};
/**
 * Default grid lines configuration.
 * Matches createGridRenderer defaults: horizontal=5, vertical=6.
 */
export declare const defaultGridLines: {
    readonly show: true;
    readonly horizontal: {
        readonly show: true;
        readonly count: 5;
    };
    readonly vertical: {
        readonly show: true;
        readonly count: 6;
    };
};
export declare const defaultOptions: {
    readonly grid: {
        readonly left: 60;
        readonly right: 20;
        readonly top: 40;
        readonly bottom: 40;
    };
    readonly xAxis: {
        readonly type: "value";
    };
    readonly yAxis: {
        readonly type: "value";
        readonly autoBounds: "visible";
    };
    readonly autoScroll: false;
    readonly theme: "dark";
    readonly palette: readonly ["#5470C6", "#91CC75", "#FAC858", "#EE6666", "#73C0DE", "#3BA272", "#FC8452", "#9A60B4", "#EA7CCC"];
    readonly series: readonly [];
};
//# sourceMappingURL=defaults.d.ts.map