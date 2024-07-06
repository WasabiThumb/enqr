import {QRRenderDefaultOptions, QRRenderer, QRRenderOptions} from "../spec";
import {QRCode} from "../../qr/qrcode";
import {StringBuilder} from "../../util/string";
import {TernaryMatrix} from "../../collection/ternaryMatrix";


const MAGIC_1: string = `<?xml version="1.0" encoding="UTF-8"?>`;
const MAGIC_2: string = `<svg width="`;
const MAGIC_3: string = `" height="`;
const MAGIC_4: string = `" version="1.1" viewBox="0 0 `;
const MAGIC_5: string = `" xmlns="http://www.w3.org/2000/svg">`;

const MAGIC_6: string = `<rect x="`;
const MAGIC_7: string = `" y="`;
const MAGIC_8: string = `" width="`;
// MAGIC_9 === MAGIC_3
const MAGIC_10: string = `" fill="`;
const MAGIC_11: string = `"/>`;

const MAGIC_12: string = `</svg>`;


export class SVGQRRenderer implements QRRenderer<string, SVGQRRenderer.Options> {

    render(qr: QRCode, options?: SVGQRRenderer.Options): string {
        const opts = QRRenderOptions.normalizeWith(options, SVGQRRenderer.DefaultOptions);
        const bg: string = QRRenderOptions.parseColorAsCSS(opts.background);
        const fg: string = QRRenderOptions.parseColorAsCSS(opts.foreground);

        const { matrix } = qr;
        const [ width, xScale ] = QRRenderOptions.approachTargetSize(matrix.width, opts.targetSize);
        const [ height, yScale ] = QRRenderOptions.approachTargetSize(matrix.height, opts.targetSize);

        const quiet: number = QRRenderOptions.parseMetric(opts.quietZone, Math.max(width, height));
        const outerWidth: number = width + (quiet * 2);
        const outerHeight: number = height + (quiet * 2);

        const strips = new StripMatrix(matrix.width, matrix.height);
        strips.addAll(matrix);

        const out = new StringBuilder();
        let newline: (() => void);
        let space: (() => void);
        if (!opts.svgNoWhitespace) {
            newline = (() => {
                out.appendNewline();
            });
            space = (() => {
                out.appendSpace();
            });
        } else {
            newline = space = (() => {});
        }

        // Add opening tag
        out.append(MAGIC_1);
        newline();
        out.append(MAGIC_2)
            .append(outerWidth)
            .append(MAGIC_3)
            .append(outerHeight)
            .append(MAGIC_4)
            .append(outerWidth)
            .appendSpace()
            .append(outerHeight)
            .append(MAGIC_5);
        newline();

        function addRect(x: number, y: number, width: number, height: number, color: string): void {
            space();
            out.append(MAGIC_6)
                .append(x)
                .append(MAGIC_7)
                .append(y)
                .append(MAGIC_8)
                .append(width)
                .append(MAGIC_3)
                .append(height)
                .append(MAGIC_10)
                .append(color)
                .append(MAGIC_11);
            newline();
        }

        addRect(0, 0, outerWidth, outerHeight, bg);

        for (let rect of strips.popRects()) {
            addRect(
                (rect.x * xScale) + quiet,
                (rect.y * yScale) + quiet,
                (rect.width * xScale),
                (rect.height * yScale),
                fg
            );
        }

        // Add closing tag
        out.append(MAGIC_12);
        newline();

        return out.toString();
    }

}

export namespace SVGQRRenderer {

    export type Options = QRRenderOptions & {
        /**
         * If true, the SVG will not have whitespace (newlines and spaces between tags).
         *
         * Default is false
         */
        svgNoWhitespace?: boolean
    };

    export const DefaultOptions: Required<Options> = {
        ...QRRenderDefaultOptions,
        svgNoWhitespace: false
    };

}

type Strip = {
    y: number,
    /**
     * inclusive
     */
    start: number,
    /**
     * exclusive
     */
    end: number
};

type Rect = {
    x: number,
    y: number,
    width: number,
    height: number
};

class StripMatrix {

    readonly width: number;
    readonly height: number;
    readonly map: { [index: number]: number };
    readonly strips: Strip[];
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.map = {};
        this.strips = [];
    }

    private calcIndex(x: number, y: number): number {
        return (y * this.width) + x;
    }

    addStrip(strip: Strip): void {
        const idx: number = this.strips.length;
        this.strips[idx] = strip;

        const a: number = this.calcIndex(strip.start, strip.y);
        const b: number = this.calcIndex(strip.end, strip.y);
        for (let i=a; i < b; i++) this.map[i] = idx;
    }

    popStrip(strip: Strip): Rect {
        const x: number = strip.start;
        const y: number = strip.y;
        const width: number = strip.end - strip.start;
        let sy: number = y;
        let idx: number;
        do {
            idx = this.map[this.calcIndex(x, sy)];
            if (typeof idx === "undefined") break;
            strip = this.strips[idx]

            if (sy !== y) {
                if (strip.start !== x) break;
                if ((strip.end - strip.start) !== width) break;
            }

            this.popStrip0(sy, strip);

            sy++;
        } while (sy < this.height);

        return { x, y, width, height: sy - y };
    }

    private popStrip0(y: number, strip: Strip): void {
        const a: number = this.calcIndex(strip.start, y);
        const b: number = this.calcIndex(strip.end, y);
        for (let i=a; i < b; i++) delete this.map[i];
    }

    popRects(): Rect[] {
        const rects: Rect[] = new Array(this.strips.length);
        let rect: Rect;
        let count = 0;
        for (let strip of this.strips) {
            rect = this.popStrip(strip);
            if (rect.height < 1) continue;
            rects[count++] = rect;
        }
        rects.length = count;
        return rects;
    }

    addAll(matrix: TernaryMatrix) {
        const { width, height } = matrix;

        for (let y=0; y < height; y++) {
            let start: number = -1;
            for (let x=0; x < width; x++) {
                if (matrix.get(x, y) === 1) {
                    if (start === -1) start = x;
                } else if (start !== -1) {
                    this.addStrip({ start, end: x, y });
                    start = -1;
                }
            }
            if (start !== -1) {
                this.addStrip({ start, end: width, y });
            }
        }
    }

}
