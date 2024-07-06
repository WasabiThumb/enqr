import {CanvasQRRenderer, OffscreenCanvasQRRenderer} from "./impl/canvas";
import {Canvas} from "canvas";
import {SVGQRRenderer} from "./impl/svg";

export * from "./spec";
export namespace QRRenderers {

    /**
     * Renders QR codes to a canvas.
     * - **Browser**: {@link HTMLCanvasElement}
     * - **Node**: {@link Canvas} (from ``canvas`` library)
     */
    export const CANVAS = new CanvasQRRenderer();

    /**
     * Renders QR codes to an {@link OffscreenCanvas}.
     * This is a browser-only API, hence this renderer should not be used on Node.
     */
    export const OFFSCREEN_CANVAS = new OffscreenCanvasQRRenderer();

    /**
     * Renders QR codes to an SVG. This is a string containing the XML code of the SVG,
     * not a data or object URL.
     */
    export const SVG = new SVGQRRenderer();

}
