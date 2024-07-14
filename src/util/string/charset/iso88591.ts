import {ICharset} from "../charset";
import {TypedArrayUtil} from "../../typedArray";


// Unpacks a dense base64 format that delta-encodes a number-to-number map.
// Each pair starts with a flag, where the highest 4 bits are for delta A and the lowest 4 bits are for delta B.
// delta A is taken as-is (0 - 15) and delta B is subtracted by 7 (-7 - 8)
// For delta A and then delta B, if the value is at its max (15 or 8) then a full byte is read to replace it's value.
// The full byte for delta A is interpreted as signed (0 - 255) and for delta B it is interpreted as unsigned (-128 - 127).
function unpackMagicMap(magic: string, start: number): Map<number, number> {
    const ret = new Map<number, number>();
    const u8 = TypedArrayUtil.fromBase64(magic);
    const i8 = TypedArrayUtil.withSharedBuffer(u8, Int8Array);
    let a: number = start;
    let b: number = 0;
    let head: number = 0;
    while (head < u8.length) {
        let flag: number = u8[head++];
        let da: number = (flag >> 4);
        let db: number = (flag & 0xF);
        ret.set(
            a += (da === 15) ? u8[head++] : da,
            b += (db === 15) ? i8[head++] : (db - 7)
        );
    }
    return ret;
}

// Reference: https://github.com/mathiasbynens/windows-1252/blob/main/windows-1252.mjs
// The raw data was fetched from this code, and then minified using temporary garbage code that I didn't bother keeping
const MAGIC_RANGE_1 = unpackMagicMap(`CM8MKRjfDQ==`, 129);
const MAGIC_RANGE_2 = unpackMagicMap(`DwwfEN/uHxD8F1/vHxD/FOU=`, 338);
MAGIC_RANGE_2.set(710, 8);
MAGIC_RANGE_2.set(732, 24);
const MAGIC_RANGE_3 = unpackMagicMap(`DxYYQRgf8C8RGB/wKRgfDk/wq5kfEP9y5f92GQ==`, 8211);

function indexByCodePoint(codePoint: number): number {
    let map: Map<number, number>;
    if (codePoint < 160) {
        map = MAGIC_RANGE_1;
    } else if (codePoint < 256) {
        return codePoint - 128;
    } else if (codePoint < 733) {
        map = MAGIC_RANGE_2;
    } else {
        map = MAGIC_RANGE_3;
    }
    return map.has(codePoint) ? map.get(codePoint)! : -1;
}

export class Iso88591Charset implements ICharset {

    readonly name: string;
    private readonly allowExtended: boolean = true;
    constructor(name: string = "ISO_8859_1", allowExtended: boolean = true) {
        this.name = name;
        this.allowExtended = allowExtended;
    }

    encode(str: string): Uint8Array {
        const capacity = str.length;
        const ret = new Uint8Array(capacity);

        let char: number;
        for (let i=0; i < str.length; i++) {
            char = str.charCodeAt(i);
            if (char >= 0x7F) {
                char = this.allowExtended ? indexByCodePoint(char) : -1;
                if (char === -1) {
                    char = 63; // ?
                } else {
                    char += 0x80;
                }
            }
            ret[i] = char;
        }

        return ret;
    }

    decode(buf: Uint8Array): string {
        throw new Error("Not implemented");
    }

    get [Symbol.toStringTag]() {
        return `Charset{${this.name}}`;
    }

}

export class ASCIICharset extends Iso88591Charset {

    constructor() {
        super("US_ASCII", false);
    }

}
