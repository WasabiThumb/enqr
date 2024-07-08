import {QRRenderDefaultOptions, QRRenderer, QRRenderOptions} from "../spec";
import {QRCode} from "../../qr/qrcode";
import {StringBuilder} from "../../util/string";
import {TernaryMatrix} from "../../collection/ternaryMatrix";
import {BitMatrix} from "../../collection/bitMatrix";
import {BitArray} from "../../collection/bitArray";


const MAGIC_1: string = `<?xml version="1.0" encoding="UTF-8"?>`;
const MAGIC_2: string = `<svg width="`;
const MAGIC_3: string = `" height="`;
const MAGIC_4: string = `" version="1.1" viewBox="0 0 `;
const MAGIC_5: string = `" xmlns="http://www.w3.org/2000/svg">`;

const MAGIC_6: string = `<rect x="`;
const MAGIC_7: string = `" y="`;
const MAGIC_8: string = `" width="`;
const MAGIC_10: string = `" fill="`;
const MAGIC_11: string = `"/>`;

const MAGIC_12: string = `<path d="`;
const MAGIC_14: string = `<style><![CDATA[* {shape-rendering: crispEdges;} path {fill-rule: evenodd;}]]></style>`;
const MAGIC_15: string = `</svg>`;


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
        space();
        out.append(MAGIC_14);
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

        function addFGRect(x: number, y: number, w: number, h: number): void {
            addRect(
                (x * xScale) + quiet,
                (y * yScale) + quiet,
                w * xScale,
                h * yScale,
                fg
            );
        }

        let doubleStrip: boolean = true;
        // noinspection FallThroughInSwitchStatementJS
        switch (opts.svgCollation) {
            case 0:
                for (let y=0; y < matrix.height; y++) {
                    for (let x=0; x < matrix.width; x++) {
                        if (matrix.get(x, y) !== 1) continue;
                        addFGRect(x, y, 1, 1);
                    }
                }
                break;
            case 1:
                doubleStrip = false;
            case 2:
                const strips = new StripMatrix(matrix.width, matrix.height);
                strips.addAll(matrix);
                if (doubleStrip) {
                    for (let rect of strips.popRects())
                        addFGRect(rect.x, rect.y, rect.width, rect.height);
                } else {
                    for (let strip of strips.strips)
                        addFGRect(strip.start, strip.y, strip.end - strip.start, 1);
                }
                break;
            case 3:
                const tracer = new Tracer(matrix);
                let poll: string | -1;
                while ((poll = tracer.pollString(xScale, yScale, quiet, quiet)) !== -1) {
                    space();
                    out.append(MAGIC_12)
                        .append(poll)
                        .append(MAGIC_10)
                        .append(fg)
                        .append(MAGIC_11);
                    newline();
                }
                break;
        }

        // Add closing tag
        out.append(MAGIC_15);
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
        svgNoWhitespace?: boolean,
        /**
         * An optimization that determines how pixels will be collated into shapes. Default is 3.
         *
         * - **0** : Pixels (No collation)
         * - **1** : Strips (Collate along X axis)
         * - **2** : Double Strips (Collate along X axis, then along Y axis)
         * - **3** : Perfect (All pixels with cardinal neighbors are collated)
         */
        svgCollation?: 0 | 1 | 2 | 3
    };

    export const DefaultOptions: Required<Options> = {
        ...QRRenderDefaultOptions,
        svgNoWhitespace: false,
        svgCollation: 3
    };

}

// Used for svgCollation = 3
type TracerPath = {
    length: number,
    xs: number[],
    ys: number[]
}

type TracerLine = [ number, number, number, number, 0 | 1 | 2 | 3 ];

class Tracer {

    readonly matrix: TernaryMatrix;
    readonly traversed: BitMatrix;
    constructor(matrix: TernaryMatrix) {
        this.matrix = matrix;
        this.traversed = new BitMatrix(matrix.width, matrix.height);
        for (let y=0; y < matrix.height; y++) {
            for (let x=0; x < matrix.width; x++) {
                if (matrix.get(x, y) !== 1) this.traversed.set(x, y, true);
            }
        }
    }

    pollString(xScale: number = 1, yScale: number = 1, xOffset: number = 0, yOffset: number = 0): string | -1 {
        let poll = this.poll();
        if (poll === -1) return -1;

        let ret = new StringBuilder();
        for (let i=0; i < poll.length; i++) {
            if (i > 0) ret.appendSpace();
            ret.appendString(this.pathToString(poll[i], (i & 1) === 1, xScale, yScale, xOffset, yOffset));
        }

        return ret.toString();
    }

    // noinspection JSMethodCanBeStatic
    private pathToString(path: TracerPath, reverse: boolean, xScale: number, yScale: number, xOffset: number, yOffset: number): string {
        let ret = new StringBuilder();
        ret.appendString("M ");

        let ei: number;
        for (let i=0; i < path.length; i++) {
            ei = reverse ? (path.length - 1 - i) : i;
            if (i !== 0) ret.appendString(" L ");
            ret.append(path.xs[ei] * xScale + xOffset)
                .append(",")
                .append(path.ys[ei] * yScale + yOffset);
        }

        ret.appendString(" Z");

        return ret.toString();
    }

    poll(): TracerPath[] | -1 {
        const lines = this.pollLines();
        if (lines === -1) return -1;

        const lineGroup = new TracerLineGroup(lines, this.matrix.width);

        let paths: TracerPath[] = [];
        let path: TracerPath | null;
        while (!!(path = lineGroup.popLoopAsPath())) paths.push(path);

        return paths;
    }

    private pollLines(): TracerLine[] | -1 {
        const coord = this.pollUnprocessed();
        if (coord === -1) return -1;
        let lines: TracerLine[] = [];
        this.pullLines(coord[0], coord[1], lines);
        return lines;
    }

    private pullLines(x: number, y: number, lines: TracerLine[]): void {
        if (this.traversed.get(x, y)) return;
        this.traversed.set(x, y, true);
        let nx: number;
        let ny: number = y;
        nx = x - 1;
        this.getAt(nx, ny) ? this.pullLines(nx, ny, lines) : lines.push([ x, y + 1, x, y, 0 ]); // LEFT
        nx = x + 1;
        this.getAt(nx, ny) ? this.pullLines(nx, ny, lines) : lines.push([ x + 1, y, x + 1, y + 1, 1 ]); // RIGHT
        nx = x;
        ny = y - 1;
        this.getAt(nx, ny) ? this.pullLines(nx, ny, lines) : lines.push([ x, y, x + 1, y, 2 ]); // UP
        ny = y + 1;
        this.getAt(nx, ny) ? this.pullLines(nx, ny, lines) : lines.push([ x + 1, y + 1, x, y + 1, 3 ]); // DOWN
    }

    private getAt<T extends number>(x: number, y: number): boolean {
        const { width, height } = this.matrix;
        if (y < 0) return false;
        if (y >= height) return false;
        if (x < 0) return false;
        if (x >= width) return false;
        return this.matrix.get(x, y) === 1;
    }

    private pollUnprocessed(): [ number, number ] | -1 {
        const { width, height } = this.matrix;

        let row: BitArray = new BitArray(width);
        let unset: number;
        for (let y=0; y < height; y++) {
            row = this.traversed.getRow(y, row);
            unset = row.getNextUnset();
            if (unset < width) return [ unset, y ];
        }

        return -1;
    }

}

class TracerLineGroup {

    readonly lines: TracerLine[];
    readonly width: number;
    readonly traversed: BitArray;
    readonly starts: { [index: number]: number[] } = { };
    constructor(lines: TracerLine[], width: number) {
        this.lines = lines;
        this.width = width;
        this.traversed = new BitArray(lines.length);
        this.starts = { };
        for (let i=0; i < lines.length; i++) {
            const index: number = (lines[i][1] * width) + lines[i][0];
            (this.starts[index] || (this.starts[index] = [])).push(i);
        }
    }

    popLoopAsPath(): TracerPath | null {
        const lines = this.popLoop();
        if (!lines) return null;

        const length = lines.length;
        const xs: number[] = new Array(length);
        const ys: number[] = new Array(length);

        let line: TracerLine;
        for (let i=0; i < length; i++) {
            line = lines[i];
            xs[i] = line[0];
            ys[i] = line[1];
        }

        return { xs, ys, length };
    }

    popLoop(): TracerLine[] | null {
        const startIndex = this.traversed.getNextUnset();
        if (startIndex >= this.traversed.length) return null;
        this.traversed.set(startIndex);

        let cur: TracerLine = this.lines[startIndex];
        let ret: TracerLine[] = [];

        let nextIndex: number;
        let next: TracerLine;
        while (true) {
            let starting = this.getStartingAt(cur[2], cur[3]);
            if (!starting || starting.length < 1) break;

            [ nextIndex, next ] = starting[0];
            if (nextIndex === startIndex) break;
            this.traversed.set(nextIndex);

            ret.push(cur);
            cur = next;
        }

        ret.push(cur);
        return ret;
    }

    getStartingAt(x: number, y: number): [number, TracerLine][] {
        const index: number = (y * this.width) + x;
        let starts: number[] = this.starts[index];
        if (!starts) return [];

        let ret: [number, TracerLine][] = new Array(starts.length);
        let count: number = 0;
        for (let idx of starts) {
            if (this.traversed.get(idx)) continue;
            ret[count++] = [idx, this.lines[idx]];
        }
        ret.length = count;
        return ret;
    }

}

// Used for svgCollation = 1 | 2
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
        const end: number = strip.end;
        const width: number = end - x;
        let sy: number = y;
        let idx: number;
        let toAdd: Strip[] = new Array(2);
        let numToAdd: number = 0;
        do {
            idx = this.map[this.calcIndex(x, sy)];
            if (typeof idx === "undefined") break;
            strip = this.strips[idx]

            if (sy !== y) {
                if (strip.start > x) break;
                if (strip.end < end) break;
                if (strip.start < x) {
                    toAdd[numToAdd++] = { start: strip.start, end: x, y: sy };
                }
                if (strip.end > end) {
                    toAdd[numToAdd++] = { start: end, end: strip.end, y: sy };
                }
            }

            this.popStrip0(sy, strip);

            for (let i=0; i < numToAdd; i++) this.addStrip(toAdd[i]);
            numToAdd = 0;

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
