import {Mode} from "./mode";
import {ErrorCorrectionLevel} from "../ec/level";
import {Version} from "./version";
import {TernaryMatrix} from "../collection/ternaryMatrix";
import {Charsets, StringBuilder} from "../util/string";
import {QRRenderer, QRRenderers, QRRenderOptions} from "../renderer";
import {Canvas} from "canvas";
import {isBrowser, isNode} from "browser-or-node";
import {CanvasQRRenderer, OffscreenCanvasQRRenderer} from "../renderer/impl/canvas";
import {SVGQRRenderer} from "../renderer/impl/svg";

/*
 * Reference: https://github.com/zxing/zxing/blob/master/core/src/main/java/com/google/zxing/qrcode/encoder/QRCode.java
 */

export type QRCodeData = {
    mode: Mode;
    ecLevel: ErrorCorrectionLevel;
    version: Version;
    maskPattern: number;
    matrix: TernaryMatrix;
};

type RenderToCanvasOptions = QRRenderOptions & {
    /**
     * If true, and on browser, and the feature is supported, the render operation may return {@link OffscreenCanvas}.
     * If you want to always render offscreen and skip feature tests, use {@link renderToOffscreenCanvas}.
     *
     * Default is false.
     */
    tryOffscreen?: true
}

type RenderToBlobOrURLOptions = SVGQRRenderer.Options & {
    /**
     * If true, and SVGs are supported in the current environment, the render operation may return SVG data.
     * Otherwise, it will be a PNG.
     *
     * Default is false.
     */
    trySVG?: boolean
}

type RenderToImageOptions = RenderToBlobOrURLOptions & {
    /**
     * If set, this image will be updated in-place instead of a new image being created.
     */
    image?: HTMLImageElement,
    /**
     * If true, and an object URL was used as the source of the image, the object URL will **NOT** be revoked
     * after the image loads.
     *
     * Default is false.
     */
    imageNoRevoke?: boolean
};

export interface QRCode extends QRCodeData {
    /**
     * Renders the QRCode using the specified renderer. One of the rendering utility functions may be a better fit
     * for your use case.
     * @param renderer The renderer to use
     * @param opts Options to pass to the renderer
     * @see renderToCanvas
     * @see renderToOffscreenCanvas
     * @see renderToDataURL
     * @see renderToDataURLSync
     * @see renderToBlob
     * @see renderToObjectURL
     * @see renderToURL
     */
    render<T, O extends QRRenderOptions>(renderer: QRRenderer<T, O>, opts?: O): T;

    /**
     * Renders the QRCode to a canvas. If browser, the QR code will render to an {@link HTMLCanvasElement}. If node,
     * the QR code will render to a {@link Canvas} (from the ``canvas`` library). If {@link RenderToCanvasOptions.tryOffscreen tryOffscreen}
     * is set on the options, this may return {@link OffscreenCanvas} in the browser.
     * @param options Options to pass to the renderer
     */
    renderToCanvas<O extends RenderToCanvasOptions>(options?: O): O extends { tryOffscreen: true } ?
        OffscreenCanvas | Canvas | HTMLCanvasElement :
        Canvas | HTMLCanvasElement;

    /**
     * Renders the QRCode to an {@link OffscreenCanvas}. This is a browser-only API, so this should not be used on Node.
     * @param options Options to pass to the renderer
     */
    renderToOffscreenCanvas(options?: QRRenderOptions): OffscreenCanvas;

    /**
     * Renders the QRCode to a data URL. This is async because on browser it will attempt to render to an
     * {@link OffscreenCanvas} if supported, which does not have a synchronous ``getDataURL`` method. If you want a
     * synchronous version that will never use {@link OffscreenCanvas}, see {@link renderToDataURLSync}.
     * @param options Options to pass to the renderer
     */
    renderToDataURL(options?: RenderToBlobOrURLOptions): Promise<string>;

    /**
     * Renders the QRCode to a data URL. This is sync, unlike {@link renderToDataURL}. This could be slow at scale.
     * @param options Options to pass to the renderer
     */
    renderToDataURLSync(options?: RenderToBlobOrURLOptions): string;

    /**
     * Renders the QRCode to a {@link Blob}. See {@link renderToObjectURL} or {@link renderToURL} if you want this
     * to be wrapped into a URL.
     * @param options Options to pass to the renderer
     */
    renderToBlob(options?: RenderToBlobOrURLOptions): Promise<Blob>;

    /**
     * Renders the QRCode to an [object URL](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static).
     * This is a browser-only API, and should not be used in Node. For a version that will create a {@link renderToDataURL data URL}
     * when object URLs are not available, see {@link renderToURL}.
     * @param options Options to pass to the renderer
     */
    renderToObjectURL(options?: RenderToBlobOrURLOptions): Promise<string>;

    /**
     * Renders the QRCode to either an {@link renderToObjectURL object URL} or a {@link renderToDataURL data URL},
     * depending on support in the current environment.
     * @param options Options to pass to the renderer
     */
    renderToURL(options?: RenderToBlobOrURLOptions): Promise<string>;

    /**
     * Renders the QRCode to an SVG (XML code). This is not a URL, for that use {@link renderToURL} with the
     * {@link RenderToBlobOrURLOptions.trySVG trySVG} option set.
     * @param options Options to pass to the renderer
     */
    renderToSVG(options?: SVGQRRenderer.Options): string;

    /**
     * Renders the QRCode to an HTML image. This is a browser-only API. If {@link RenderToImageOptions.image image} is
     * specified, the image will be updated in-place. Otherwise, a new image will be created. This is similar to setting
     * the {@link HTMLImageElement.src src} property of an image to the result of {@link renderToURL}. The returned
     * promise resolves when the image has loaded. If you are having issues with the image not displaying properly,
     * see {@link RenderToImageOptions.imageNoRevoke imageNoRevoke}.
     * @param options Options to pass to the renderer
     */
    renderToImage(options?: RenderToImageOptions): Promise<HTMLImageElement>;

}

const SUPPORTS_SVG: boolean = isNode || (() => {
    return !!(document.createElementNS &&
        document.createElementNS('http://www.w3.org/2000/svg','svg').createSVGRect);
})();
const SUPPORTS_CANVAS: boolean = isNode || (() => {
    const elem = document.createElement("canvas");
    return !!(elem.getContext && elem.getContext("2d"));
})();
const SUPPORTS_OFFSCREEN_CANVAS: boolean = isBrowser && typeof OffscreenCanvas === "function";
const SUPPORTS_OBJECT_URL: boolean = isBrowser && typeof URL === "function" && typeof URL["createObjectURL"] === "function";

// Mimic the lateinit properties of the reference impl
class QRCodeImpl implements QRCode {

    private _mode: Mode | null = null; // init flag = 1
    private _ecLevel: ErrorCorrectionLevel | null = null; // init flag = 2
    private _version: Version | null = null; // init flag = 4
    private _matrix: TernaryMatrix | null = null; // init flag = 8
    private initFlags = 0;

    private assertInit(name: string, flag: number): void {
        if ((this.initFlags & flag) === 0) throw new Error(`${name} accessed before initialization`);
    }

    get mode(): Mode {
        this.assertInit("mode", 1);
        return this._mode!;
    }

    set mode(value: Mode) {
        this._mode = value;
        this.initFlags |= 1;
    }

    get ecLevel(): ErrorCorrectionLevel {
        this.assertInit("ecLevel", 2);
        return this._ecLevel!;
    }

    set ecLevel(value: ErrorCorrectionLevel) {
        this._ecLevel = value;
        this.initFlags |= 2;
    }

    get version(): Version {
        this.assertInit("version", 4);
        return this._version!;
    }

    set version(value: Version) {
        this._version = value;
        this.initFlags |= 4;
    }

    maskPattern: number = -1;

    get matrix(): TernaryMatrix {
        this.assertInit("matrix", 8);
        return this._matrix!;
    }

    set matrix(value: TernaryMatrix) {
        this._matrix = value;
        this.initFlags |= 8;
    }

    toString(): string {
        const matrix: string = this.matrix.toString();
        const sb = new StringBuilder(matrix.length + 53);
        sb.append("<<").appendNewline();
        sb.append(" mode: ").append(Mode[this.mode]).appendNewline();
        sb.append(" ecLevel: ").append(ErrorCorrectionLevel[this.ecLevel]).appendNewline();
        sb.append(" version: ").append(this.version.versionNumber).appendNewline();
        sb.append(" maskPattern: ").append(this.maskPattern).appendNewline();
        sb.append(" matrix:").appendNewline();
        sb.append(matrix);
        sb.append(">>").appendNewline();
        return sb.toString();
    }

    render<T, O extends QRRenderOptions>(renderer: QRRenderer<T, O>, opts?: O): T {
        return renderer.render(this, opts);
    }

    renderToCanvas<O extends RenderToCanvasOptions>(options?: O): O extends { tryOffscreen: true } ? OffscreenCanvas | Canvas | HTMLCanvasElement : Canvas | HTMLCanvasElement {
        if (!!options && options.tryOffscreen && SUPPORTS_OFFSCREEN_CANVAS) {
            // @ts-ignore
            return this.render(QRRenderers.OFFSCREEN_CANVAS, options);
        }
        return this.render(QRRenderers.CANVAS, options);
    }

    renderToOffscreenCanvas(options?: QRRenderOptions): OffscreenCanvas {
        return this.render(QRRenderers.OFFSCREEN_CANVAS, options);
    }

    renderToDataURL(options?: RenderToBlobOrURLOptions): Promise<string> {
        if (!!options && options.trySVG && SUPPORTS_SVG) return Promise.resolve(this.renderToSVGDataURL(options));

        let renderer: CanvasQRRenderer | OffscreenCanvasQRRenderer = SUPPORTS_OFFSCREEN_CANVAS ?
            QRRenderers.OFFSCREEN_CANVAS : QRRenderers.CANVAS;

        const canvas = this.render<Canvas | HTMLCanvasElement | OffscreenCanvas, QRRenderOptions>(renderer, options);
        // @ts-ignore
        return Promise.resolve<Promise<string> | string>(renderer.toDataURL(canvas));
    }

    renderToDataURLSync(options?: RenderToBlobOrURLOptions): string {
        if (!!options && options.trySVG && SUPPORTS_SVG) return this.renderToSVGDataURL(options);

        const renderer = QRRenderers.CANVAS;
        const canvas = renderer.render(this, options);
        return renderer.toDataURL(canvas);
    }

    renderToBlob(options?: RenderToBlobOrURLOptions): Promise<Blob> {
        if (!!options && options.trySVG && SUPPORTS_SVG) {
            const dat = Charsets.UTF_8.encode(this.renderToSVG(options));
            return Promise.resolve(new Blob([ dat.buffer ], { type: "image/svg+xml" }));
        }

        let renderer: CanvasQRRenderer | OffscreenCanvasQRRenderer = SUPPORTS_OFFSCREEN_CANVAS ?
            QRRenderers.OFFSCREEN_CANVAS : QRRenderers.CANVAS;

        const canvas = this.render<Canvas | HTMLCanvasElement | OffscreenCanvas, QRRenderOptions>(renderer, options);
        // @ts-ignore
        return renderer.toBlob(canvas);
    }

    renderToObjectURL(options?: RenderToBlobOrURLOptions): Promise<string> {
        return this.renderToBlob(options)
            .then<string>((blob) => URL.createObjectURL(blob));
    }

    renderToURL(options?: RenderToBlobOrURLOptions): Promise<string> {
        if (SUPPORTS_OBJECT_URL) return this.renderToObjectURL(options);
        return this.renderToDataURL(options);
    }

    renderToSVG(options?: SVGQRRenderer.Options): string {
        return this.render(QRRenderers.SVG, options);
    }

    private renderToSVGDataURL(options?: SVGQRRenderer.Options): string {
        const base: string = "data:image/svg+xml;charset=UTF-8;base64,";
        const data: string = this.renderToSVG(options);
        if (isNode) {
            return base + Buffer.from(Charsets.UTF_8.encode(data).buffer).toString("base64");
        } else {
            return base + window.btoa(data);
        }
    }

    renderToImage(options?: RenderToImageOptions): Promise<HTMLImageElement> {
        let img: HTMLImageElement;
        if (!!options && options.image) {
            img = options.image!;
        } else {
            img = (typeof Image === "function") ?
                new Image(this.matrix.width, this.matrix.height) :
                document.createElement("img");
        }

        let revoke: boolean = true;
        if (!!options && options.imageNoRevoke) revoke = false;

        return new Promise<HTMLImageElement>(async (res) => {
            const url = await this.renderToURL(options);
            img.addEventListener("load", () => {
                if (revoke && url.startsWith("blob:")) URL.revokeObjectURL(url);
                img.style.imageRendering = "pixelated";
                if (window.getComputedStyle(img).imageRendering !== "pixelated") img.style.imageRendering = "crisp-edges";
                img.style.objectFit = "contain";
                res(img);
            });
            img.addEventListener("error", () => {
                res(img);
            });
            img.src = url;
        });
    }

}

export function QRCode(data?: QRCodeData): QRCode {
    const ret = new QRCodeImpl();
    if (!!data) {
        ret.mode = data.mode;
        ret.ecLevel = data.ecLevel;
        ret.version = data.version;
        ret.matrix = data.matrix;
        ret.maskPattern = data.maskPattern;
    }
    return ret;
}

export namespace QRCode {

    /**
     * Number of supported mask patterns. Value is 8
     */
    export const NUM_MASK_PATTERNS: number = 8;

    export function isValidMaskPattern(maskPattern: number): boolean {
        return maskPattern >= 0 && maskPattern < NUM_MASK_PATTERNS;
    }

}
