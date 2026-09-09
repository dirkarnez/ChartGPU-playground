/**
 * Nice ticks for 3D axis domains (AABB or fixed min/max).
 *
 * Tick math is shared with 2D via {@link ../utils/niceAxisTicks} — re-exported
 * here so existing 3D call sites keep stable import paths.
 */
import { niceNum } from '../../utils/niceAxisTicks';
export { niceNum };
/**
 * 3D nice ticks — may include slightly-outside nice endpoints for readable axis boxes
 * (historical 3D behavior; 2D presentation clamps via {@link generateValueAxisTicks}).
 */
export declare function generateNiceAxisTicks3D(min: number, max: number, tickCount?: number): number[];
/** Compact tick label for 3D overlays. */
export declare function formatAxisTick3D(v: number): string;
export type Axis3DDomain = Readonly<{
    readonly min: number;
    readonly max: number;
}>;
/**
 * Resolve axis domain from optional fixed min/max and scene AABB component.
 */
export declare function resolveAxisDomain3D(fixedMin: number | undefined, fixedMax: number | undefined, aabbMin: number, aabbMax: number): Axis3DDomain;
//# sourceMappingURL=axisTicks3d.d.ts.map