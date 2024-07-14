
export interface ICharset {
    readonly name: string;
    encode(str: string): Uint8Array;
    decode(buf: Uint8Array): string;
}

/**
 * Construct a string from a Uint16Array containing UTF-16 codepoints
 * @param u16 Array of codepoints
 * @param nonNativeOrder If set, code units will be flipped before interpreted
 * @param checkForBOM If set, an attempt will be made to read the BOM. If a BOM is present, ``nonNativeOrder`` will
 * be overwritten with the appropriate value.
 * @protected
 */
export function stringFromCodePoints(u16: Uint16Array, nonNativeOrder: boolean = false, checkForBOM: boolean = false): string {
    const srcLength: number = u16.length;
    let i: number = 0;

    // BOM
    if (checkForBOM) {
        const firstChar: number = u16[0];
        if (firstChar === 0xFFFE) {
            nonNativeOrder = true;
            i = 1;
        } else if (firstChar === 0xFEFF) {
            nonNativeOrder = false;
            i = 1;
        }
    }

    let ret: string = "";
    // The reason that the buffer can't just be the final length of the string
    // is because we are passing it through ``String.fromCodePoint``, which accepts a vararg. Unlike
    // arrays, the vararg is limited by the call stack size of the environment. Therefore 255 is a magic
    // number deemed to be definitely below this limit.
    const codePointBufferSize: number = Math.min(srcLength - i, 255);
    const codePointBuffer: number[] = new Array(codePointBufferSize);
    let codePointBufferPos: number = 0;

    let code: number;
    while (i < srcLength) {
        code = u16[i++];
        if (nonNativeOrder) code = (code >> 8) | ((code & 0xFF) << 8);
        // Surrogate pairs
        if (code >= 0xD800 && code <= 0xDFFF && i < srcLength) {
            let lo: number = u16[i++];
            if (nonNativeOrder) lo = (lo >> 8) | ((lo & 0xFF) << 8);
            code = ((code - 0xD800) << 10) + lo + 0x2400;
        }

        codePointBuffer[codePointBufferPos++] = code;
        if (codePointBufferPos === codePointBufferSize) {
            ret += String.fromCodePoint.apply(null, codePointBuffer) as unknown as string;
            codePointBufferPos = 0;
        }
    }

    if (codePointBufferPos !== 0) {
        codePointBuffer.length = codePointBufferPos;
        ret += String.fromCodePoint.apply(null, codePointBuffer) as unknown as string;
    }
    return ret;
}
