import data from "./sjis/data";
import {ICharset, stringFromCodePoints} from "../charset";

// Convert lowercase hex char to nibble
function h2n(char: number): number {
    if (char < 0x3A) return (char - 0x30);
    return (char - 0x61) + 10;
}

// Build map
type Maps = {
    /* UTF-16 to SJIS */
    forward: Map<number, number>,
    /* SJIS to UTF-16 */
    backward: Map<number, number>
}
let MAPS_CACHE: Maps | null = null;

function getMaps(): Maps {
    if (MAPS_CACHE !== null) return MAPS_CACHE;
    const forward = new Map<number, number>();
    const backward = new Map<number, number>();

    let char: number = 0;
    let index: number = 0;
    for (let i=0; i < data.length; i++) {
        char = data.charCodeAt(i);
        if (char === 10 || char === 13) { // newline
            index = 0;
            continue;
        }
        if (index === 0) {
            const nextNibble: (() => number) = (() => h2n(data.charCodeAt(++i)));
            index = (h2n(char) << 12) | (nextNibble() << 8) |
                (nextNibble() << 4) | nextNibble();
            continue;
        }
        forward.set(char, index);
        backward.set(index++, char);
    }

    return MAPS_CACHE = { forward, backward };
}

// Charset

export class ShiftJISCharset implements ICharset {

    readonly name: string = "SHIFT_JIS";

    encode(str: string): Uint8Array {
        const { forward } = getMaps();
        const u8 = new Uint8Array(str.length << 1);
        let head: number = 0;

        let char: number;
        for (let i=0; i < str.length; i++) {
            char = str.codePointAt(i)!;
            if (char > 0xFFFF) i++; // codePointAt found a surrogate pair, skip the next byte

            if (char > 0x7F) { // Non-ASCII
                if (0xff61 <= char && char <= 0xff9f) {
                    char -= 0xfec0;
                } else {
                    char = forward.has(char) ? forward.get(char)! : 0x3F; // 0x3F = '?'
                }
            }

            if (char < 0x80 || (0xA0 <= char && char < 0xE0)) {
                u8[head++] = char;
            } else {
                u8[head++] = (char >>> 8);
                u8[head++] = (char & 0xFF);
            }
        }

        return u8.subarray(0, head);
    }

    decode(buf: Uint8Array): string {
        const { backward } = getMaps();
        const capacity: number = buf.length;
        const u16 = new Uint16Array(capacity);

        let head: number = 0;
        let code: number;

        for (let i=0; i < capacity; i++) {
            code = buf[i];

            if (code > 0x7F && !(0xA0 <= code && code < 0xE0)) {
                if ((++i) >= capacity) {
                    code = 0x3F; // ?
                } else {
                    code = (code << 8) | buf[i];
                }
            }

            if (code > 0x7F) {
                if (161 <= code && code <= 223) {
                    code += 0xfec0;
                } else if (backward.has(code)) {
                    code = backward.get(code)!;
                } else {
                    code = 0x3F; // ?
                }
            }

            u16[head++] = code;
        }

        return stringFromCodePoints(u16.subarray(0, head), false, false);
    }

    get [Symbol.toStringTag]() {
        return `Charset{${this.name}}`;
    }

}
