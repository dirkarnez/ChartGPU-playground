/**
 * Pure Y auto-range domain resolution for paint (sticky / continuous / animated).
 *
 * Extracted from the coordinator so mode selection, map clear, and animated
 * settle flags are unit-testable without WebGPU.
 *
 * @module resolveYAutoDomain
 * @internal
 */
import { type StickyDomain } from './stickyAutoDomain';
type YAutoDomainMode = 'sticky' | 'continuous' | 'animated' | 'explicit' | 'transition';
type ResolveYAutoDomainInput = {
    readonly dataDomain: StickyDomain;
    readonly explicitMin: number | undefined;
    readonly explicitMax: number | undefined;
    readonly autoRange: unknown;
    readonly growBy: number | readonly [number, number] | undefined;
    readonly axisType: string | undefined;
    readonly logBase: number | undefined;
    /** Mid update-transition: skip auto motion; caller supplies lerped domain. */
    readonly updateTransitionActive: boolean;
    readonly transitionDomain?: StickyDomain;
    readonly sticky: StickyDomain | null;
    readonly animatedDisplay: StickyDomain | null;
    /**
     * Blend factor for animated mode [0,1]. Caller computes time-based alpha.
     * @default 0.22
     */
    readonly animatedAlpha?: number;
};
type ResolveYAutoDomainResult = {
    readonly domain: StickyDomain;
    readonly mode: YAutoDomainMode;
    /** Next sticky state (null → delete). */
    readonly nextSticky: StickyDomain | null;
    /** Next animated display (null → delete). */
    readonly nextAnimatedDisplay: StickyDomain | null;
    /** When true, coordinator should request another paint (animated not settled). */
    readonly needsFrame: boolean;
};
/**
 * Resolve paint-time Y domain under auto-range policy.
 *
 * Explicit one-sided or both ends → data domain, clear sticky/animated.
 * Continuous → pad every call; animated → lerp display toward continuous target.
 */
export declare function resolveYAutoDomainForPaint(input: ResolveYAutoDomainInput): ResolveYAutoDomainResult;
/**
 * Time-based blend for animated auto-range: `1 - exp(-dtMs / tauMs)`.
 * Caps at 1; non-finite / negative dt → 1 (snap).
 */
export declare function animatedAlphaFromDtMs(dtMs: number, tauMs?: number): number;
export {};
//# sourceMappingURL=resolveYAutoDomain.d.ts.map