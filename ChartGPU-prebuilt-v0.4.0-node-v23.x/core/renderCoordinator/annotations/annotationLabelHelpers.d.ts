/**
 * Shared annotation label formatting helpers.
 * Used by processAnnotations (GPU + label build) and renderAnnotationLabels (DOM).
 *
 * @module annotationLabelHelpers
 * @internal
 */
import type { TextOverlayAnchor } from '../../../components/createTextOverlay';
/**
 * Converts color and opacity to CSS rgba() string.
 */
export declare function toCssRgba(color: string, opacity01: number): string;
/**
 * Renders template string with value substitution.
 * Supports {x}, {y}, {value}, and {name} placeholders.
 */
export declare function renderAnnotationTemplate(template: string, values: Readonly<{
    x?: number;
    y?: number;
    value?: number;
    name?: string;
}>, decimals?: number): string;
/**
 * Maps annotation anchor to text overlay anchor.
 */
export declare function mapAnnotationAnchor(anchor: 'start' | 'center' | 'end' | undefined): TextOverlayAnchor;
//# sourceMappingURL=annotationLabelHelpers.d.ts.map