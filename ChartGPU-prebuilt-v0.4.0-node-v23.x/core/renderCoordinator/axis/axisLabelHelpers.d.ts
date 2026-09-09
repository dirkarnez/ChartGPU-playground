/**
 * Axis label layout helpers used by renderAxisLabels.
 * @module axisLabelHelpers
 */
import type { TextOverlayAnchor } from '../../../components/createTextOverlay';
export declare function getYAxisLabelX(plotLeftCss: number, tickLengthCssPx: number): number;
export declare function getRightYAxisLabelX(plotRightCss: number, tickLengthCssPx: number): number;
export declare function getYAxisTitleX(yLabelX: number, maxTickLabelWidth: number, titleFontSize: number): number;
export declare function getRightYAxisTitleX(yLabelX: number, maxTickLabelWidth: number, titleFontSize: number): number;
/**
 * Horizontal text anchor for an X tick label so the glyph sits under the mark.
 *
 * Index-based start/end (first/last tick) misaligns labels when majors are a
 * nice ladder *inset* from the domain ends (streaming value X). Only hug the
 * plot rail when the tick is actually near that edge; otherwise center.
 *
 * @param xCss - Tick position in canvas CSS px
 * @param plotLeftCss - Plot left edge in canvas CSS px
 * @param plotRightCss - Plot right edge in canvas CSS px
 * @param edgeSlackCssPx - Proximity band for rail hugging (default {@link X_TICK_EDGE_ANCHOR_SLACK_CSS_PX})
 */
export declare function resolveXTickLabelAnchor(xCss: number, plotLeftCss: number, plotRightCss: number, edgeSlackCssPx?: number): TextOverlayAnchor;
//# sourceMappingURL=axisLabelHelpers.d.ts.map