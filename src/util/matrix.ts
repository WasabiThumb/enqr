import {BitMatrix} from "../collection/bitMatrix";
import {BitArray} from "../collection/bitArray";
import {ErrorCorrectionLevel} from "../ec/level";
import {Version} from "../qr/version";
import {TernaryMatrix} from "../collection/ternaryMatrix";
import {QRCode} from "../qr/qrcode";
import {MaskUtil} from "./mask";

/*
 * Reference: https://github.com/zxing/zxing/blob/master/core/src/main/java/com/google/zxing/qrcode/encoder/MatrixUtil.java
 */

export namespace MatrixUtil {

    export const POSITION_DETECTION_PATTERN: BitMatrix = BitMatrix.raw(7,127,65,93,93,93,65,127);

    export const POSITION_ADJUSTMENT_PATTERN: BitMatrix = BitMatrix.raw(5,31,17,21,17,31);

    export const POSITION_ADJUSTMENT_PATTERN_COORDINATE_TABLE: number[][] = [
        [ 6, 18 ],  // Version 2
        [ 6, 22 ],  // Version 3
        [ 6, 26 ],  // Version 4
        [ 6, 30 ],  // Version 5
        [ 6, 34 ],  // Version 6
        [ 6, 22, 38 ],  // Version 7
        [ 6, 24, 42 ],  // Version 8
        [ 6, 26, 46 ],  // Version 9
        [ 6, 28, 50 ],  // Version 10
        [ 6, 30, 54 ],  // Version 11
        [ 6, 32, 58 ],  // Version 12
        [ 6, 34, 62 ],  // Version 13
        [ 6, 26, 46, 66 ],  // Version 14
        [ 6, 26, 48, 70 ],  // Version 15
        [ 6, 26, 50, 74 ],  // Version 16
        [ 6, 30, 54, 78 ],  // Version 17
        [ 6, 30, 56, 82 ],  // Version 18
        [ 6, 30, 58, 86 ],  // Version 19
        [ 6, 34, 62, 90 ],  // Version 20
        [ 6, 28, 50, 72,  94 ],  // Version 21
        [ 6, 26, 50, 74,  98 ],  // Version 22
        [ 6, 30, 54, 78, 102 ],  // Version 23
        [ 6, 28, 54, 80, 106 ],  // Version 24
        [ 6, 32, 58, 84, 110 ],  // Version 25
        [ 6, 30, 58, 86, 114 ],  // Version 26
        [ 6, 34, 62, 90, 118 ],  // Version 27
        [ 6, 26, 50, 74,  98, 122 ],  // Version 28
        [ 6, 30, 54, 78, 102, 126 ],  // Version 29
        [ 6, 26, 52, 78, 104, 130 ],  // Version 30
        [ 6, 30, 56, 82, 108, 134 ],  // Version 31
        [ 6, 34, 60, 86, 112, 138 ],  // Version 32
        [ 6, 30, 58, 86, 114, 142 ],  // Version 33
        [ 6, 34, 62, 90, 118, 146 ],  // Version 34
        [ 6, 30, 54, 78, 102, 126, 150 ],  // Version 35
        [ 6, 24, 50, 76, 102, 128, 154 ],  // Version 36
        [ 6, 28, 54, 80, 106, 132, 158 ],  // Version 37
        [ 6, 32, 58, 84, 110, 136, 162 ],  // Version 38
        [ 6, 26, 54, 82, 110, 138, 166 ],  // Version 39
        [ 6, 30, 58, 86, 114, 142, 170 ],  // Version 40
    ];

    export const TYPE_INFO_COORDINATES: [ number, number ][] = [
        [ 8, 0 ],
        [ 8, 1 ],
        [ 8, 2 ],
        [ 8, 3 ],
        [ 8, 4 ],
        [ 8, 5 ],
        [ 8, 7 ],
        [ 8, 8 ],
        [ 7, 8 ],
        [ 5, 8 ],
        [ 4, 8 ],
        [ 3, 8 ],
        [ 2, 8 ],
        [ 1, 8 ],
        [ 0, 8 ],
    ];

    export const VERSION_INFO_POLY: number = 0x1f25;

    export const TYPE_INFO_POLY: number = 0x537;
    export const TYPE_INFO_MASK_PATTERN: number = 0x5412;

    // JSPORT: clearMatrix can now be skipped! :)

    export function buildMatrix(dataBits: BitArray, ecLevel: ErrorCorrectionLevel, version: Version, maskPattern: number, matrix: TernaryMatrix): void {
        embedBasicPatterns(version, matrix);
        embedTypeInfo(ecLevel, maskPattern, matrix);
        maybeEmbedVersionInfo(version, matrix);
        embedDataBits(dataBits, maskPattern, matrix);
    }

    export function embedBasicPatterns(version: Version, matrix: TernaryMatrix): void {
        embedPositionDetectionPatternsAndSeparators(matrix);
        embedDarkDotAtLeftBottomCorner(matrix);
        maybeEmbedPositionAdjustmentPatterns(version, matrix);
        embedTimingPatterns(matrix);
    }

    export function embedTypeInfo(ecLevel: ErrorCorrectionLevel, maskPattern: number, matrix: TernaryMatrix): void {
        const typeInfoBits = new BitArray();
        makeTypeInfoBits(ecLevel, maskPattern, typeInfoBits);

        for (let i=0; i < typeInfoBits.getSize(); i++) {
            let bit: boolean = typeInfoBits.get(typeInfoBits.getSize() - 1 - i);

            let [ x1, y1 ] = TYPE_INFO_COORDINATES[i];
            matrix.set(x1, y1, bit);

            let x2: number;
            let y2: number;
            if (i < 8) {
                // Right top corner
                x2 = matrix.width - i - 1;
                y2 = 8;
            } else {
                // Left bottom corner
                x2 = 8;
                y2 = matrix.height - 7 + (i - 8);
            }
            matrix.set(x2, y2, bit);
        }
    }

    export function maybeEmbedVersionInfo(version: Version, matrix: TernaryMatrix): void {
        if (version.versionNumber < 7) return;
        const versionInfoBits = new BitArray();
        makeVersionInfoBits(version, versionInfoBits);

        let bitIndex: number = 17;
        for (let i=0; i < 6; i++) {
            for (let j=0; j < 3; j++) {
                const bit: boolean = versionInfoBits.get(bitIndex--);
                // Left bottom corner
                matrix.set(i, matrix.height - 11 + j, bit);
                // Right bottom corner
                matrix.set(matrix.height - 11 + j, i, bit);
            }
        }
    }

    export function embedDataBits(dataBits: BitArray, maskPattern: number, matrix: TernaryMatrix): void {
        let bitIndex: number = 0;
        let direction: number = -1;
        let x: number = matrix.width - 1;
        let y: number = matrix.height - 1;
        while (x > 0) {
            // Skip the vertical timing pattern
            if (x === 6) x--;
            while (y >= 0 && y < matrix.height) {
                for (let i=0; i < 2; i++) {
                    let xx: number = x - i;
                    if (matrix.get(xx, y) !== -1) continue;
                    let bit: boolean;
                    if (bitIndex < dataBits.getSize()) {
                        bit = dataBits.get(bitIndex++);
                    } else {
                        bit = false;
                    }

                    if (maskPattern !== -1 && MaskUtil.getDataMaskBit(maskPattern, xx, y)) {
                        bit = !bit;
                    }
                    matrix.set(xx, y, bit);
                }
                y += direction;
            }
            direction = -direction;
            y += direction;
            x -= 2;
        }
    }

    // Called by embedBasicPatterns

    function embedTimingPatterns(matrix: TernaryMatrix): void {
        for (let i=8; i < matrix.width - 8; i++) {
            let bit: number = (i + 1) % 2;
            // Horizontal line
            if (matrix.get(i, 6) === -1) matrix.set(i, 6, bit);
            // Vertical line
            if (matrix.get(6, i) === -1) matrix.set(6, i, bit);
        }
    }

    function embedDarkDotAtLeftBottomCorner(matrix: TernaryMatrix): void {
        if (matrix.get(8, matrix.height - 8) === 0) throw new Error();
        matrix.set(8, matrix.height - 8, 1);
    }

    function embedHorizontalSeparationPattern(xStart: number, yStart: number, matrix: TernaryMatrix): void {
        for (let x=0; x < 8; x++) {
            if (matrix.get(xStart + x, yStart) !== -1) throw new Error(`Expected empty @ (${xStart + x}, ${yStart})`);
            matrix.set(xStart + x, yStart, 0);
        }
    }

    function embedVerticalSeparationPattern(xStart: number, yStart: number, matrix: TernaryMatrix): void {
        for (let y=0; y < 7; y++) {
            if (matrix.get(xStart, yStart + y) !== -1) throw new Error(`Expected empty @ (${xStart}, ${yStart + y})`);
            matrix.set(xStart, yStart + y, 0);
        }
    }

    function embedPositionAdjustmentPattern(xStart: number, yStart: number, matrix: TernaryMatrix): void {
        let row: BitArray = new BitArray(5);
        for (let y=0; y < 5; y++) {
            row = POSITION_ADJUSTMENT_PATTERN.getRow(y, row);
            for (let x=0; x < 5; x++) {
                matrix.set(xStart + x, yStart + y, row.get(x));
            }
        }
    }

    function embedPositionDetectionPattern(xStart: number, yStart: number, matrix: TernaryMatrix): void {
        let row: BitArray = new BitArray(7);
        for (let y=0; y < 7; y++) {
            row = POSITION_DETECTION_PATTERN.getRow(y, row);
            for (let x=0; x < 7; x++) {
                matrix.set(xStart + x, yStart + y, row.get(x));
            }
        }
    }

    function embedPositionDetectionPatternsAndSeparators(matrix: TernaryMatrix): void {
        const pdpWidth: number = POSITION_DETECTION_PATTERN.width;
        // Left top corner
        embedPositionDetectionPattern(0, 0, matrix);
        // Right top corner
        embedPositionDetectionPattern(matrix.width - pdpWidth, 0, matrix);
        // Left bottom corner
        embedPositionDetectionPattern(0, matrix.width - pdpWidth, matrix);

        const hspWidth: number = 8;
        // Left top corner
        embedHorizontalSeparationPattern(0, hspWidth - 1, matrix);
        // Right top corner
        embedHorizontalSeparationPattern(matrix.width - hspWidth, hspWidth - 1, matrix);
        // Left bottom corner
        embedHorizontalSeparationPattern(0, matrix.width - hspWidth, matrix);

        const vspSize: number = 7;
        // Left top corner
        embedVerticalSeparationPattern(vspSize, 0, matrix);
        // Right top corner
        embedVerticalSeparationPattern(matrix.height - vspSize - 1, 0, matrix);
        // Left bottom corner
        embedVerticalSeparationPattern(vspSize, matrix.height - vspSize, matrix);
    }

    function maybeEmbedPositionAdjustmentPatterns(version: Version, matrix: TernaryMatrix): void {
        if (version.versionNumber < 2) return;
        const index: number = version.versionNumber - 2;
        const coordinates: number[] = POSITION_ADJUSTMENT_PATTERN_COORDINATE_TABLE[index];
        for (let y of coordinates) {
            for (let x of coordinates) {
                if (matrix.get(x, y) === -1) {
                    embedPositionAdjustmentPattern(x - 2, y - 2, matrix);
                }
            }
        }
    }

    // Called by embedTypeInfo

    export function findMSBSet(value: number): number {
        return 32 - Math.clz32(value);
    }

    export function calculateBCHCode(value: number, poly: number): number {
        if (poly === 0) throw new Error("0 polynomial");

        const msbSetInPoly: number = findMSBSet(poly);
        value <<= msbSetInPoly - 1;

        while (findMSBSet(value) >= msbSetInPoly) {
            value ^= poly << (findMSBSet(value) - msbSetInPoly);
        }

        return value;
    }

    export function makeTypeInfoBits(ecLevel: ErrorCorrectionLevel, maskPattern: number, bits: BitArray): void {
        if (!QRCode.isValidMaskPattern(maskPattern)) {
            throw new Error("Invalid mask pattern");
        }

        let typeInfo: number = (ecLevel << 3) | maskPattern;
        bits.appendBits(typeInfo, 5);

        let bchCode: number = calculateBCHCode(typeInfo, TYPE_INFO_POLY);
        bits.appendBits(bchCode, 10);

        const maskBits = new BitArray();
        maskBits.appendBits(TYPE_INFO_MASK_PATTERN, 15);
        bits.xor(maskBits);
    }

    // Called by maybeEmbedVersionInfo

    export function makeVersionInfoBits(version: Version, bits: BitArray): void {
        bits.appendBits(version.versionNumber, 6);
        const bchCode: number = calculateBCHCode(version.versionNumber, VERSION_INFO_POLY);
        bits.appendBits(bchCode, 12);
    }

}
