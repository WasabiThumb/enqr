import {Version} from "./version";

/*
 * Reference: https://github.com/zxing/zxing/blob/master/core/src/main/java/com/google/zxing/qrcode/decoder/Mode.java
 */

export enum Mode {
    TERMINATOR = 0x00,
    NUMERIC = 0x01,
    ALPHANUMERIC = 0x02,
    STRUCTURED_APPEND = 0x03,
    BYTE = 0x04,
    ECI = 0x07,
    KANJI = 0x08,
    FNC1_FIRST_POSITION = 0x05,
    FNC1_SECOND_POSITION = 0x09,
    HANZI = 0x0D,
}

export namespace Mode {

    export function forBits(bits: number): Mode {
        if (bits < 0x00 || (bits > 0x09 && bits !== 0x0D) || bits === 0x06) {
            throw new Error("Invalid mode bits: 0x" + bits.toString(16));
        }
        return bits as unknown as Mode;
    }

    function getCharacterCountBits0(mode: Mode): [number, number, number] {
        switch (mode) {
            case Mode.NUMERIC:
                return [ 10, 12, 14 ];
            case Mode.ALPHANUMERIC:
                return [ 9, 11, 13 ];
            case Mode.BYTE:
                return [ 8, 16, 16 ];
            case Mode.KANJI:
            case Mode.HANZI:
                return [ 8, 10, 12 ];
            default:
                return [ 0, 0, 0 ];
        }
    }

    export function getCharacterCountBits(mode: Mode, version: Version): number {
        const no: number = version.versionNumber;
        let offset: 0 | 1 | 2;
        if (no <= 9) {
            offset = 0;
        } else if (no <= 26) {
            offset = 1;
        } else {
            offset = 2;
        }
        return getCharacterCountBits0(mode)[offset];
    }

}
