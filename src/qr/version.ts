
/*
 * Reference: https://github.com/zxing/zxing/blob/master/core/src/main/java/com/google/zxing/qrcode/decoder/Version.java
 */

import {ErrorCorrectionLevel} from "../ec/level";

export interface ECB {
    readonly count: number,
    readonly dataCodewords: number
}
export function ECB(count: number, dataCodewords: number): ECB {
    return { count, dataCodewords };
}

export class ECBlocks {
    readonly ecCodewordsPerBlock: number;
    readonly ecBlocks: ECB[];

    constructor(ecCodewordsPerBlock: number, ...ecBlocks: ECB[]) {
        this.ecCodewordsPerBlock = ecCodewordsPerBlock;
        this.ecBlocks = ecBlocks;
    }

    get numBlocks(): number {
        let total: number = 0;
        for (let ecb of this.ecBlocks) {
            total += ecb.count;
        }
        return total;
    }

    get totalECCodewords(): number {
        return this.ecCodewordsPerBlock * this.numBlocks;
    }
}

export class Version {

    readonly versionNumber: number;
    readonly alignmentPatternCenters: number[];
    private readonly ecBlocks: ECBlocks[];
    readonly totalCodewords: number;
    constructor(versionNumber: number, alignmentPatternCenters: number[], ...ecBlocks: ECBlocks[]) {
        this.versionNumber = versionNumber;
        this.alignmentPatternCenters = alignmentPatternCenters;
        this.ecBlocks = ecBlocks;

        let total: number = 0;
        let ecCodewords: number = ecBlocks[0].ecCodewordsPerBlock;
        const ecbArray: ECB[] = ecBlocks[0].ecBlocks;
        for (let ecBlock of ecbArray) {
            total += ecBlock.count * (ecBlock.dataCodewords + ecCodewords);
        }
        this.totalCodewords = total;
    }

    get dimensionForVersion(): number {
        return 17 + 4 * this.versionNumber;
    }

    getECBlocksForLevel(ecLevel: ErrorCorrectionLevel) {
        return this.ecBlocks[ErrorCorrectionLevel.getOrdinal(ecLevel)];
    }

    /*
    buildFunctionPattern(): BitMatrix {
        const dimension: number = this.dimensionForVersion;
        const bitMatrix = new BitMatrix(dimension, dimension);

        // Top left finder pattern + separator + format
        bitMatrix.setRegion(0, 0, 9, 9);
        // Top right finder pattern + separator + format
        bitMatrix.setRegion(dimension - 8, 0, 8, 9);
        // Bottom left finder pattern + separator + format
        bitMatrix.setRegion(0, dimension - 8, 9, 8);

        // Alignment patterns
        const max: number = this.alignmentPatternCenters.length;
        let i: number;
        for (let x=0; x < max; x++) {
            i = this.alignmentPatternCenters[x] - 2;
            for (let y=0; y < max; y++) {
                if ((x !== 0 || (y !== 0 && y !== max - 1)) && (x !== max - 1 || y !== 0)) {
                    bitMatrix.setRegion(this.alignmentPatternCenters[y] - 2, i, 5, 5);
                }
            }
        }

        // Vertical timing pattern
        bitMatrix.setRegion(6, 9, 1, dimension - 17);
        // Horizontal timing pattern
        bitMatrix.setRegion(9, 6, dimension - 17, 1);

        if (this.versionNumber > 6) {
            // Version info, top right
            bitMatrix.setRegion(dimension - 11, 0, 3, 6);
            // Version info, bottom left
            bitMatrix.setRegion(0, dimension - 11, 6, 3);
        }

        return bitMatrix;
    }
     */

}

export namespace Version {

    /*
    const VERSION_DECODE_INFO: Int32Array = new Int32Array([
        0x07C94, 0x085BC, 0x09A99, 0x0A4D3, 0x0BBF6,
        0x0C762, 0x0D847, 0x0E60D, 0x0F928, 0x10B78,
        0x1145D, 0x12A17, 0x13532, 0x149A6, 0x15683,
        0x168C9, 0x177EC, 0x18EC4, 0x191E1, 0x1AFAB,
        0x1B08E, 0x1CC1A, 0x1D33F, 0x1ED75, 0x1F250,
        0x209D5, 0x216F0, 0x228BA, 0x2379F, 0x24B0B,
        0x2542E, 0x26A64, 0x27541, 0x28C69
    ]);
     */

    // see buildVersions
    let VERSIONS: Version[] = [];

    export function getVersionForNumber(versionNumber: number): Version {
        if (versionNumber < 1 || versionNumber > 40) throw new Error(`Invalid version number ${versionNumber}`);
        return VERSIONS[versionNumber - 1];
    }

    /*
    export function getProvisionalVersionForDimension(dimension: number): Version {
        if (dimension % 4 !== 1) {
            throw new Error("Dimension is not 1 mod 4");
        }
        return getVersionForNumber((dimension - 17) >>> 2);
    }

    function decodeVersionInformation(versionBits: number): Version | null {
        let bestDifference: number = 0x7FFFFFFF;
        let bestVersion: number = 0;
        for (let i=0; i < VERSION_DECODE_INFO.length; i++) {
            const targetVersion: number = VERSION_DECODE_INFO[i];

            if (targetVersion === versionBits) return getVersionForNumber(i + 7);

            // https://stackoverflow.com/questions/43122082/efficiently-count-the-number-of-bits-in-an-integer-in-javascript
            let n: number = versionBits ^ targetVersion;
            n = n - ((n >> 1) & 0x55555555)
            n = (n & 0x33333333) + ((n >> 2) & 0x33333333)
            n = ((n + (n >> 4) & 0xF0F0F0F) * 0x1010101) >> 24;

            if (n < bestDifference) {
                bestVersion = i + 7;
                bestDifference = n;
            }
        }
        if (bestDifference <= 3) return getVersionForNumber(bestVersion);
        return null;
    }
    */

    //

    function buildVersions(): Version[] {
        return [
            new Version(1, [],
            new ECBlocks(7, ECB(1, 19)),
                new ECBlocks(10, ECB(1, 16)),
                new ECBlocks(13, ECB(1, 13)),
                new ECBlocks(17, ECB(1, 9))),
            new Version(2, [6, 18],
            new ECBlocks(10, ECB(1, 34)),
                new ECBlocks(16, ECB(1, 28)),
                new ECBlocks(22, ECB(1, 22)),
                new ECBlocks(28, ECB(1, 16))),
            new Version(3, [6, 22],
            new ECBlocks(15, ECB(1, 55)),
                new ECBlocks(26, ECB(1, 44)),
                new ECBlocks(18, ECB(2, 17)),
                new ECBlocks(22, ECB(2, 13))),
            new Version(4, [6, 26],
            new ECBlocks(20, ECB(1, 80)),
                new ECBlocks(18, ECB(2, 32)),
                new ECBlocks(26, ECB(2, 24)),
                new ECBlocks(16, ECB(4, 9))),
            new Version(5, [6, 30],
            new ECBlocks(26, ECB(1, 108)),
                new ECBlocks(24, ECB(2, 43)),
                new ECBlocks(18, ECB(2, 15),
                    ECB(2, 16)),
                new ECBlocks(22, ECB(2, 11),
                    ECB(2, 12))),
            new Version(6, [6, 34],
            new ECBlocks(18, ECB(2, 68)),
                new ECBlocks(16, ECB(4, 27)),
                new ECBlocks(24, ECB(4, 19)),
                new ECBlocks(28, ECB(4, 15))),
            new Version(7, [6, 22, 38],
            new ECBlocks(20, ECB(2, 78)),
                new ECBlocks(18, ECB(4, 31)),
                new ECBlocks(18, ECB(2, 14),
                    ECB(4, 15)),
                new ECBlocks(26, ECB(4, 13),
                    ECB(1, 14))),
            new Version(8, [6, 24, 42],
            new ECBlocks(24, ECB(2, 97)),
                new ECBlocks(22, ECB(2, 38),
                    ECB(2, 39)),
                new ECBlocks(22, ECB(4, 18),
                    ECB(2, 19)),
                new ECBlocks(26, ECB(4, 14),
                    ECB(2, 15))),
            new Version(9, [6, 26, 46],
            new ECBlocks(30, ECB(2, 116)),
                new ECBlocks(22, ECB(3, 36),
                    ECB(2, 37)),
                new ECBlocks(20, ECB(4, 16),
                    ECB(4, 17)),
                new ECBlocks(24, ECB(4, 12),
                    ECB(4, 13))),
            new Version(10, [6, 28, 50],
            new ECBlocks(18, ECB(2, 68),
                ECB(2, 69)),
                new ECBlocks(26, ECB(4, 43),
                    ECB(1, 44)),
                new ECBlocks(24, ECB(6, 19),
                    ECB(2, 20)),
                new ECBlocks(28, ECB(6, 15),
                    ECB(2, 16))),
            new Version(11, [6, 30, 54],
            new ECBlocks(20, ECB(4, 81)),
                new ECBlocks(30, ECB(1, 50),
                    ECB(4, 51)),
                new ECBlocks(28, ECB(4, 22),
                    ECB(4, 23)),
                new ECBlocks(24, ECB(3, 12),
                    ECB(8, 13))),
            new Version(12, [6, 32, 58],
            new ECBlocks(24, ECB(2, 92),
                ECB(2, 93)),
                new ECBlocks(22, ECB(6, 36),
                    ECB(2, 37)),
                new ECBlocks(26, ECB(4, 20),
                    ECB(6, 21)),
                new ECBlocks(28, ECB(7, 14),
                    ECB(4, 15))),
            new Version(13, [6, 34, 62],
            new ECBlocks(26, ECB(4, 107)),
                new ECBlocks(22, ECB(8, 37),
                    ECB(1, 38)),
                new ECBlocks(24, ECB(8, 20),
                    ECB(4, 21)),
                new ECBlocks(22, ECB(12, 11),
                    ECB(4, 12))),
            new Version(14, [6, 26, 46, 66],
            new ECBlocks(30, ECB(3, 115),
                ECB(1, 116)),
                new ECBlocks(24, ECB(4, 40),
                    ECB(5, 41)),
                new ECBlocks(20, ECB(11, 16),
                    ECB(5, 17)),
                new ECBlocks(24, ECB(11, 12),
                    ECB(5, 13))),
            new Version(15, [6, 26, 48, 70],
            new ECBlocks(22, ECB(5, 87),
                ECB(1, 88)),
                new ECBlocks(24, ECB(5, 41),
                    ECB(5, 42)),
                new ECBlocks(30, ECB(5, 24),
                    ECB(7, 25)),
                new ECBlocks(24, ECB(11, 12),
                    ECB(7, 13))),
            new Version(16, [6, 26, 50, 74],
            new ECBlocks(24, ECB(5, 98),
                ECB(1, 99)),
                new ECBlocks(28, ECB(7, 45),
                    ECB(3, 46)),
                new ECBlocks(24, ECB(15, 19),
                    ECB(2, 20)),
                new ECBlocks(30, ECB(3, 15),
                    ECB(13, 16))),
            new Version(17, [6, 30, 54, 78],
            new ECBlocks(28, ECB(1, 107),
                ECB(5, 108)),
                new ECBlocks(28, ECB(10, 46),
                    ECB(1, 47)),
                new ECBlocks(28, ECB(1, 22),
                    ECB(15, 23)),
                new ECBlocks(28, ECB(2, 14),
                    ECB(17, 15))),
            new Version(18, [6, 30, 56, 82],
            new ECBlocks(30, ECB(5, 120),
                ECB(1, 121)),
                new ECBlocks(26, ECB(9, 43),
                    ECB(4, 44)),
                new ECBlocks(28, ECB(17, 22),
                    ECB(1, 23)),
                new ECBlocks(28, ECB(2, 14),
                    ECB(19, 15))),
            new Version(19, [6, 30, 58, 86],
            new ECBlocks(28, ECB(3, 113),
                ECB(4, 114)),
                new ECBlocks(26, ECB(3, 44),
                    ECB(11, 45)),
                new ECBlocks(26, ECB(17, 21),
                    ECB(4, 22)),
                new ECBlocks(26, ECB(9, 13),
                    ECB(16, 14))),
            new Version(20, [6, 34, 62, 90],
            new ECBlocks(28, ECB(3, 107),
                ECB(5, 108)),
                new ECBlocks(26, ECB(3, 41),
                    ECB(13, 42)),
                new ECBlocks(30, ECB(15, 24),
                    ECB(5, 25)),
                new ECBlocks(28, ECB(15, 15),
                    ECB(10, 16))),
            new Version(21, [6, 28, 50, 72, 94],
            new ECBlocks(28, ECB(4, 116),
                ECB(4, 117)),
                new ECBlocks(26, ECB(17, 42)),
                new ECBlocks(28, ECB(17, 22),
                    ECB(6, 23)),
                new ECBlocks(30, ECB(19, 16),
                    ECB(6, 17))),
            new Version(22, [6, 26, 50, 74, 98],
            new ECBlocks(28, ECB(2, 111),
                ECB(7, 112)),
                new ECBlocks(28, ECB(17, 46)),
                new ECBlocks(30, ECB(7, 24),
                    ECB(16, 25)),
                new ECBlocks(24, ECB(34, 13))),
            new Version(23, [6, 30, 54, 78, 102],
            new ECBlocks(30, ECB(4, 121),
                ECB(5, 122)),
                new ECBlocks(28, ECB(4, 47),
                    ECB(14, 48)),
                new ECBlocks(30, ECB(11, 24),
                    ECB(14, 25)),
                new ECBlocks(30, ECB(16, 15),
                    ECB(14, 16))),
            new Version(24, [6, 28, 54, 80, 106],
            new ECBlocks(30, ECB(6, 117),
                ECB(4, 118)),
                new ECBlocks(28, ECB(6, 45),
                    ECB(14, 46)),
                new ECBlocks(30, ECB(11, 24),
                    ECB(16, 25)),
                new ECBlocks(30, ECB(30, 16),
                    ECB(2, 17))),
            new Version(25, [6, 32, 58, 84, 110],
            new ECBlocks(26, ECB(8, 106),
                ECB(4, 107)),
                new ECBlocks(28, ECB(8, 47),
                    ECB(13, 48)),
                new ECBlocks(30, ECB(7, 24),
                    ECB(22, 25)),
                new ECBlocks(30, ECB(22, 15),
                    ECB(13, 16))),
            new Version(26, [6, 30, 58, 86, 114],
            new ECBlocks(28, ECB(10, 114),
                ECB(2, 115)),
                new ECBlocks(28, ECB(19, 46),
                    ECB(4, 47)),
                new ECBlocks(28, ECB(28, 22),
                    ECB(6, 23)),
                new ECBlocks(30, ECB(33, 16),
                    ECB(4, 17))),
            new Version(27, [6, 34, 62, 90, 118],
            new ECBlocks(30, ECB(8, 122),
                ECB(4, 123)),
                new ECBlocks(28, ECB(22, 45),
                    ECB(3, 46)),
                new ECBlocks(30, ECB(8, 23),
                    ECB(26, 24)),
                new ECBlocks(30, ECB(12, 15),
                    ECB(28, 16))),
            new Version(28, [6, 26, 50, 74, 98, 122],
            new ECBlocks(30, ECB(3, 117),
                ECB(10, 118)),
                new ECBlocks(28, ECB(3, 45),
                    ECB(23, 46)),
                new ECBlocks(30, ECB(4, 24),
                    ECB(31, 25)),
                new ECBlocks(30, ECB(11, 15),
                    ECB(31, 16))),
            new Version(29, [6, 30, 54, 78, 102, 126],
            new ECBlocks(30, ECB(7, 116),
                ECB(7, 117)),
                new ECBlocks(28, ECB(21, 45),
                    ECB(7, 46)),
                new ECBlocks(30, ECB(1, 23),
                    ECB(37, 24)),
                new ECBlocks(30, ECB(19, 15),
                    ECB(26, 16))),
            new Version(30, [6, 26, 52, 78, 104, 130],
            new ECBlocks(30, ECB(5, 115),
                ECB(10, 116)),
                new ECBlocks(28, ECB(19, 47),
                    ECB(10, 48)),
                new ECBlocks(30, ECB(15, 24),
                    ECB(25, 25)),
                new ECBlocks(30, ECB(23, 15),
                    ECB(25, 16))),
            new Version(31, [6, 30, 56, 82, 108, 134],
            new ECBlocks(30, ECB(13, 115),
                ECB(3, 116)),
                new ECBlocks(28, ECB(2, 46),
                    ECB(29, 47)),
                new ECBlocks(30, ECB(42, 24),
                    ECB(1, 25)),
                new ECBlocks(30, ECB(23, 15),
                    ECB(28, 16))),
            new Version(32, [6, 34, 60, 86, 112, 138],
            new ECBlocks(30, ECB(17, 115)),
                new ECBlocks(28, ECB(10, 46),
                    ECB(23, 47)),
                new ECBlocks(30, ECB(10, 24),
                    ECB(35, 25)),
                new ECBlocks(30, ECB(19, 15),
                    ECB(35, 16))),
            new Version(33, [6, 30, 58, 86, 114, 142],
            new ECBlocks(30, ECB(17, 115),
                ECB(1, 116)),
                new ECBlocks(28, ECB(14, 46),
                    ECB(21, 47)),
                new ECBlocks(30, ECB(29, 24),
                    ECB(19, 25)),
                new ECBlocks(30, ECB(11, 15),
                    ECB(46, 16))),
            new Version(34, [6, 34, 62, 90, 118, 146],
            new ECBlocks(30, ECB(13, 115),
                ECB(6, 116)),
                new ECBlocks(28, ECB(14, 46),
                    ECB(23, 47)),
                new ECBlocks(30, ECB(44, 24),
                    ECB(7, 25)),
                new ECBlocks(30, ECB(59, 16),
                    ECB(1, 17))),
            new Version(35, [6, 30, 54, 78, 102, 126, 150],
            new ECBlocks(30, ECB(12, 121),
                ECB(7, 122)),
                new ECBlocks(28, ECB(12, 47),
                    ECB(26, 48)),
                new ECBlocks(30, ECB(39, 24),
                    ECB(14, 25)),
                new ECBlocks(30, ECB(22, 15),
                    ECB(41, 16))),
            new Version(36, [6, 24, 50, 76, 102, 128, 154],
            new ECBlocks(30, ECB(6, 121),
                ECB(14, 122)),
                new ECBlocks(28, ECB(6, 47),
                    ECB(34, 48)),
                new ECBlocks(30, ECB(46, 24),
                    ECB(10, 25)),
                new ECBlocks(30, ECB(2, 15),
                    ECB(64, 16))),
            new Version(37, [6, 28, 54, 80, 106, 132, 158],
            new ECBlocks(30, ECB(17, 122),
                ECB(4, 123)),
                new ECBlocks(28, ECB(29, 46),
                    ECB(14, 47)),
                new ECBlocks(30, ECB(49, 24),
                    ECB(10, 25)),
                new ECBlocks(30, ECB(24, 15),
                    ECB(46, 16))),
            new Version(38, [6, 32, 58, 84, 110, 136, 162],
            new ECBlocks(30, ECB(4, 122),
                ECB(18, 123)),
                new ECBlocks(28, ECB(13, 46),
                    ECB(32, 47)),
                new ECBlocks(30, ECB(48, 24),
                    ECB(14, 25)),
                new ECBlocks(30, ECB(42, 15),
                    ECB(32, 16))),
            new Version(39, [6, 26, 54, 82, 110, 138, 166],
            new ECBlocks(30, ECB(20, 117),
                ECB(4, 118)),
                new ECBlocks(28, ECB(40, 47),
                    ECB(7, 48)),
                new ECBlocks(30, ECB(43, 24),
                    ECB(22, 25)),
                new ECBlocks(30, ECB(10, 15),
                    ECB(67, 16))),
            new Version(40, [6, 30, 58, 86, 114, 142, 170],
            new ECBlocks(30, ECB(19, 118),
                ECB(6, 119)),
                new ECBlocks(28, ECB(18, 47),
                    ECB(31, 48)),
                new ECBlocks(30, ECB(34, 24),
                    ECB(34, 25)),
                new ECBlocks(30, ECB(20, 15),
                    ECB(61, 16)))
        ];
    }
    VERSIONS = buildVersions();

}
