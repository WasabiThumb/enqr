import * as iconv from "iconv-lite";

/**
 * @see Charsets
 */
export interface Charset {
    readonly name: string;
    encode(str: string): Uint8Array;
    decode(buf: Uint8Array): string;
}

class IconvCharset implements Charset {

    readonly name: string;
    readonly id: string;
    readonly options?: iconv.Options;
    constructor(id: string, name: string = id, options?: iconv.Options) {
        this.id = id;
        this.name = name;
        if (!!options) this.options = options;
    }

    encode(str: string): Uint8Array {
        return iconv.encode(str, this.id, this.options);
    }

    decode(buf: Uint8Array): string {
        return iconv.decode(
            buf as unknown as Buffer,
            this.id,
            this.options
        );
    }

    toString(): string {
        return this.name;
    }

    get [Symbol.toStringTag]() {
        return `Charset{${this.name}}`;
    }

}

class NativeCharset implements Charset {

    readonly name: string = "UTF_8";
    readonly encoder: TextEncoder = new TextEncoder();
    readonly decoder: TextDecoder = new TextDecoder();

    encode(str: string): Uint8Array {
        return this.encoder.encode(str);
    }

    decode(buf: Uint8Array): string {
        return this.decoder.decode(buf);
    }

    toString(): string {
        return this.name;
    }

    get [Symbol.toStringTag]() {
        return `Charset{${this.name}}`;
    }

}

/**
 * Meant to replace both
 * <a href="https://docs.oracle.com/javase/8/docs/api/java/nio/charset/StandardCharsets.html">StandardCharsets</a>
 * and
 * <a href="https://github.com/zxing/zxing/blob/master/core/src/main/java/com/google/zxing/common/StringUtils.java">xzing/common/StringUtils</a>
 */
export const Charsets = {
    US_ASCII: new IconvCharset("us-ascii", "US_ASCII") as Charset,
    ISO_8859_1: new IconvCharset("latin1", "ISO_8859_1") as Charset,
    UTF_8: new NativeCharset() as Charset,
    UTF_16BE: new IconvCharset("utf16-be", "UTF_16BE") as Charset,
    UTF_16LE: new IconvCharset("utf16le", "UTF_16LE") as Charset,
    UTF_16: new IconvCharset("utf16", "UTF_16", { addBOM: true }) as Charset,
    SHIFT_JIS: new IconvCharset("Shift_JIS", "SHIFT_JIS") as Charset,
    GB2312: new IconvCharset("GB2312") as Charset,
    EUC_JP: new IconvCharset("EUC-JP", "EUC_JP") as Charset
};
export type CharsetName = keyof typeof Charsets;

export namespace Charset {

    function generateNameAlts(name: string): [ string, string ] {
        let alt1: StringBuilder = new StringBuilder(name.length); // dashes, spaces and dots converted to underscores
        let alt2: StringBuilder = new StringBuilder(name.length); // dashes, spaces and dots removed

        let c: number;
        for (let i=0; i < name.length; i++) {
            c = name.charCodeAt(i);
            if (c === 45 || c === 32 || c === 46) { // dash, space, dot
                alt1.appendChar(95); // underscore
                continue;
            } else {
                alt1.appendChar(c);
            }
            alt2.appendChar(c);
        }

        return [ alt1.toString(), alt2.toString() ];
    }

    export function forName(name: CharsetName | string): Charset {
        name = name.toUpperCase();
        if (name in Charsets) return Charsets[name as unknown as CharsetName];

        let [ alt1, alt2 ] = generateNameAlts(name);
        if (alt1 in Charsets) return Charsets[alt1 as unknown as CharsetName];
        if (alt2 in Charsets) return Charsets[alt2 as unknown as CharsetName];

        for (let k of Object.keys(Charsets)) {
            alt1 = k.replace(/_/g, "");
            if (alt1 === alt2) return Charsets[k as unknown as CharsetName];
        }

        throw new Error(`Unsupported charset: ${name} (Supported charsets are ${Object.keys(Charsets).join(", ")})`);
    }

    /**
     * Reference: https://github.com/zxing/zxing/blob/master/core/src/main/java/com/google/zxing/common/CharacterSetECI.java
     */
    export function getECI(charset: Charset): number[] | null {
        switch (charset) {
            case Charsets.ISO_8859_1:
                return [ 1, 3 ];
            case Charsets.SHIFT_JIS:
                return [ 20 ];
            case Charsets.UTF_16BE:
                return [ 25 ];
            case Charsets.UTF_8:
                return [ 26 ];
            case Charsets.US_ASCII:
                return [ 27, 170 ];
            case Charsets.GB2312:
                return [ 29 ];
            default:
                return null;
        }
    }

}

export class StringBuilder {

    private readonly arr: number[];
    private index: number;
    constructor(capacity: number = 16) {
        this.arr = new Array(Math.abs(capacity));
        this.index = 0;
    }

    get length(): number {
        return this.index;
    }

    clear() {
        this.index = 0;
    }

    append(value: string | { toString(): string }): this {
        if (typeof value === "string") {
            switch (value.length) {
                case 0:
                    break;
                case 1:
                    this.appendChar(value.charCodeAt(0));
                    break;
                default:
                    this.appendString(value);
                    break;
            }
        } else {
            this.appendString(value.toString());
        }
        return this;
    }

    appendSpace(): this {
        return this.appendChar(32);
    }

    appendNewline(): this {
        return this.appendChar(10);
    }

    appendDigit(d: number): this {
        return this.appendChar(48 + (d & 0xF));
    }

    appendChar(c: number): this {
        this.arr[this.index++] = c;
        return this;
    }

    appendString(s: string): this {
        for (let i=0; i < s.length; i++) {
            this.appendChar(s.charCodeAt(i));
        }
        return this;
    }

    toString(narrow: boolean = true): string {
        if (narrow && this.index < this.arr.length) this.arr.length = this.index;
        return String.fromCharCode.apply(null, this.arr) as unknown as string;
    }

}
