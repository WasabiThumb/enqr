import {StringBuilder} from "../util/string";
import {QRCode} from "../qr/qrcode";

export type QRRenderOptionsMetric = "px" | "%";

/**
 * Options for a {@link QRRenderer}
 */
export type QRRenderOptions = {
    /**
     * The color of the background, default is white.
     * Anything that is applicable to the CSS ``color`` property will also work here.
     *
     * You can also specify the color in RGB/A as a number array (0-255), which
     * may be faster in some circumstances.
     */
    background?: string | ArrayLike<number>,
    /**
     * The color of the foreground, default is black.
     * Anything that is applicable to the CSS ``color`` property will also work here.
     *
     * You can also specify the color in RGB/A as a number array (0-255), which
     * may be faster in some circumstances.
     */
    foreground?: string | ArrayLike<number>,
    /**
     * The size of the quiet zone. Default is ``0``.
     *
     * If given as a number, the size will be interpreted as a number of pixels.
     *
     * If given as a string, the suffix determines how to interpret the digits preceding it.
     * - **px** : Number of pixels
     * - **%** : Percentage of the inner size of the QR code
     */
    quietZone?: `${string}${QRRenderOptionsMetric}` | number,
    /**
     * The outer resolution of the QR code will be doubled until it is as close to this dimension as possible.
     * If unset or negative, the resolution is as small as possible.
     *
     * If you are trying to use {@link targetSize} to make the QR code appear non-blurry, consider instead using
     * ``crisp-edges`` in CSS [image-rendering](https://developer.mozilla.org/en-US/docs/Web/CSS/image-rendering)
     * or setting [imageSmoothingEnabled](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled)
     * to ``false`` in canvas.
     */
    targetSize?: number,
    /**
     * If the renderer outputs in a non-raster format (SVG, DOM) this sets the maximum number of digits that can be used
     * by each coordinate. See [Number.toPrecision](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toPrecision).
     * If unset or less than 1, the precision is limited only by the intrinsic limitations of the JS engine.
     */
    floatPrecision?: number
};

export const QRRenderDefaultOptions: Required<QRRenderOptions> = {
    background: [ 255, 255, 255 ],
    foreground: [ 0, 0, 0 ],
    quietZone: 0,
    targetSize: -1,
    floatPrecision: -1
};

export namespace QRRenderOptions {

    export function normalizeWith<T extends QRRenderOptions>(opts: T | undefined, defaults: Required<T>): Required<T> {
        if (typeof opts === "undefined") return {...defaults};
        let kQual: keyof T;
        let value: any;
        for (let k of Object.keys(defaults)) {
            kQual = k as unknown as keyof T;
            value = opts[kQual];
            if (typeof value === "undefined") opts[kQual] = defaults[kQual];
        }
        return opts as unknown as Required<T>;
    }

    export function normalize(opts?: QRRenderOptions): Required<QRRenderOptions> {
        return normalizeWith(opts, QRRenderDefaultOptions);
    }

    const HEX_CHARS: string = "0123456789ABCDEF";
    function n2Hex(n: number): string {
        return HEX_CHARS.charAt(n);
    }

    export function parseColorAsCSS(col: string | ArrayLike<number>): string {
        if (typeof col === "string") return col;
        if (typeof col !== "object" || !("length" in col)) throw new Error("Color must be array or string");
        if (col.length < 1) throw new Error("Color array has 0 components");
        let r: number, g: number, b: number, a: number;
        r = g = b = col[0];
        a = 255;

        // noinspection FallThroughInSwitchStatementJS
        switch (4 - Math.min(col.length, 4)) {
            case 0: // RGBA
                a = col[3];
            case 1: // RGB
                b = col[2];
            case 2: // RG (?)
                g = col[1];
                break;
        }

        const opaque: boolean = (a === 255);
        const monochrome: boolean = (r === g) && (g === b) && (opaque || (b === a));
        let components: number[] = new Array(8);
        let flag: number = 0;

        function processComponent(index: number, value: number) {
            const lo: number = (value & 0xF);
            const hi: number = (value >>> 4);
            flag |= (lo ^ hi);
            components[index] = hi;
            components[index | 1] = lo;
        }

        function getComponent(index: number) {
            let single: string = n2Hex(components[index]);
            if (flag !== 0) single += n2Hex(components[index | 1]);
            return single;
        }

        processComponent(0, r);
        if (monochrome) return "#" + getComponent(0).repeat(opaque ? 3 : 4);
        processComponent(2, g);
        processComponent(4, b);
        if (!opaque) processComponent(6, a);

        let ret: string = `#${getComponent(0)}${getComponent(2)}${getComponent(4)}`;
        if (opaque) return ret;
        return ret + getComponent(6);
    }

    export function parseMetric(metric: string | number, dimension: number): number {
        if (typeof metric === "number") return metric;
        metric = metric.toLowerCase();

        let value = new StringBuilder();
        let qualifier = new StringBuilder(2);
        let c: number;
        for (let i=0; i < metric.length; i++) {
            c = metric.charCodeAt(i);
            if ((c < 48 || c > 57) && (c !== 46)) { // NOT 0 - 9 or PERIOD
                if (c === 32) continue; // SPACE
                qualifier.appendChar(c);
            } else {
                qualifier.clear();
                value.appendChar(c);
            }
        }

        switch (qualifier.toString()) {
            case "":
            case "px":
                return Math.round(parseFloat(value.toString()));
            case "%":
                return Math.round(parseFloat(value.toString()) * (dimension / 100));
        }
        throw new Error("Invalid qualifier: " + qualifier.toString());
    }

    export function approachTargetSize(size: number, targetSize: number): [ number, number ] {
        if (targetSize < 0) return [ size, 1 ];

        const frac: number = targetSize / size;
        if (frac <= 1) return [ size, 1 ];

        let a: number = Math.floor(frac);
        const b: number = Math.ceil(frac);

        if (a !== b) {
            const r: number = frac - a;
            if (r >= 0.5) a = b;
        }
        return [ size * a, a ];
    }

}

export interface QRRenderer<T, O extends QRRenderOptions = QRRenderOptions> {

    /**
     * Renders a QR code.
     * @param qr The QR code to render
     * @param options Options for the render
     * @return A rendered representation of the QR code
     */
    render(qr: QRCode, options?: O): T;

}
