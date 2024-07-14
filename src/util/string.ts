import { StringBuilder } from "./string/builder";
export { StringBuilder } from "./string/builder";

import { ICharset } from "./string/charset";
export type Charset = ICharset;

import { UTF8Charset } from "./string/charset/utf8";
import { UTF16Charset, UTF16BECharset, UTF16LECharset } from "./string/charset/utf16";
import { Iso88591Charset, ASCIICharset } from "./string/charset/iso88591";
import { ShiftJISCharset } from "./string/charset/sjis";

/**
 * Meant to replace both
 * <a href="https://docs.oracle.com/javase/8/docs/api/java/nio/charset/StandardCharsets.html">StandardCharsets</a>
 * and
 * <a href="https://github.com/zxing/zxing/blob/master/core/src/main/java/com/google/zxing/common/StringUtils.java">xzing/common/StringUtils</a>
 */
export const Charsets = {
    US_ASCII: new ASCIICharset() as Charset,
    ISO_8859_1: new Iso88591Charset() as Charset,
    UTF_8: new UTF8Charset() as Charset,
    UTF_16BE: new UTF16BECharset() as Charset,
    UTF_16LE: new UTF16LECharset() as Charset,
    UTF_16: new UTF16Charset() as Charset,
    SHIFT_JIS: new ShiftJISCharset() as Charset
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
/*
            case Charsets.GB2312:
                return [ 29 ];
*/
            default:
                return null;
        }
    }

}
